import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { API_URL } from '../../constants/config';

type Produit = {
  produit_id: number;
  nom: string;
  categorie: string;
  type_produit: string;
  quantite: number;
  unite: string;
};

export default function Produits() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [erreur, setErreur] = useState('');

  async function chargerProduits() {
    try {
      const response = await fetch(`${API_URL}/produits`);
      if (!response.ok) throw new Error('Erreur chargement');
      const data = await response.json();
      setProduits(data);
    } catch (error) {
      setErreur('Erreur lors du chargement des produits');
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }

  useEffect(() => { chargerProduits(); }, []);

  if (chargement) {
    return (
      <View style={styles.centré}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Produits</Text>

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
        renderItem={({ item }) => (
          <View style={styles.carte}>
            <View style={styles.carteHeader}>
              <Text style={styles.nom}>{item.nom}</Text>
              <Text style={styles.quantite}>{item.quantite} {item.unite}</Text>
            </View>
            <View style={styles.carteFooter}>
              <Text style={styles.badge}>{item.categorie}</Text>
              <Text style={styles.type}>{item.type_produit}</Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titre: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  erreur: { color: 'red', marginBottom: 12 },
  carte: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  carteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nom: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1 },
  quantite: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  carteFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 12, color: '#555' },
  type: { fontSize: 12, color: '#888' }
});