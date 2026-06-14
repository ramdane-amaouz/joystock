import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { useSession } from '../../hooks/useSession';
import { useProfile } from '../../hooks/useProfile';

export default function Inventaire() {
  const router = useRouter();

  const { session } = useSession();
  const profil = useProfile(session);

  const base = profil?.role === 'admin' ? '/(admin)' : '/(employe)';

  return (
    <View style={styles.container}>
      {/* <Text style={styles.titre}>Inventaire</Text> */}

      <TouchableOpacity
        style={styles.carte}
        onPress={() => router.push(`${base}/pages_cachees/demarrer-inventaire` as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.carteIcone}>📋</Text>
        <View style={styles.carteTextes}>
          <Text style={styles.cartetitre}>Démarrer un inventaire</Text>
          <Text style={styles.carteSous}>Saisir les quantités actuelles en stock</Text>
        </View>
        <Text style={styles.fleche}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.carte}
        onPress={() => router.push(`${base}/pages_cachees/reception-livraison` as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.carteIcone}>📦</Text>
        <View style={styles.carteTextes}>
          <Text style={styles.cartetitre}>Réceptionner une livraison</Text>
          <Text style={styles.carteSous}>Enregistrer les quantités reçues</Text>
        </View>
        <Text style={styles.fleche}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  titre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  carte: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  carteIcone: {
    fontSize: 28,
    marginRight: 16,
  },
  carteTextes: {
    flex: 1,
  },
  cartetitre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  carteSous: {
    fontSize: 13,
    color: '#888',
  },
  fleche: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: '300',
  },
});