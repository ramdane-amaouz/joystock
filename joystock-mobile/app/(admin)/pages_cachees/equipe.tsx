import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../../supabaseClient';
import { API_URL } from '../../../constants/config';
import Ionicons from '@expo/vector-icons/build/Ionicons';

type Membre = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
};

export default function Equipe() {
  const router = useRouter();
  const [membres, setMembres] = useState<Membre[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [membreADesactiver, setMembreADesactiver] = useState<Membre | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    chargerMembres();
  }, []);

  async function chargerMembres() {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Utilisateur non connecté');

      const response = await fetch(`${API_URL}/profiles/`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement');
      setMembres(await response.json());
    } catch (e: any) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function desactiverMembre() {
    if (!membreADesactiver) return;
    setEnvoi(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Utilisateur non connecté');

      const response = await fetch(`${API_URL}/profiles/${membreADesactiver.id}/desactiver`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur lors de la désactivation');
      }

      setMembres((prev) => prev.filter((m) => m.id !== membreADesactiver.id));
      setMembreADesactiver(null);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
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
        title: 'Équipe',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.push('/(admin)/')} style={{ marginLeft: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )
      }} />

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      {membres.length === 0 ? (
        <View style={styles.vide}>
          <Text style={styles.videTxt}>Aucun membre actif trouvé.</Text>
        </View>
      ) : (
        <FlatList
          data={membres}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.carte}>
              <View style={styles.carteGauche}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTxt}>
                    {item.prenom?.[0]?.toUpperCase()}{item.nom?.[0]?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.infos}>
                  <Text style={styles.nom}>{item.prenom} {item.nom}</Text>
                  <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                  <View style={[styles.badge, item.role === 'admin' ? styles.badgeAdmin : styles.badgeEmploye]}>
                    <Text style={[styles.badgeTxt, item.role === 'admin' ? styles.badgeTxtAdmin : styles.badgeTxtEmploye]}>
                      {item.role}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.boutonDesactiver}
                onPress={() => setMembreADesactiver(item)}
              >
                <Ionicons name="person-remove-outline" size={20} color="#e53e3e" />
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Modal de confirmation */}
      <Modal
        visible={membreADesactiver !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMembreADesactiver(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenu}>
            <Text style={styles.modalTitre}>Désactiver ce membre ?</Text>
            <Text style={styles.modalMessage}>
              {membreADesactiver?.prenom} {membreADesactiver?.nom} ne pourra plus se connecter à JoyStock.
            </Text>

            <View style={styles.modalBoutons}>
              <TouchableOpacity
                style={styles.modalAnnuler}
                onPress={() => setMembreADesactiver(null)}
                disabled={envoi}
              >
                <Text style={styles.modalAnnulerTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmer, envoi && { backgroundColor: '#999' }]}
                onPress={desactiverMembre}
                disabled={envoi}
              >
                {envoi ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalConfirmerTxt}>Désactiver</Text>
                )}
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
  erreur: { color: 'red', marginBottom: 12 },

  vide: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  videTxt: { fontSize: 15, color: '#555' },

  carte: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  carteGauche: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarTxt: { color: 'white', fontWeight: '700', fontSize: 15 },
  infos: { flex: 1 },
  nom: { fontSize: 15, fontWeight: '600', color: '#333' },
  email: { fontSize: 12, color: '#999', marginTop: 2, marginBottom: 6 },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeAdmin: { backgroundColor: '#ebf8ff' },
  badgeEmploye: { backgroundColor: '#f0fff4' },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  badgeTxtAdmin: { color: '#2b6cb0' },
  badgeTxtEmploye: { color: '#276749' },

  boutonDesactiver: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7d7',
    backgroundColor: '#fff5f5',
    marginLeft: 12,
  },

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
  },
  modalTitre: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
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
    backgroundColor: '#e53e3e',
    alignItems: 'center',
  },
  modalConfirmerTxt: { color: 'white', fontWeight: '600' },
});