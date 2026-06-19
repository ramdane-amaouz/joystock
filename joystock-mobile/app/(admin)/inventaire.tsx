import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../supabaseClient';
import { API_URL } from '../../constants/config';

type Inventaire = {
  id: number;
  type: string;
  date_inventaire: string;
  utilisateur_nom: string;
  utilisateur_prenom: string;
};

export default function Inventaire() {
  const router = useRouter();
  const [inventaires, setInventaires] = useState<Inventaire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [exportEnCours, setExportEnCours] = useState<number | null>(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    chargerInventaires();
  }, []);

  async function chargerInventaires() {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Non connecté');

      const response = await fetch(`${API_URL}/inventaires/inventaires_liste`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` }
      });

      if (!response.ok) throw new Error('Erreur chargement inventaires');
      setInventaires(await response.json());
    } catch (e: any) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function exporterCSV(inventaire: Inventaire) {
    setExportEnCours(inventaire.id);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Non connecté');

      const response = await fetch(`${API_URL}/inventaires/${inventaire.id}/details`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` }
      });

      if (!response.ok) throw new Error('Erreur export');

      const lignes = await response.json();

      const entete = 'Produit,Catégorie,Unité,Quantité\n';
      const contenu = lignes.map((l: any) =>
        `${l.produit_nom},${l.categorie},${l.unite},${l.quantite}`
      ).join('\n');

      const csv = entete + contenu;

      const dateStr = new Date(inventaire.date_inventaire)
        .toLocaleDateString('fr-FR')
        .replace(/\//g, '-');

      const fichier = `${FileSystem.cacheDirectory}inventaire_${inventaire.type}_${dateStr}.csv`;

      await FileSystem.writeAsStringAsync(fichier, csv, {
        encoding: FileSystem.EncodingType.UTF8
      });

      const peutPartager = await Sharing.isAvailableAsync();
      if (peutPartager) {
        await Sharing.shareAsync(fichier, {
          mimeType: 'text/csv',
          dialogTitle: `Inventaire ${inventaire.type} du ${dateStr}`
        });
      } else {
        Alert.alert('Export', 'Le partage de fichiers n\'est pas disponible sur cet appareil.');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setExportEnCours(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function badgeCouleur(type: string) {
    if (type === 'stock') return { bg: '#e8f5e9', txt: '#2e7d32' };
    if (type === 'reception') return { bg: '#e3f2fd', txt: '#1565c0' };
    return { bg: '#f5f5f5', txt: '#555' };
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>

      {/* Actions */}
      <TouchableOpacity
        style={styles.carte}
        onPress={() => router.push('/(admin)/pages_cachees/demarrer-inventaire' as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.carteIcone}>📋</Text>
        <View style={styles.carteTextes}>
          <Text style={styles.carteTitre}>Démarrer un inventaire</Text>
          <Text style={styles.carteSous}>Saisir les quantités actuelles en stock</Text>
        </View>
        <Text style={styles.fleche}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.carte}
        onPress={() => router.push('/(admin)/pages_cachees/reception-livraison' as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.carteIcone}>📦</Text>
        <View style={styles.carteTextes}>
          <Text style={styles.carteTitre}>Réceptionner une livraison</Text>
          <Text style={styles.carteSous}>Enregistrer les quantités reçues</Text>
        </View>
        <Text style={styles.fleche}>›</Text>
      </TouchableOpacity>

      {/* Historique */}
      <View style={styles.bloc}>
        <Text style={styles.blocTitre}>Historique des inventaires</Text>

        {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

        {chargement ? (
          <ActivityIndicator size="small" color="#333" style={{ marginTop: 12 }} />
        ) : inventaires.length === 0 ? (
          <Text style={styles.vide}>Aucun inventaire enregistré.</Text>
        ) : (
          inventaires.map((inventaire) => {
            const couleur = badgeCouleur(inventaire.type);
            return (
              <View key={inventaire.id} style={styles.ligne}>
                <View style={{ flex: 1 }}>
                  <View style={styles.ligneHeader}>
                    <View style={[styles.badge, { backgroundColor: couleur.bg }]}>
                      <Text style={[styles.badgeTxt, { color: couleur.txt }]}>
                        {inventaire.type === 'stock' ? 'Inventaire' : 'Réception'}
                      </Text>
                    </View>
                    <Text style={styles.date}>{formatDate(inventaire.date_inventaire)}</Text>
                  </View>
                  <Text style={styles.utilisateur}>
                    {inventaire.utilisateur_prenom} {inventaire.utilisateur_nom}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.exportBtn}
                  onPress={() => exporterCSV(inventaire)}
                  disabled={exportEnCours === inventaire.id}
                >
                  {exportEnCours === inventaire.id ? (
                    <ActivityIndicator size="small" color="#333" />
                  ) : (
                    <Text style={styles.exportTxt}>⬇️</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  carte: {
    backgroundColor: 'white', borderRadius: 12, padding: 20,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  carteIcone: { fontSize: 28, marginRight: 16 },
  carteTextes: { flex: 1 },
  carteTitre: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  carteSous: { fontSize: 13, color: '#888' },
  fleche: { fontSize: 24, color: '#ccc', fontWeight: '300' },

  bloc: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  blocTitre: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  erreur: { color: 'red', marginBottom: 8 },
  vide: { color: '#aaa', fontStyle: 'italic', fontSize: 13 },

  ligne: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  ligneHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeTxt: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: 12, color: '#888' },
  utilisateur: { fontSize: 13, color: '#555' },

  exportBtn: {
    width: 40, height: 40, borderRadius: 8,
    borderWidth: 1, borderColor: '#ccc',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12,
  },
  exportTxt: { fontSize: 18 },
});