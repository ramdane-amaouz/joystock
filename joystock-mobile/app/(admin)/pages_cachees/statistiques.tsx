import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { supabase } from '../../../supabaseClient';
import { API_URL } from '../../../constants/config';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { router } from 'expo-router/build/exports';
import { Stack } from 'expo-router/build/layouts/Stack';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64;

// ─── Types ────────────────────────────────────────────────────────────────────

type StockTheorique = {
  produit_id: number;
  produit_nom: string;
  categorie: string;
  stock_dernier_inventaire: number;
  total_recu_depuis_inventaire: number;
  total_consomme_depuis_inventaire: number;
  stock_theorique: number;
  seuil_alerte: number;
  unite: string;
};

type Consommation = {
  produit_nom: string;
  date_stock_actuel: string;
  consommation_estimee: number;
  unite: string;
};

type DerniereConsommation = {
  produit_nom: string;
  consommation_estimee: number;
};

type TotalVentes = {
  recette_nom: string;
  total_vendu: number;
};

type VenteParPeriode = {
  recette_nom: string;
  jour?: string;
  semaine?: string;
  quantite_vendue: number;
};

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Statistiques() {
  const [stockTheorique, setStockTheorique] = useState<StockTheorique[]>([]);
  const [consommation, setConsommation] = useState<Consommation[]>([]);
  const [dernieresConso, setDernieresConso] = useState<DerniereConsommation[]>([]);
  const [totalVentes, setTotalVentes] = useState<TotalVentes[]>([]);
  const [ventesParJour, setVentesParJour] = useState<VenteParPeriode[]>([]);
  const [ventesParSemaine, setVentesParSemaine] = useState<VenteParPeriode[]>([]);

  const [produitSelectionne, setProduitSelectionne] = useState('');
  const [recetteSelectionnee, setRecetteSelectionnee] = useState('');
  const [modeVente, setModeVente] = useState<'jour' | 'semaine'>('jour');

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function chargerStats() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error('Non connecté');
        const token = data.session.access_token;

        async function get(url: string) {
          const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
          if (!r.ok) throw new Error('Erreur chargement stats');
          return r.json();
        }

        const [conso, derniereConso, totalV, ventesJ, ventesS, stock] = await Promise.all([
          get(`${API_URL}/stats/consommation`),
          get(`${API_URL}/stats/derniere-consommation`),
          get(`${API_URL}/stats/ventes/total-recettes`),
          get(`${API_URL}/stats/ventes/par-jour`),
          get(`${API_URL}/stats/ventes/par-semaine`),
          get(`${API_URL}/stats/stock-theorique`),
        ]);

        setConsommation(conso);
        if (conso.length > 0) setProduitSelectionne(conso[0].produit_nom);

        setDernieresConso(derniereConso);
        setTotalVentes(totalV);
        setVentesParJour(ventesJ);
        if (ventesJ.length > 0) setRecetteSelectionnee(ventesJ[0].recette_nom);
        setVentesParSemaine(ventesS);
        setStockTheorique(stock);
      } catch (e: any) {
        setErreur(e.message);
      } finally {
        setChargement(false);
      }
    }

    chargerStats();
  }, []);

  if (chargement) {
    return (
      <View style={styles.centré}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.chargementTxt}>Chargement des statistiques…</Text>
      </View>
    );
  }

  // ── Données transformées pour gifted-charts ──────────────────────────────

  const produits = [...new Set(consommation.map((c) => c.produit_nom))];

  const donneesConso: { value: number; label: string }[] = consommation
    .filter((c) => c.produit_nom === produitSelectionne)
    .map((c) => ({
      value: Number(c.consommation_estimee),
      label: new Date(c.date_stock_actuel).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      dataPointText: String(Number(c.consommation_estimee)),
    }));

  const donneesDerniereConso: { value: number; label: string; frontColor: string }[] =
    dernieresConso.map((d) => ({
      value: Number(d.consommation_estimee),
      label: d.produit_nom.length > 8 ? d.produit_nom.substring(0, 8) + '…' : d.produit_nom,
      frontColor: '#333',
    }));

  const donneesTotalVentes: { value: number; label: string; frontColor: string }[] =
    totalVentes.map((v) => ({
      value: Number(v.total_vendu),
      label: v.recette_nom.length > 8 ? v.recette_nom.substring(0, 8) + '…' : v.recette_nom,
      frontColor: '#555',
    }));

  const recettes = [...new Set([
    ...ventesParJour.map((v) => v.recette_nom),
    ...ventesParSemaine.map((v) => v.recette_nom),
  ])];

  const donneesVentes: { value: number; label: string }[] = (
    modeVente === 'jour' ? ventesParJour : ventesParSemaine
  )
    .filter((v) => v.recette_nom === recetteSelectionnee)
    .map((v) => ({
      value: Number(v.quantite_vendue),
      label: new Date(modeVente === 'jour' ? v.jour! : v.semaine!).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
      }),
      dataPointText: String(Number(v.quantite_vendue)),
    }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* <Text style={styles.titre}>Statistiques</Text> */}


