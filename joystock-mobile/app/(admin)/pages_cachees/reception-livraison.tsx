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
import { useRouter } from 'expo-router';
import { supabase } from '../../../supabaseClient';
import { API_URL } from '../../../constants/config';

type Produit = {
  produit_id: number;
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
  quantite_commandee: string;
  quantite_recue: string;
};

export default function ReceptionLivraison() {
  const router = useRouter();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/produits`)
      .then((r) => r.json())
      .then((data) =>
        setProduits(
          data.map((p: Produit) => ({
            ...p,
            quantite_commandee: '',
            quantite_recue: '',
          }))
        )
      )
      .catch(() => setErreur('Erreur lors du chargement des produits'))
      .finally(() => setChargement(false));
  }, []);

  function modifierChamp(produitId: number, champ: 'quantite_commandee' | 'quantite_recue', valeur: string) {
    setProduits((prev) =>
      prev.map((p) =>
        p.produit_id === produitId ? { ...p, [champ]: valeur } : p
      )
    );
  }

  async function terminerReception() {
    setErreur('');

    const lignesRemplies = produits.filter(
      (p) => p.quantite_commandee !== '' || p.quantite_recue !== ''
    );

    if (lignesRemplies.length === 0) {
      Alert.alert('Attention', 'Veuillez saisir au moins une ligne de réception.');
      return;
    }

    setEnvoi(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setErreur('Utilisateur non connecté');
        return;
      }

      const token = data.session.access_token;

      const lignes = lignesRemplies.map((p) => ({
        produit_id: p.produit_id,
        quantite_commandee: p.quantite_commandee === '' ? 0 : Number(p.quantite_commandee),
        quantite: p.quantite_recue === '' ? 0 : Number(p.quantite_recue),
      }));

      const response = await fetch(`${API_URL}/inventaires/reception-livraison`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lignes }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'enregistrement");

      Alert.alert('Succès', 'Réception enregistrée avec succès.', [
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

  const nbLignesRemplies = produits.filter(
    (p) => p.quantite_commandee !== '' || p.quantite_recue !== ''
  ).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.titre}>Réception de livraison</Text>

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      {nbLignesRemplies > 0 && (
        <View style={styles.compteur}>
          <Text style={styles.compteurTxt}>
            {nbLignesRemplies} produit{nbLignesRemplies > 1 ? 's' : ''} saisi{nbLignesRemplies > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* En-tête tableau */}
      <View style={styles.entete}>
        <Text style={[styles.enteteCol, { flex: 2 }]}>Produit</Text>
        <Text style={[styles.enteteCol, { flex: 1.3, textAlign: 'center' }]}>Cmd.</Text>
        <Text style={[styles.enteteCol, { flex: 1.3, textAlign: 'center' }]}>Reçu</Text>
        <Text style={[styles.enteteCol, { flex: 0.8 }]}>Unité</Text>
      </View>

      <FlatList
        data={produits}
        keyExtractor={(item) => item.produit_id.toString()}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => {
          const estSaisi = item.quantite_commandee !== '' || item.quantite_recue !== '';
          return (
            <View style={[
              styles.ligne,
              index % 2 === 0 && styles.ligneImpaire,
              estSaisi && styles.ligneSaisie,
            ]}>
              <View style={{ flex: 2 }}>
                <Text style={styles.nom} numberOfLines={1}>{item.nom}</Text>
                <Text style={styles.stockActuel}>Stock: {item.quantite} {item.unite}</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1.3 }, item.quantite_commandee !== '' && styles.inputRempli]}
                value={item.quantite_commandee}
                onChangeText={(v) => modifierChamp(item.produit_id, 'quantite_commandee', v)}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor="#ccc"
              />
              <TextInput
                style={[styles.input, { flex: 1.3 }, item.quantite_recue !== '' && styles.inputRempli]}
                value={item.quantite_recue}
                onChangeText={(v) => modifierChamp(item.produit_id, 'quantite_recue', v)}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor="#ccc"
              />
              <Text style={[styles.unite, { flex: 0.8 }]}>{item.unite}</Text>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separateur} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bouton, envoi && styles.boutonDisabled]}
          onPress={terminerReception}
          disabled={envoi}
        >
          {envoi ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.boutonTxt}>Enregistrer la réception</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titre: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  erreur: { color: 'red', marginBottom: 12, fontSize: 13 },

  compteur: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  compteurTxt: { color: 'white', fontSize: 12, fontWeight: '600' },

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
  ligneImpaire: { backgroundColor: '#fafafa' },
  ligneSaisie: {
    borderLeftWidth: 3,
    borderLeftColor: '#333',
  },
  separateur: { height: 2 },

  nom: { fontSize: 14, fontWeight: '500', color: '#333' },
  stockActuel: { fontSize: 11, color: '#999', marginTop: 1 },
  unite: { fontSize: 13, color: '#777', textAlign: 'center' },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 14,
    color: '#333',
    backgroundColor: 'white',
    textAlign: 'center',
    marginHorizontal: 3,
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