import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../../supabaseClient';
import { API_URL } from '../../../constants/config';
import Ionicons from '@expo/vector-icons/build/Ionicons';


type Produit = {
  produit_id: number;
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
  nouvelle_quantite: string;
};

export default function DemarrerInventaire() {
  const router = useRouter();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/produits`)
      .then((r) => r.json())
      .then((data) =>
        setProduits(data.map((p: Produit) => ({ ...p, nouvelle_quantite: '' })))
      )
      .catch(() => setErreur('Erreur lors du chargement des produits'))
      .finally(() => setChargement(false));
  }, []);

  function modifierQuantite(produitId: number, valeur: string) {
    setProduits((prev) =>
      prev.map((p) =>
        p.produit_id === produitId ? { ...p, nouvelle_quantite: valeur } : p
      )
    );
  }

  async function terminerInventaire() {
    setErreur('');

    const nonRemplis = produits.filter((p) => p.nouvelle_quantite === '');
    if (nonRemplis.length > 0) {
      Alert.alert(
        'Champs manquants',
        `${nonRemplis.length} produit(s) n'ont pas de quantité saisie. Continuer quand même ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Continuer', onPress: () => soumettre() },
        ]
      );
      return;
    }

    soumettre();
  }

  async function soumettre() {
    setEnvoi(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setErreur('Utilisateur non connecté');
        return;
      }

      const token = data.session.access_token;

      const lignes = produits.map((p) => ({
        produit_id: p.produit_id,
        quantite: p.nouvelle_quantite === '' ? 0 : Number(p.nouvelle_quantite),
      }));

      const response = await fetch(`${API_URL}/inventaires/demarrer-inventaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lignes }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'enregistrement");

      Alert.alert('Succès', 'Inventaire enregistré avec succès.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setErreur(e.message || 'Erreur inconnue');
    } finally {
      setEnvoi(false);
    }
  }

  if (chargement) {
    return (
      <View style={styles.centré}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* <Text style={styles.titre}>Démarrer un inventaire</Text> */}
      <Stack.Screen options={{
        title: 'Démarrer un inventaire',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.push('/(admin)/inventaire')} style={{ marginLeft: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )
      }} />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      {/* En-tête tableau */}
      <View style={styles.entete}>
        <Text style={[styles.enteteCol, { flex: 2 }]}>Produit</Text>
        <Text style={[styles.enteteCol, { flex: 1.2 }]}>Ancien</Text>
        <Text style={[styles.enteteCol, { flex: 1.5 }]}>Nouveau</Text>
        <Text style={[styles.enteteCol, { flex: 0.8 }]}>Unité</Text>
      </View>

      <FlatList
        data={produits}
        keyExtractor={(item) => item.produit_id.toString()}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <View style={[styles.ligne, index % 2 === 0 && styles.ligneImpaire]}>
            <View style={{ flex: 2 }}>
              <Text style={styles.nom} numberOfLines={1}>{item.nom}</Text>
              <Text style={styles.categorie}>{item.categorie}</Text>
            </View>
            <Text style={[styles.cellule, { flex: 1.2 }]}>{item.quantite}</Text>
            <TextInput
              style={[
                styles.input,
                { flex: 1.5 },
                item.nouvelle_quantite !== '' && styles.inputRempli,
              ]}
              value={item.nouvelle_quantite}
              onChangeText={(v) => modifierQuantite(item.produit_id, v)}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor="#ccc"
            />
            <Text style={[styles.cellule, { flex: 0.8 }]}>{item.unite}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separateur} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bouton, envoi && styles.boutonDisabled]}
          onPress={terminerInventaire}
          disabled={envoi}
        >
          {envoi ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.boutonTxt}>Terminer l'inventaire</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titre: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  erreur: { color: 'red', marginBottom: 12, fontSize: 13 },

  entete: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e8e8e8',
    borderRadius: 6,
    marginBottom: 4,
  },
  enteteCol: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
  },

  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  ligneImpaire: {
    backgroundColor: '#fafafa',
  },
  separateur: { height: 2 },

  nom: { fontSize: 14, fontWeight: '500', color: '#333' },
  categorie: { fontSize: 11, color: '#999', marginTop: 1 },
  cellule: { fontSize: 14, color: '#555', textAlign: 'center' },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    color: '#333',
    backgroundColor: 'white',
    textAlign: 'center',
    marginHorizontal: 4,
  },
  inputRempli: {
    borderColor: '#333',
    backgroundColor: '#f0f0f0',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bouton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  boutonDisabled: { backgroundColor: '#999' },
  boutonTxt: { color: 'white', fontSize: 16, fontWeight: '600' },
});