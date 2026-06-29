import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '../../../supabaseClient';
import { API_URL } from '../../../constants/config';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { router } from 'expo-router/build/exports';
import { Stack } from 'expo-router/build/layouts/Stack';

type Alerte = {
  produit_id: number;
  produit_nom: string;
  categorie: string;
  stock_theorique: number;
  seuil_alerte: number;
  ecart: number;
  unite: string;
};

type Ecart = {
  produit_id: number;
  produit_nom: string;
  categorie: string;
  stock_theorique_attendu: number;
  quantite_reelle: number;
  ecart: number;
  unite: string;
  date_inventaire: string;
};

export default function Alertes() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [ecarts, setEcarts] = useState<Ecart[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [ongletActif, setOngletActif] = useState<'alertes' | 'ecarts'>('alertes');

  useEffect(() => {
    async function chargerDonnees() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error('Utilisateur non connecté');
        const token = data.session.access_token;

        const [alertesRes, ecartsRes] = await Promise.all([
          fetch(`${API_URL}/stats/alertes-stock`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/stats/ecarts-inventaire`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!alertesRes.ok) throw new Error('Erreur chargement alertes');
        if (!ecartsRes.ok) throw new Error('Erreur chargement écarts');

        const alertesData = await alertesRes.json();
        const ecartsData = await ecartsRes.json();

        setAlertes(alertesData);

        const ecartsSignificatifs = ecartsData.filter((e: Ecart) =>
          e.stock_theorique_attendu > 0 &&
          Math.abs(e.ecart / e.stock_theorique_attendu) > 0.1
        );
        setEcarts(ecartsSignificatifs);
      } catch (e: any) {
        setErreur(e.message);
      } finally {
        setChargement(false);
      }
    }

    chargerDonnees();
  }, []);

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
        title: 'Alertes',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.push('/(admin)/')} style={{ marginLeft: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )
      }} />

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      {/* Onglets */}
      <View style={styles.onglets}>
        <TouchableOpacity
          style={[styles.onglet, ongletActif === 'alertes' && styles.ongletActif]}
          onPress={() => setOngletActif('alertes')}
        >
          <Text style={[styles.ongletTxt, ongletActif === 'alertes' && styles.ongletTxtActif]}>
            ⚠️ Alertes stock
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.onglet, ongletActif === 'ecarts' && styles.ongletActif]}
          onPress={() => setOngletActif('ecarts')}
        >
          <Text style={[styles.ongletTxt, ongletActif === 'ecarts' && styles.ongletTxtActif]}>
            📊 Écarts inventaire
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section alertes stock */}
      {ongletActif === 'alertes' && (
        alertes.length === 0 ? (
          <View style={styles.carteOk}>
            <Text style={styles.carteOkIcone}>✅</Text>
            <Text style={styles.carteOkTxt}>Tous les produits sont au-dessus du seuil critique.</Text>
          </View>
        ) : (
          <>
            <View style={styles.compteur}>
              <Text style={styles.compteurTxt}>
                ⚠️ {alertes.length} produit{alertes.length > 1 ? 's' : ''} en alerte
              </Text>
            </View>
            <FlatList
              data={alertes}
              keyExtractor={(item) => item.produit_id.toString()}
              renderItem={({ item }) => (
                <View style={styles.carte}>
                  <View style={styles.carteHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nom}>{item.produit_nom}</Text>
                      <Text style={styles.categorie}>{item.categorie}</Text>
                    </View>
                    <View style={styles.ecartBadge}>
                      <Text style={styles.ecartTxt}>{item.ecart} {item.unite}</Text>
                    </View>
                  </View>
                  <View style={styles.carteFooter}>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Stock théorique</Text>
                      <Text style={styles.statValeurAlerte}>{item.stock_theorique} {item.unite}</Text>
                    </View>
                    <View style={styles.separateurV} />
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Seuil d'alerte</Text>
                      <Text style={styles.statValeur}>{item.seuil_alerte} {item.unite}</Text>
                    </View>
                    <View style={styles.separateurV} />
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Écart</Text>
                      <Text style={styles.statValeurAlerte}>{item.ecart} {item.unite}</Text>
                    </View>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </>
        )
      )}

      {/* Section écarts inventaire */}
      {ongletActif === 'ecarts' && (
        ecarts.length === 0 ? (
          <View style={styles.carteOk}>
            <Text style={styles.carteOkIcone}>✅</Text>
            <Text style={styles.carteOkTxt}>Aucun écart significatif détecté lors du dernier inventaire.</Text>
          </View>
        ) : (
          <>
            <View style={[styles.compteur, styles.compteurJaune]}>
              <Text style={styles.compteurTxtJaune}>
                📊 {ecarts.length} produit{ecarts.length > 1 ? 's' : ''} avec écart &gt; 10%
              </Text>
            </View>
            <FlatList
              data={ecarts}
              keyExtractor={(item) => item.produit_id.toString()}
              renderItem={({ item }) => (
                <View style={[styles.carte, { borderLeftColor: item.ecart < 0 ? '#e53e3e' : '#38a169' }]}>
                  <View style={styles.carteHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nom}>{item.produit_nom}</Text>
                      <Text style={styles.categorie}>{item.categorie}</Text>
                    </View>
                    <View style={[styles.ecartBadge, { borderColor: item.ecart < 0 ? '#f1b0b0' : '#9ae6b4', backgroundColor: item.ecart < 0 ? '#fff5f5' : '#f0fff4' }]}>
                      <Text style={[styles.ecartTxt, { color: item.ecart < 0 ? '#e53e3e' : '#38a169' }]}>
                        {item.ecart > 0 ? '+' : ''}{item.ecart} {item.unite}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.carteFooter}>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Théorique attendu</Text>
                      <Text style={styles.statValeur}>{item.stock_theorique_attendu} {item.unite}</Text>
                    </View>
                    <View style={styles.separateurV} />
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Réel compté</Text>
                      <Text style={styles.statValeur}>{item.quantite_reelle} {item.unite}</Text>
                    </View>
                    <View style={styles.separateurV} />
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Écart</Text>
                      <Text style={[styles.statValeur, { color: item.ecart < 0 ? '#e53e3e' : '#38a169' }]}>
                        {item.ecart > 0 ? '+' : ''}{item.ecart}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  erreur: { color: 'red', marginBottom: 12 },

  onglets: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  onglet: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  ongletActif: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  ongletTxt: { fontSize: 13, color: '#333', fontWeight: '500' },
  ongletTxtActif: { color: 'white', fontWeight: '700' },

  carteOk: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  carteOkIcone: { fontSize: 40, marginBottom: 12 },
  carteOkTxt: { fontSize: 15, color: '#555', textAlign: 'center' },

  compteur: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#f1b0b0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  compteurTxt: { color: '#e53e3e', fontWeight: '600', fontSize: 14 },
  compteurJaune: {
    backgroundColor: '#fffbf0',
    borderColor: '#f6c90e',
  },
  compteurTxtJaune: { color: '#b7791f', fontWeight: '600', fontSize: 14 },

  carte: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#e53e3e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  carteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  nom: { fontSize: 16, fontWeight: '600', color: '#333' },
  categorie: { fontSize: 12, color: '#999', marginTop: 2 },
  ecartBadge: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#f1b0b0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ecartTxt: { color: '#e53e3e', fontWeight: '700', fontSize: 13 },

  carteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#999', marginBottom: 2, textAlign: 'center' },
  statValeur: { fontSize: 14, fontWeight: '600', color: '#333' },
  statValeurAlerte: { fontSize: 14, fontWeight: '700', color: '#e53e3e' },
  separateurV: { width: 1, height: 30, backgroundColor: '#f0f0f0' },
});