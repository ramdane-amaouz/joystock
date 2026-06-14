import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ScrollView,
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

export default function Alertes() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function chargerAlertes() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error('Utilisateur non connecté');

        const response = await fetch(`${API_URL}/stats/alertes-stock`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });

        if (!response.ok) throw new Error('Erreur lors du chargement des alertes');
        setAlertes(await response.json());
      } catch (e: any) {
        setErreur(e.message);
      } finally {
        setChargement(false);
      }
    }

    chargerAlertes();
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
      {/* <Text style={styles.titre}>Alertes de stock</Text> */}

<Stack.Screen options={{
  title: 'Alertes de stock',
  headerLeft: () => (
    <TouchableOpacity onPress={() => router.push('/(admin)/')} style={{ marginLeft: 8 }}>
      <Ionicons name="arrow-back" size={24} color="#333" />
    </TouchableOpacity>
  )
}} />
      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      {alertes.length === 0 ? (
        <View style={styles.carteOk}>
          <Text style={styles.carteOkIcone}>✅</Text>
          <Text style={styles.carteOkTxt}>
            Tous les produits sont au-dessus du seuil critique.
          </Text>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titre: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  erreur: { color: 'red', marginBottom: 12 },

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