<Stack.Screen options={{
  title: 'Statistiques',
  headerLeft: () => (
    <TouchableOpacity onPress={() => router.push('/(admin)/')} style={{ marginLeft: 8 }}>
      <Ionicons name="arrow-back" size={24} color="#333" />
    </TouchableOpacity>
  )
}} />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      {/* ── Stock théorique ───────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Stock théorique</Text>
        {stockTheorique.length === 0 ? (
          <Text style={styles.vide}>Aucune donnée de stock disponible.</Text>
        ) : (
          stockTheorique.map((item) => {
            const critique = item.seuil_alerte > 0 && item.stock_theorique <= item.seuil_alerte;
            return (
              <View key={item.produit_id} style={[styles.stockLigne, critique && styles.stockLigneCritique]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stockNom, critique && styles.textRouge]}>
                    {critique ? '⚠️ ' : ''}{item.produit_nom}
                  </Text>
                  <Text style={styles.stockCategorie}>{item.categorie}</Text>
                </View>
                <View style={styles.stockPills}>
                  <View style={[styles.pill, { backgroundColor: critique ? '#fff0f0' : '#f0fff4' }]}>
                    <Text style={[styles.pillTxt, { color: critique ? '#e53e3e' : '#38a169' }]}>
                      {item.stock_theorique} {item.unite}
                    </Text>
                  </View>
                  <View style={styles.pillGris}>
                    <Text style={styles.pillGrisTxt}>seuil {item.seuil_alerte}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ── Consommation par produit ──────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Évolution de la consommation</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {produits.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, produitSelectionne === p && styles.chipActive]}
              onPress={() => setProduitSelectionne(p)}
            >
              <Text style={[styles.chipTxt, produitSelectionne === p && styles.chipTxtActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {donneesConso.length === 0 ? (
          <Text style={styles.vide}>Aucune donnée pour ce produit.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={donneesConso}
              width={Math.max(CHART_WIDTH, donneesConso.length * 60)}
              height={200}
              color="#333"
              thickness={2}
              dataPointsColor="#333"
              dataPointsRadius={4}
              startFillColor="#333"
              endFillColor="#f5f5f5"
              startOpacity={0.15}
              endOpacity={0.01}
              areaChart
              curved
              hideYAxisText={false}
              yAxisTextStyle={{ color: '#aaa', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#aaa', fontSize: 9 }}
              rulesColor="#f0f0f0"
              xAxisColor="#eee"
              yAxisColor="#eee"
              noOfSections={4}
              isAnimated
            />
          </ScrollView>
        )}
      </View>

      {/* ── Dernière consommation ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Dernière consommation estimée</Text>
        {donneesDerniereConso.length === 0 ? (
          <Text style={styles.vide}>Aucune consommation disponible.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={donneesDerniereConso}
              width={Math.max(CHART_WIDTH, donneesDerniereConso.length * 60)}
              height={200}
              barWidth={32}
              spacing={16}
              roundedTop
              hideRules={false}
              rulesColor="#f0f0f0"
              xAxisColor="#eee"
              yAxisColor="#eee"
              yAxisTextStyle={{ color: '#aaa', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#888', fontSize: 9 }}
              noOfSections={4}
              isAnimated
            />
          </ScrollView>
        )}
      </View>

      {/* ── Total vendu par recette ───────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Total vendu par recette</Text>
        {donneesTotalVentes.length === 0 ? (
          <Text style={styles.vide}>Aucune vente enregistrée.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={donneesTotalVentes}
              width={Math.max(CHART_WIDTH, donneesTotalVentes.length * 60)}
              height={200}
              barWidth={32}
              spacing={16}
              roundedTop
              hideRules={false}
              rulesColor="#f0f0f0"
              xAxisColor="#eee"
              yAxisColor="#eee"
              yAxisTextStyle={{ color: '#aaa', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#888', fontSize: 9 }}
              noOfSections={4}
              isAnimated
            />
          </ScrollView>
        )}
      </View>

      {/* ── Évolution des ventes par recette ─────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Évolution des ventes</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {recettes.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, recetteSelectionnee === r && styles.chipActive]}
              onPress={() => setRecetteSelectionnee(r)}
            >
              <Text style={[styles.chipTxt, recetteSelectionnee === r && styles.chipTxtActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.toggle}>
          {(['jour', 'semaine'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.toggleBtn, modeVente === mode && styles.toggleBtnActive]}
              onPress={() => setModeVente(mode)}
            >
              <Text style={[styles.toggleTxt, modeVente === mode && styles.toggleTxtActive]}>
                Par {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {donneesVentes.length === 0 ? (
          <Text style={styles.vide}>Aucune donnée de vente pour cette recette.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={donneesVentes}
              width={Math.max(CHART_WIDTH, donneesVentes.length * 60)}
              height={200}
              color="#555"
              thickness={2}
              dataPointsColor="#555"
              dataPointsRadius={4}
              startFillColor="#555"
              endFillColor="#f5f5f5"
              startOpacity={0.15}
              endOpacity={0.01}
              areaChart
              curved
              yAxisTextStyle={{ color: '#aaa', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#aaa', fontSize: 9 }}
              rulesColor="#f0f0f0"
              xAxisColor="#eee"
              yAxisColor="#eee"
              noOfSections={4}
              isAnimated
            />
          </ScrollView>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chargementTxt: { marginTop: 12, color: '#888', fontSize: 14 },
  titre: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  erreur: { color: 'red', marginBottom: 12 },
  vide: { color: '#aaa', fontStyle: 'italic', fontSize: 13, marginTop: 4 },

  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionTitre: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 14 },

  // Stock théorique
  stockLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  stockLigneCritique: {
    backgroundColor: '#fff8f8',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  stockNom: { fontSize: 14, fontWeight: '600', color: '#333' },
  stockCategorie: { fontSize: 11, color: '#999', marginTop: 1 },
  textRouge: { color: '#e53e3e' },
  stockPills: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pillTxt: { fontSize: 12, fontWeight: '700' },
  pillGris: { backgroundColor: '#f0f0f0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pillGrisTxt: { fontSize: 11, color: '#888' },

  // Chips
  chipsScroll: { marginBottom: 12 },
  chip: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    marginRight: 8, backgroundColor: 'white',
  },
  chipActive: { backgroundColor: '#333', borderColor: '#333' },
  chipTxt: { fontSize: 12, color: '#555' },
  chipTxtActive: { color: 'white', fontWeight: '600' },

  // Toggle
  toggle: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  toggleBtn: {
    flex: 1, padding: 8, borderRadius: 8,
    borderWidth: 1, borderColor: '#ddd',
    alignItems: 'center', backgroundColor: 'white',
  },
  toggleBtnActive: { backgroundColor: '#333', borderColor: '#333' },
  toggleTxt: { fontSize: 13, color: '#555', fontWeight: '500' },
  toggleTxtActive: { color: 'white', fontWeight: '600' },
});