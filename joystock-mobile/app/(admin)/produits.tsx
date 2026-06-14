import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabaseClient';
import { API_URL } from '../../constants/config';

type Produit = {
  produit_id: number;
  nom: string;
  categorie: string;
  type_produit: string;
  quantite: number;
  unite: string;
  seuil_alerte: number | null;
};

export default function Produits() {
  const router = useRouter();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [erreur, setErreur] = useState('');

  // Modal seuil
  const [modalOuvert, setModalOuvert] = useState(false);
  const [produitSelectionne, setProduitSelectionne] = useState<Produit | null>(null);
  const [nouveauSeuil, setNouveauSeuil] = useState('');
  const [envoiSeuil, setEnvoiSeuil] = useState(false);
  const [erreurModal, setErreurModal] = useState('');

  async function chargerProduits() {
    try {
      const response = await fetch(`${API_URL}/produits`);
      if (!response.ok) throw new Error('Erreur chargement');
      const data = await response.json();
      setProduits(data);
    } catch {
      setErreur('Erreur lors du chargement des produits');
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }

  useEffect(() => { chargerProduits(); }, []);

  function ouvrirModal(produit: Produit) {
    setProduitSelectionne(produit);
    setNouveauSeuil(String(produit.seuil_alerte ?? 0));
    setErreurModal('');
    setModalOuvert(true);
  }

  function fermerModal() {
    setModalOuvert(false);
    setProduitSelectionne(null);
    setNouveauSeuil('');
    setErreurModal('');
  }

  async function enregistrerSeuil() {
    if (!produitSelectionne) return;
    setErreurModal('');
    setEnvoiSeuil(true);

    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Non connecté');

      const response = await fetch(
        `${API_URL}/produits/${produitSelectionne.produit_id}/seuil-alerte`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ seuil_alerte: Number(nouveauSeuil) }),
        }
      );

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      fermerModal();
      chargerProduits();
    } catch (e: any) {
      setErreurModal(e.message || 'Erreur inconnue');
    } finally {
      setEnvoiSeuil(false);
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

      {/* Header */}
      <View style={styles.header}>
        {/* <Text style={styles.titre}>Produits</Text> */}
        <TouchableOpacity
          style={styles.boutonAjouter}
          onPress={() => router.push('/(admin)/pages_cachees/ajout-produit' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.boutonAjouterTxt}>+ Créer</Text>
        </TouchableOpacity>
      </View>

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <FlatList
        data={produits}
        keyExtractor={(item) => item.produit_id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={rafraichissement}
            onRefresh={() => { setRafraichissement(true); chargerProduits(); }}
          />
        }
        renderItem={({ item }) => {
          const sousLeSeuil =
            item.seuil_alerte !== null &&
            item.seuil_alerte > 0 &&
            item.quantite <= item.seuil_alerte;

          return (
            <View style={[styles.carte, sousLeSeuil && styles.carteAlerte]}>
              <View style={styles.carteHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nom}>{item.nom}</Text>
                  <Text style={styles.categorie}>{item.categorie}</Text>
                </View>
                <View style={styles.carteHeaderDroite}>
                  <Text style={[styles.quantite, sousLeSeuil && styles.quantiteAlerte]}>
                    {item.quantite} {item.unite}
                  </Text>
                  <TouchableOpacity
                    style={styles.boutonSeuil}
                    onPress={() => ouvrirModal(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.boutonSeuilTxt}>⚙️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.carteFooter}>
                <Text style={styles.badge}>{item.type_produit}</Text>
                <Text style={styles.seuil}>
                  Seuil : {item.seuil_alerte ?? 0} {item.unite}
                  {sousLeSeuil && <Text style={styles.alerteTxt}> ⚠️</Text>}
                </Text>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Modal seuil d'alerte */}
      <Modal
        visible={modalOuvert}
        transparent
        animationType="fade"
        onRequestClose={fermerModal}
      >
        <Pressable style={styles.overlay} onPress={fermerModal}>
          <Pressable style={styles.modal} onPress={() => {}}>

            <Text style={styles.modalTitre}>Seuil d'alerte</Text>
            {produitSelectionne && (
              <Text style={styles.modalSousTitre}>{produitSelectionne.nom}</Text>
            )}

            {erreurModal ? (
              <Text style={styles.erreurModal}>{erreurModal}</Text>
            ) : null}

            <Text style={styles.modalLabel}>
              Stock minimum ({produitSelectionne?.unite})
            </Text>
            <TextInput
              style={styles.modalInput}
              value={nouveauSeuil}
              onChangeText={setNouveauSeuil}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#bbb"
            />

            <View style={styles.modalBoutons}>
              <TouchableOpacity
                style={[styles.modalBouton, styles.modalBoutonPrimaire, envoiSeuil && styles.boutonDisabled]}
                onPress={enregistrerSeuil}
                disabled={envoiSeuil}
              >
                {envoiSeuil
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={styles.modalBoutonPrimaireTxt}>Enregistrer</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBouton, styles.modalBoutonSecondaire]}
                onPress={fermerModal}
                disabled={envoiSeuil}
              >
                <Text style={styles.modalBoutonSecondaireTxt}>Annuler</Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titre: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  boutonAjouter: {
    backgroundColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  boutonAjouterTxt: { color: 'white', fontSize: 14, fontWeight: '600' },
  erreur: { color: 'red', marginBottom: 12 },

  carte: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  carteAlerte: {
    borderLeftWidth: 3,
    borderLeftColor: '#e53e3e',
  },
  carteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  carteHeaderDroite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nom: { fontSize: 16, fontWeight: '600', color: '#333' },
  categorie: { fontSize: 12, color: '#999', marginTop: 2 },
  quantite: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  quantiteAlerte: { color: '#e53e3e' },
  boutonSeuil: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 5,
  },
  boutonSeuilTxt: { fontSize: 14 },

  carteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 12,
    color: '#555',
  },
  seuil: { fontSize: 12, color: '#888' },
  alerteTxt: { color: '#e53e3e' },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitre: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  modalSousTitre: { fontSize: 14, color: '#888', marginBottom: 20 },
  erreurModal: { color: 'red', fontSize: 13, marginBottom: 12 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  modalBoutons: { flexDirection: 'row', gap: 10 },
  modalBouton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalBoutonPrimaire: { backgroundColor: '#333' },
  modalBoutonPrimaireTxt: { color: 'white', fontWeight: '600', fontSize: 15 },
  modalBoutonSecondaire: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd' },
  modalBoutonSecondaireTxt: { color: '#333', fontWeight: '500', fontSize: 15 },
  boutonDisabled: { backgroundColor: '#999' },
});