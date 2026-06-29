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
  quantite_commandee: string;
  quantite_recue: string;
};

export default function ReceptionLivraison() {
  const router = useRouter();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [produitSelectionne, setProduitSelectionne] = useState<Produit | null>(null);
  const [valeurCommandee, setValeurCommandee] = useState('');
  const [valeurRecue, setValeurRecue] = useState('');

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

  function ouvrirModal(produit: Produit) {
    setProduitSelectionne(produit);
    setValeurCommandee(produit.quantite_commandee);
    setValeurRecue(produit.quantite_recue);
    setModalVisible(true);
  }

  function confirmerSaisie() {
    if (produitSelectionne) {
      setProduits((prev) =>
        prev.map((p) =>
          p.produit_id === produitSelectionne.produit_id
            ? { ...p, quantite_commandee: valeurCommandee, quantite_recue: valeurRecue }
            : p
        )
      );
    }
    setModalVisible(false);
    setProduitSelectionne(null);
    setValeurCommandee('');
    setValeurRecue('');
  }

  function annulerModal() {
    setModalVisible(false);
    setProduitSelectionne(null);
    setValeurCommandee('');
    setValeurRecue('');
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
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Réception de livraison',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.push('/(admin)/inventaire')} style={{ marginLeft: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )
      }} />

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
        renderItem={({ item, index }) => {
          const estSaisi = item.quantite_commandee !== '' || item.quantite_recue !== '';
          return (
            <TouchableOpacity
              style={[
                styles.ligne,
                index % 2 === 0 && styles.ligneImpaire,
                estSaisi && styles.ligneSaisie,
              ]}
              onPress={() => ouvrirModal(item)}
            >
              <View style={{ flex: 2 }}>
                <Text style={styles.nom} numberOfLines={1}>{item.nom}</Text>
                <Text style={styles.stockActuel}>Stock: {item.quantite} {item.unite}</Text>
              </View>
              <Text style={[styles.celluleSaisie, { flex: 1.3 }, item.quantite_commandee !== '' && styles.celluleSaisieRemplie]}>
                {item.quantite_commandee !== '' ? item.quantite_commandee : '—'}
              </Text>
              <Text style={[styles.celluleSaisie, { flex: 1.3 }, item.quantite_recue !== '' && styles.celluleSaisieRemplie]}>
                {item.quantite_recue !== '' ? item.quantite_recue : '—'}
              </Text>
              <Text style={[styles.unite, { flex: 0.8 }]}>{item.unite}</Text>
            </TouchableOpacity>
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

            <Text style={styles.modalLabel}>Quantité commandée</Text>
            <TextInput
              style={styles.modalInput}
              value={valeurCommandee}
              onChangeText={setValeurCommandee}
              keyboardType="decimal-pad"
              placeholder={`Commandée (${produitSelectionne?.unite})`}
              placeholderTextColor="#aaa"
              autoFocus
            />

            <Text style={styles.modalLabel}>Quantité reçue</Text>
            <TextInput
              style={styles.modalInput}
              value={valeurRecue}
              onChangeText={setValeurRecue}
              keyboardType="decimal-pad"
              placeholder={`Reçue (${produitSelectionne?.unite})`}
              placeholderTextColor="#aaa"
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
    paddingVertical: 12,
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

  celluleSaisie: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginHorizontal: 3,
  },
  celluleSaisieRemplie: {
    color: '#333',
    fontWeight: '600',
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
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalBoutons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
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