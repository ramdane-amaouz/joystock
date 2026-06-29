import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabaseClient';
import { API_URL } from '../../constants/config';

type Produit = {
  produit_id: number;
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
};

type Alerte = {
  produit_id: number;
  produit_nom: string;
  stock_theorique: number;
  seuil_alerte: number;
  unite: string;
};

export default function AccueilAdmin() {
  const router = useRouter();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  async function fetchAvecToken(url: string) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Non connecté');
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${data.session.access_token}` }
    });
    if (!response.ok) throw new Error('Erreur chargement');
    return response.json();
  }

  useEffect(() => {
    async function charger() {
      try {
        const [produitsData, alertesData] = await Promise.all([
          fetch(`${API_URL}/produits`).then(r => r.json()),
          fetchAvecToken(`${API_URL}/stats/alertes-stock`),
        ]);

        setProduits(produitsData.slice(0, 5));
        setAlertes(alertesData);
      } catch (e: any) {
        setErreur(e.message);
      } finally {
        setChargement(false);
      }
    }
    charger();
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

      {/* Alertes */}
      {alertes.length > 0 ? (
        <View style={styles.blocAlerte}>
          <Text style={styles.blocAlerteTitre}>⚠️ Produits en rupture imminente</Text>
          {alertes.slice(0, 5).map(alerte => (
            <View key={alerte.produit_id} style={styles.ligneAlerte}>
              <Text style={styles.ligneAlerteNom}>{alerte.produit_nom}</Text>
              <Text style={styles.ligneAlerteStock}>{alerte.stock_theorique} {alerte.unite}</Text>
              <Text style={styles.ligneAlerteSeuil}>/ {alerte.seuil_alerte}</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => router.push('/(admin)/pages_cachees/alertes')}>
            <Text style={styles.lienAlerte}>Voir toutes les alertes ({alertes.length}) →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.blocOk}>
          <Text style={styles.blocOkIcone}>✅</Text>
          <Text style={styles.blocOkTxt}>Tous les stocks sont au-dessus du seuil critique.</Text>
        </View>
      )}

      {/*Actions rapides */} 
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
        <TouchableOpacity onPress={() => router.push('/(admin)/produits')} style={styles.voirPlus}>
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

  blocOk: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  blocOkIcone: { fontSize: 32, marginBottom: 8 },
  blocOkTxt: { fontSize: 14, color: '#555', textAlign: 'center' },

  blocAlerte: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#f1b0b0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  blocAlerteTitre: { fontSize: 15, fontWeight: '700', color: '#e53e3e', marginBottom: 12 },
  ligneAlerte: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fde8e8',
  },
  ligneAlerteNom: { flex: 1, fontWeight: '600', color: '#333' },
  ligneAlerteStock: { color: '#e53e3e', fontWeight: 'bold', marginRight: 4 },
  ligneAlerteSeuil: { color: '#888', fontSize: 13 },
  lienAlerte: { fontSize: 13, color: '#e53e3e', marginTop: 12, fontWeight: '600' },

  bloc: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  blocTitre: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  ligneProduit: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  separateur: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  produitNom: { fontSize: 14, fontWeight: '500', color: '#333' },
  produitCategorie: { fontSize: 12, color: '#999', marginTop: 2 },
  produitQuantite: { fontSize: 14, fontWeight: '600', color: '#333' },
  voirPlus: { marginTop: 12, alignItems: 'flex-end' },
  voirPlusTxt: { color: '#007BFF', fontSize: 14 },
});