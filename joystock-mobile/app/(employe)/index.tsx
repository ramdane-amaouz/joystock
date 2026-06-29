import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../../constants/config';

type Produit = {
  produit_id: number;
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
};

export default function AccueilEmploye() {
  const router = useRouter();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/produits`)
      .then(r => r.json())
      .then(data => setProduits(data.slice(0, 5)))
      .catch(() => setErreur('Erreur lors du chargement des produits'))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) {
    return (
      <View style={styles.centré}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      {/* Actions rapides */}
      <View style={styles.bloc}>
        <Text style={styles.blocTitre}>Actions rapides</Text>

        <TouchableOpacity
          style={styles.action}
          onPress={() => router.push('/(employe)/pages_cachees/demarrer-inventaire')}
        >
          <Text style={styles.actionIcone}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitre}>Démarrer un inventaire</Text>
            <Text style={styles.actionSous}>Saisir les quantités actuelles</Text>
          </View>
          <Text style={styles.actionFleche}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={() => router.push('/(employe)/pages_cachees/reception-livraison')}
        >
          <Text style={styles.actionIcone}>📦</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitre}>Réceptionner une livraison</Text>
            <Text style={styles.actionSous}>Enregistrer les marchandises reçues</Text>
          </View>
          <Text style={styles.actionFleche}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.action, { borderBottomWidth: 0 }]}
          onPress={() => router.push('/(employe)/produits')}
        >
          <Text style={styles.actionIcone}>🔍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitre}>Consulter les produits</Text>
            <Text style={styles.actionSous}>Voir l'état du stock</Text>
          </View>
          <Text style={styles.actionFleche}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Aperçu produits */}
      <View style={styles.bloc}>
        <Text style={styles.blocTitre}>Aperçu des produits</Text>
        {produits.map((produit, index) => (
          <View key={produit.produit_id} style={[
            styles.ligneProduit,
            index < produits.length - 1 && styles.separateur
          ]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.produitNom}>{produit.nom}</Text>
              <Text style={styles.produitCategorie}>{produit.categorie}</Text>
            </View>
            <Text style={styles.produitQuantite}>{produit.quantite} {produit.unite}</Text>
          </View>
        ))}
        <TouchableOpacity onPress={() => router.push('/(employe)/produits')} style={styles.voirPlus}>
          <Text style={styles.voirPlusTxt}>Voir tous les produits →</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  erreur: { color: 'red', marginBottom: 12 },

  bloc: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  blocTitre: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },

  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIcone: { fontSize: 24, marginRight: 14 },
  actionTitre: { fontSize: 15, fontWeight: '600', color: '#333' },
  actionSous: { fontSize: 12, color: '#999', marginTop: 2 },
  actionFleche: { fontSize: 22, color: '#ccc' },

  ligneProduit: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  separateur: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  produitNom: { fontSize: 14, fontWeight: '500', color: '#333' },
  produitCategorie: { fontSize: 12, color: '#999', marginTop: 2 },
  produitQuantite: { fontSize: 14, fontWeight: '600', color: '#333' },
  voirPlus: { marginTop: 12, alignItems: 'flex-end' },
  voirPlusTxt: { color: '#007BFF', fontSize: 14 },
});