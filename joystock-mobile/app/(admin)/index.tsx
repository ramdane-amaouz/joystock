import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';
import { API_URL } from '../../constants/config';

type Produit = {
  produit_id: number;
  nom: string;
  categorie: string;
  type_produit: string;
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
  const [totalProduits, setTotalProduits] = useState(0);
  const [stockTotal, setStockTotal] = useState(0);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [totalVentesJour, setTotalVentesJour] = useState(0);
  const [topProduit, setTopProduit] = useState<any>(null);
  const [topRecette, setTopRecette] = useState<any>(null);
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
        const [count, unites, produitsData, alertesData, ventesJour, topConso, topRecettes] =
          await Promise.all([
            fetch(`${API_URL}/produits/count`).then(r => r.json()),
            fetch(`${API_URL}/produits/total-unites`).then(r => r.json()),
            fetch(`${API_URL}/produits`).then(r => r.json()),
            fetchAvecToken(`${API_URL}/stats/alertes-stock`),
            fetchAvecToken(`${API_URL}/stats/ventes/par-jour`),
            fetchAvecToken(`${API_URL}/stats/derniere-consommation`),
            fetchAvecToken(`${API_URL}/stats/ventes/total-recettes`)
          ]);

        setTotalProduits(count.count);
        setStockTotal(unites.total_unites);
        setProduits(produitsData.slice(0, 5));
        setAlertes(alertesData);

        const aujourd_hui = new Date().toLocaleDateString('fr-FR');
        const ventesAujourdhui = ventesJour.filter((v: any) =>
          new Date(v.jour).toLocaleDateString('fr-FR') === aujourd_hui
        );
        const total = ventesAujourdhui.reduce((acc: number, v: any) => acc + Number(v.quantite_vendue), 0);
        setTotalVentesJour(total);

        if (topConso.length > 0) setTopProduit(topConso[0]);
        if (topRecettes.length > 0) setTopRecette(topRecettes[0]);
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

      {/* Cartes stats */}
      <View style={styles.grille}>
        <View style={styles.carte}>
          <Text style={styles.carteLabel}>Produits référencés</Text>
          <Text style={styles.carteValeur}>{totalProduits}</Text>
        </View>

        <View style={styles.carte}>
          <Text style={styles.carteLabel}>Stock total</Text>
          <Text style={styles.carteValeur}>{stockTotal} <Text style={styles.carteUnite}>unités</Text></Text>
        </View>

        <View style={[styles.carte, alertes.length > 0 && styles.carteAlerte]}>
          <Text style={styles.carteLabel}>Alertes stock</Text>
          <Text style={[styles.carteValeur, { color: alertes.length > 0 ? '#e53e3e' : '#38a169' }]}>
            {alertes.length}
          </Text>
          {alertes.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(admin)/pages_cachees/alertes')}>
              <Text style={styles.lienAlerte}>Voir les alertes →</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.carte}>
          <Text style={styles.carteLabel}>Ventes aujourd'hui</Text>
          <Text style={styles.carteValeur}>{totalVentesJour}</Text>
        </View>
      </View>

      {/* Top recette */}
      {topRecette && (
        <View style={styles.carteWide}>
          <Text style={styles.carteLabel}>🍽️ Recette la plus vendue</Text>
          <Text style={styles.carteNom}>{topRecette.recette_nom}</Text>
          <Text style={styles.carteSous}>{topRecette.total_vendu} vendues</Text>
        </View>
      )}

      {/* Top produit consommé */}
      {topProduit && (
        <View style={[styles.carteWide, { flexDirection: 'row', justifyContent: 'space-between' }]}>
          <View>
            <Text style={styles.carteLabel}>📦 Produit le plus consommé</Text>
            <Text style={styles.carteNom}>{topProduit.produit_nom}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.carteLabel}>Dernière conso estimée</Text>
            <Text style={styles.carteNom}>{topProduit.consommation_estimee} {topProduit.unite}</Text>
          </View>
        </View>
      )}

      {/* Alertes détail */}
      {alertes.length > 0 && (
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
      )}

      {/* Aperçu produits */}
      <View style={styles.bloc}>
        <Text style={styles.blocTitre}>Aperçu des produits</Text>
        {produits.map((produit, index) => (
          <View key={produit.produit_id} style={[styles.ligneProduit, index < produits.length - 1 && styles.separateur]}>
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

  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  carte: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  carteAlerte: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#f1b0b0' },
  carteLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  carteValeur: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  carteUnite: { fontSize: 14, fontWeight: 'normal', color: '#888' },
  lienAlerte: { fontSize: 12, color: '#e53e3e', marginTop: 4 },

  carteWide: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  carteNom: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 4 },
  carteSous: { fontSize: 13, color: '#888', marginTop: 2 },

  blocAlerte: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#f1b0b0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  blocAlerteTitre: { fontSize: 15, fontWeight: '700', color: '#e53e3e', marginBottom: 12 },
  ligneAlerte: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#fde' },
  ligneAlerteNom: { flex: 1, fontWeight: '600', color: '#333' },
  ligneAlerteStock: { color: '#e53e3e', fontWeight: 'bold', marginRight: 4 },
  ligneAlerteSeuil: { color: '#888', fontSize: 13 },

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