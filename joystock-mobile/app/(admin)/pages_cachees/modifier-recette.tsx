import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '../../../supabaseClient';
import { API_URL } from '../../../constants/config';
import Ionicons from '@expo/vector-icons/build/Ionicons';

type Produit = {
  id: number;
  nom: string;
  unites?: { nom: string };
};

type Ingredient = {
  produit_ingredient_id: string;
  quantite: string;
};

export default function ModifierRecette() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [nom, setNom] = useState('');
  const [produits, setProduits] = useState<Produit[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  async function fetchAvecToken(url: string, options: RequestInit = {}) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Non connecté');

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${data.session.access_token}`,
      },
    });

    if (!response.ok) throw new Error('Erreur lors de la requête');
    return response.json();
  }

  useEffect(() => {
    async function charger() {
      try {
        const [matieres, recette] = await Promise.all([
          fetchAvecToken(`${API_URL}/produits/matieres-premieres`),
          fetchAvecToken(`${API_URL}/recettes/${id}`),
        ]);

        setProduits(matieres);
        setNom(recette.nom);
        setIngredients(
          recette.ingredients.map((ing: any) => ({
            produit_ingredient_id: String(ing.produit_ingredient_id),
            quantite: String(ing.quantite),
          }))
        );
      } catch (e: any) {
        setErreur(e.message);
      } finally {
        setChargement(false);
      }
    }

    charger();
  }, [id]);

  function modifierIngredient(index: number, champ: keyof Ingredient, valeur: string) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [champ]: valeur } : ing))
    );
  }

  function ajouterLigne() {
    setIngredients((prev) => [...prev, { produit_ingredient_id: '', quantite: '' }]);
  }

  function supprimerLigne(index: number) {
    if (ingredients.length === 1) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function enregistrer() {
    setErreur('');

    const ingredientsValides = ingredients.filter(
      (ing) => ing.produit_ingredient_id !== '' && ing.quantite !== ''
    );

    if (!nom.trim()) { setErreur('Le nom est obligatoire'); return; }
    if (ingredientsValides.length === 0) { setErreur('Ajoutez au moins un ingrédient complet'); return; }

    setEnvoi(true);
    try {
      await fetchAvecToken(`${API_URL}/recettes/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          ingredients: ingredientsValides.map((ing) => ({
            produit_ingredient_id: Number(ing.produit_ingredient_id),
            quantite: Number(ing.quantite),
          })),
        }),
      });

      Alert.alert('Succès', 'Recette modifiée avec succès.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setErreur(e.message || 'Erreur inconnue');
    } finally {
      setEnvoi(false);
    }
  }

  if (chargement) {
    return (
      <View style={styles.centré}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* <Text style={styles.titre}>Modifier la recette</Text> */}
      <Stack.Screen options={{
  title: 'Modifier la recette',
  headerLeft: () => (
    <TouchableOpacity onPress={() => router.push('/(admin)/recettes')} style={{ marginLeft: 8 }}>
      <Ionicons name="arrow-back" size={24} color="#333" />
    </TouchableOpacity>
  )
}} />


      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      {/* Nom */}
      <Text style={styles.label}>Nom de la recette</Text>
      <TextInput
        style={styles.input}
        value={nom}
        onChangeText={setNom}
        placeholder="Nom de la recette"
        placeholderTextColor="#bbb"
      />

      {/* Ingrédients */}
      <Text style={styles.label}>Ingrédients</Text>

      {ingredients.map((ing, index) => {
        const produitChoisi = produits.find(
          (p) => String(p.id) === ing.produit_ingredient_id
        );

        return (
          <View key={index} style={styles.ingredientLigne}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
            >
              {produits.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.chip,
                    ing.produit_ingredient_id === String(p.id) && styles.chipActive,
                  ]}
                  onPress={() =>
                    modifierIngredient(index, 'produit_ingredient_id', String(p.id))
                  }
                >
                  <Text
                    style={[
                      styles.chipTxt,
                      ing.produit_ingredient_id === String(p.id) && styles.chipTxtActive,
                    ]}
                  >
                    {p.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.ingredientBas}>
              <TextInput
                style={styles.inputQte}
                value={ing.quantite}
                onChangeText={(v) => modifierIngredient(index, 'quantite', v)}
                placeholder={
                  produitChoisi
                    ? `Qté (${produitChoisi.unites?.nom ?? ''})`
                    : 'Quantité'
                }
                placeholderTextColor="#bbb"
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={[
                  styles.boutonRetirer,
                  ingredients.length === 1 && styles.boutonRetirerDisabled,
                ]}
                onPress={() => supprimerLigne(index)}
                disabled={ingredients.length === 1}
              >
                <Text style={styles.boutonRetirerTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={styles.boutonAjouter} onPress={ajouterLigne} activeOpacity={0.7}>
        <Text style={styles.boutonAjouterTxt}>+ Ajouter un ingrédient</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bouton, envoi && styles.boutonDisabled]}
        onPress={enregistrer}
        disabled={envoi}
      >
        {envoi
          ? <ActivityIndicator color="white" />
          : <Text style={styles.boutonTxt}>Enregistrer les modifications</Text>
        }
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  centré: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titre: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 24 },
  erreur: { color: 'red', marginBottom: 16, fontSize: 13 },

  label: {
    fontSize: 13, fontWeight: '600', color: '#555',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, padding: 12, fontSize: 15, color: '#333', marginBottom: 20,
  },

  ingredientLigne: {
    backgroundColor: 'white', borderRadius: 10, padding: 12,
    marginBottom: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
    shadowRadius: 3, elevation: 1,
  },
  chipsScroll: { marginBottom: 10 },
  chip: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    marginRight: 8, backgroundColor: 'white',
  },
  chipActive: { backgroundColor: '#333', borderColor: '#333' },
  chipTxt: { fontSize: 13, color: '#555' },
  chipTxtActive: { color: 'white', fontWeight: '600' },

  ingredientBas: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputQte: {
    flex: 1, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, padding: 10, fontSize: 14, color: '#333',
  },
  boutonRetirer: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#f1b0b0',
    alignItems: 'center', justifyContent: 'center',
  },
  boutonRetirerDisabled: { backgroundColor: '#f5f5f5', borderColor: '#ddd' },
  boutonRetirerTxt: { color: '#e53e3e', fontWeight: '600' },

  boutonAjouter: {
    borderWidth: 1, borderColor: '#333', borderStyle: 'dashed',
    borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 20,
  },
  boutonAjouterTxt: { color: '#333', fontSize: 14, fontWeight: '500' },

  bouton: {
    backgroundColor: '#333', padding: 14,
    borderRadius: 8, alignItems: 'center', marginTop: 4,
  },
  boutonDisabled: { backgroundColor: '#999' },
  boutonTxt: { color: 'white', fontSize: 16, fontWeight: '600' },
});