import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../supabaseClient';
import { API_URL } from '../../constants/config';

type Profil = {
  nom: string;
  prenom: string;
  email: string;
  role: string;
};

export default function Profil() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const response = await fetch(`${API_URL}/profiles/${data.session.user.id}`);
      const data2 = await response.json();
      setProfil(data2);
      setChargement(false);
    }
    charger();
  }, []);

  async function deconnexion() {
    await supabase.auth.signOut();
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
      {/* <Text style={styles.titre}>Mon profil</Text> */}

      {profil && (
        <View style={styles.carte}>
          <View style={styles.ligne}>
            <Text style={styles.label}>Prénom</Text>
            <Text style={styles.valeur}>{profil.prenom}</Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.label}>Nom</Text>
            <Text style={styles.valeur}>{profil.nom}</Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.valeur}>{profil.email}</Text>
          </View>
          <View style={styles.ligne}>
            <Text style={styles.label}>Rôle</Text>
            <Text style={[styles.valeur, { textTransform: 'capitalize' }]}>{profil.role}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.boutonDeconnexion} onPress={deconnexion}>
        <Text style={styles.boutonTxt}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titre: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  carte: { backgroundColor: 'white', borderRadius: 10, padding: 16, elevation: 2, marginBottom: 24 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  label: { fontSize: 14, color: '#888' },
  valeur: { fontSize: 14, fontWeight: '600', color: '#333' },
  boutonDeconnexion: { backgroundColor: '#333', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 'auto' },
  boutonTxt: { color: 'white', fontSize: 16, fontWeight: '600' }
});