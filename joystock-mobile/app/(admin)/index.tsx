import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function Accueil() {
  async function deconnexion() {
    await supabase.auth.signOut();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Tableau de bord</Text>

      <TouchableOpacity style={styles.boutonDeconnexion} onPress={deconnexion}>
        <Text style={styles.boutonTxt}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  titre: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#333' },
  boutonDeconnexion: { backgroundColor: '#333', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 'auto' },
  boutonTxt: { color: 'white', fontSize: 16, fontWeight: '600' }
});