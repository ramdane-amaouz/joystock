import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../supabaseClient';
import { API_URL } from '../../../constants/config';

type Ingredient = {
  produit_ingredient_id: number;
  produit_ingredient_nom: string;
  quantite: number;
  unite_nom: string;
};

type Recette = {
  id: number;
  nom: string;
  ingredients: Ingredient[];
};

export default function Recettes() {
  const router = useRouter();
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [erreur, setErreur] = useState('');

  async function chargerRecettes() {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Non connecté');

      const response = await fetch(`${API_URL}/recettes`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (!response.ok) throw new Error('Erreur chargement recettes');
      setRecettes(await response.json());
    } catch (e: any) {
      setErreur(e.message);
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }

  async function supprimerRecette(id: number, nom: string) {
    Alert.alert(
      'Supprimer la recette',
      `Supprimer "${nom}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data } = await supabase.auth.getSession();
              if (!data.session) throw new Error('Non connecté');

              const response = await fetch(`${API_URL}/recettes/delete/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${data.session.access_token}` },
              });

              if (!response.ok) throw new Error('Erreur suppression');
              chargerRecettes();
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            }
          },
        },
      ]
    );
  }

  useEffect(() => { chargerRecettes(); }, []);

  if (chargement) {
    return (
      <View style={styles.centré}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titre}>Recettes</Text>
        <TouchableOpacity
          style={styles.boutonAjouter}
          onPress={() => router.push('/(admin)/pages_cachees/ajouter-recette' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.boutonAjouterTxt}>+ Créer</Text>
        </TouchableOpacity>
      </View>

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      {recettes.length === 0 ? (
        <View style={styles.vide}>
          <Text style={styles.videTxt}>Aucune recette créée pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={recettes}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={rafraichissement}
              onRefresh={() => { setRafraichissement(true); chargerRecettes(); }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.carte}>
              <View style={styles.carteHeader}>
                <Text style={styles.nom}>{item.nom}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/(admin)/pages_cachees/modifier-recette' as any,
                        params: { id: item.id },
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnTxt}>📝</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    onPress={() => supprimerRecette(item.id, item.nom)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnTxt}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {!item.ingredients || item.ingredients.length === 0 ? (
                <Text style={styles.aucunIngredient}>Aucun ingrédient renseigné.</Text>
              ) : (
                <View style={styles.ingredients}>
                  {item.ingredients.map((ing, index) => (
                    <View key={index} style={styles.ingredientLigne}>
                      <Text style={styles.ingredientPoint}>•</Text>
                      <Text style={styles.ingredientTxt}>
                        {ing.produit_ingredient_nom}
                        <Text style={styles.ingredientQte}> — {ing.quantite} {ing.unite_nom}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titre: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  boutonAjouter: {
    backgroundColor: '#333',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  boutonAjouterTxt: { color: 'white', fontSize: 14, fontWeight: '600' },
  erreur: { color: 'red', marginBottom: 12 },

  vide: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  videTxt: { color: '#888', fontSize: 15 },

  carte: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  carteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nom: { fontSize: 17, fontWeight: '700', color: '#333', flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  actionBtnDanger: { backgroundColor: '#fff5f5', borderColor: '#f1b0b0' },
  actionBtnTxt: { fontSize: 16 },

  aucunIngredient: { fontSize: 13, color: '#aaa', fontStyle: 'italic' },
  ingredients: { gap: 4 },
  ingredientLigne: { flexDirection: 'row', alignItems: 'flex-start' },
  ingredientPoint: { color: '#999', marginRight: 6, fontSize: 13, lineHeight: 20 },
  ingredientTxt: { fontSize: 14, color: '#555', flex: 1, lineHeight: 20 },
  ingredientQte: { color: '#999' },
});