import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
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

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [produitSelectionne, setProduitSelectionne] = useState<Produit | null>(null);
  const [valeurSaisie, setValeurSaisie] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/produits`)
      .then((r) => r.json())
      .then((data) =>
        setProduits(data.map((p: Produit) => ({ ...p, nouvelle_quantite: '' })))
      )
      .catch(() => setErreur('Erreur lors du chargement des produits'))
      .finally(() => setChargement(false));
  }, []);

  function ouvrirModal(produit: Produit) {
    setProduitSelectionne(produit);
    setValeurSaisie(produit.nouvelle_quantite);
    setModalVisible(true);
  }

  function confirmerSaisie() {
    if (produitSelectionne) {
      setProduits((prev) =>
        prev.map((p) =>
          p.produit_id === produitSelectionne.produit_id
            ? { ...p, nouvelle_quantite: valeurSaisie }
            : p
        )
      );
    }
    setModalVisible(false);
    setProduitSelectionne(null);
    setValeurSaisie('');
  }

  function annulerModal() {
    setModalVisible(false);
    setProduitSelectionne(null);
    setValeurSaisie('');
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
    <View style={styles.container}>
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
            <TouchableOpacity
              style={[
                styles.boutonSaisie,
                { flex: 1.5 },
                item.nouvelle_quantite !== '' && styles.boutonSaisieRempli,
              ]}
              onPress={() => ouvrirModal(item)}
            >
              <Text style={[
                styles.boutonSaisieTxt,
                item.nouvelle_quantite !== '' && styles.boutonSaisieTxtRempli,
              ]}>
                {item.nouvelle_quantite !== '' ? item.nouvelle_quantite : '—'}
              </Text>
            </TouchableOpacity>
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

      {/* Modal de saisie */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={annulerModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenu}>
            <Text style={styles.modalTitre}>{produitSelectionne?.nom}</Text>
            <Text style={styles.modalSousTitre}>
              Stock actuel : {produitSelectionne?.quantite} {produitSelectionne?.unite}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={valeurSaisie}
              onChangeText={setValeurSaisie}
              keyboardType="decimal-pad"
              placeholder={`Nouvelle quantité (${produitSelectionne?.unite})`}
              placeholderTextColor="#aaa"
              autoFocus
            />

            <View style={styles.modalBoutons}>
              <TouchableOpacity style={styles.modalAnnuler} onPress={annulerModal}>
                <Text style={styles.modalAnnulerTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmer} onPress={confirmerSaisie}>
                <Text style={styles.modalConfirmerTxt}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  ligneImpaire: { backgroundColor: '#fafafa' },
  separateur: { height: 2 },

  nom: { fontSize: 14, fontWeight: '500', color: '#333' },
  categorie: { fontSize: 11, color: '#999', marginTop: 1 },
  cellule: { fontSize: 14, color: '#555', textAlign: 'center' },

  boutonSaisie: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'white',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  boutonSaisieRempli: {
    borderColor: '#333',
    backgroundColor: '#f0f0f0',
  },
  boutonSaisieTxt: { fontSize: 14, color: '#ccc' },
  boutonSaisieTxtRempli: { fontSize: 14, color: '#333', fontWeight: '600' },

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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitre: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  modalSousTitre: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBoutons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalAnnuler: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalAnnulerTxt: { color: '#555', fontWeight: '600' },
  modalConfirmer: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalConfirmerTxt: { color: 'white', fontWeight: '600' },
});