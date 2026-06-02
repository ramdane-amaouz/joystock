import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabaseClient';
import { API_URL } from '../../constants/config';

type Inventaire = {
  inventaire_id: number;
  type_inventaire: string;
  date_inventaire: string;
  utilisateur_nom: string;
  utilisateur_prenom: string;
};

export default function Inventaire() {
  const router = useRouter();
  const [inventaires, setInventaires] = useState<Inventaire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [erreur, setErreur] = useState('');

  async function chargerInventaires() {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Non connecté');

      const response = await fetch(`${API_URL}/inventaires`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` }
      });

      if (!response.ok) throw new Error('Erreur chargement');
      const inventairesData = await response.json();

      // Dédupliquer par inventaire_id
      const unique = Array.from(
        new Map(inventairesData.map((i: Inventaire) => [i.inventaire_id, i])).values()
      ) as Inventaire[];

      setInventaires(unique);
    } catch (error) {
      setErreur('Erreur lors du chargement des inventaires');
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }

  useEffect(() => { chargerInventaires(); }, []);

  if (chargement) {
    return (
      <View style={styles.centré}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  function badgeColor(type: string) {
    if (type === 'stock') return '#e8f5e9';
    if (type === 'reception') return '#e3f2fd';
    return '#f5f5f5';
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Inventaires</Text>

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <TouchableOpacity
        style={styles.boutonNouveau}
        onPress={() => router.push('/(employe)/demarrer-inventaire')}
      >
        <Text style={styles.boutonTxt}>+ Nouvel inventaire</Text>
      </TouchableOpacity>

      <FlatList
        data={inventaires}
        keyExtractor={(item) => item.inventaire_id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={rafraichissement}
            onRefresh={() => { setRafraichissement(true); chargerInventaires(); }}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.carte}>
            <View style={styles.carteHeader}>
              <View style={[styles.badge, { backgroundColor: badgeColor(item.type_inventaire) }]}>
                <Text style={styles.badgeTxt}>{item.type_inventaire}</Text>
              </View>
              <Text style={styles.date}>{formatDate(item.date_inventaire)}</Text>
            </View>
            <Text style={styles.utilisateur}>
              {item.utilisateur_prenom} {item.utilisateur_nom}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.vide}>Aucun inventaire pour le moment.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titre: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  erreur: { color: 'red', marginBottom: 12 },
  boutonNouveau: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  boutonTxt: { color: 'white', fontSize: 16, fontWeight: '600' },
  carte: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    elevation: 2
  },
  carteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeTxt: { fontSize: 13, fontWeight: '600', color: '#333' },
  date: { fontSize: 14, color: '#888' },
  utilisateur: { fontSize: 14, color: '#555' },
  vide: { textAlign: 'center', color: '#888', marginTop: 40 }
});