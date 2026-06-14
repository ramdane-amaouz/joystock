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
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../../../supabaseClient';
import { API_URL } from '../../../constants/config';

import { Ionicons } from '@expo/vector-icons';


type Categorie = { id: number; nom: string };
type Unite = { id: number; nom: string };

const TYPES_PRODUIT = [
  { valeur: 'matiere_premiere', label: 'Matière première' },
  { valeur: 'consommable', label: 'Consommable' },
  { valeur: 'entretien', label: 'Entretien' },
];

export default function AjouterProduit() {
  const router = useRouter();

  const [nom, setNom] = useState('');
  const [categorieId, setCategorieId] = useState<number | 'new' | ''>('');
  const [uniteId, setUniteId] = useState<number | 'new' | ''>('');
  const [typeProduit, setTypeProduit] = useState('matiere_premiere');

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);

  const [nouvelleCategorie, setNouvelleCategorie] = useState('');
  const [nouvelleUnite, setNouvelleUnite] = useState('');

  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  async function chargerCategoriesEtUnites() {
    try {
      const [resCat, resUnit] = await Promise.all([
        fetch(`${API_URL}/produits/categories`),
        fetch(`${API_URL}/produits/unites`),
      ]);
      setCategories(await resCat.json());
      setUnites(await resUnit.json());
    } catch {
      setErreur('Erreur lors du chargement des catégories / unités');
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerCategoriesEtUnites(); }, []);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function creerCategorieSiNecessaire(token: string): Promise<number> {
    if (categorieId !== 'new') return Number(categorieId);
    const res = await fetch(`${API_URL}/produits/categories/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nom: nouvelleCategorie }),
    });
    if (!res.ok) throw new Error('Erreur création catégorie');
    const data = await res.json();
    return data.categorie.id;
  }

  async function creerUniteSiNecessaire(token: string): Promise<number> {
    if (uniteId !== 'new') return Number(uniteId);
    const res = await fetch(`${API_URL}/produits/unites/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nom: nouvelleUnite }),
    });
    if (!res.ok) throw new Error("Erreur création unité");
    const data = await res.json();
    return data.unite.id;
  }

  async function ajouterProduit() {
    setErreur('');

    if (!nom.trim()) { setErreur('Le nom est obligatoire'); return; }
    if (!categorieId) { setErreur('Sélectionnez une catégorie'); return; }
    if (categorieId === 'new' && !nouvelleCategorie.trim()) { setErreur('Saisissez le nom de la nouvelle catégorie'); return; }
    if (!uniteId) { setErreur("Sélectionnez une unité"); return; }
    if (uniteId === 'new' && !nouvelleUnite.trim()) { setErreur("Saisissez le nom de la nouvelle unité"); return; }

    setEnvoi(true);
    try {
      const token = await getToken();
      if (!token) { setErreur('Utilisateur non connecté'); return; }

      const catId = await creerCategorieSiNecessaire(token);
      const unitId = await creerUniteSiNecessaire(token);

      const res = await fetch(`${API_URL}/produits/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nom: nom.trim(),
          categorie_id: catId,
          type_produit: typeProduit,
          unite_id: unitId,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de l'ajout du produit");

      Alert.alert('Succès', 'Produit ajouté avec succès.', [
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
      {/* <Text style={styles.titre}>Ajouter un produit</Text> */}
      <Stack.Screen options={{
        title: 'Ajouter un produit',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.push('/(admin)/produits')} style={{ marginLeft: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )
      }} />

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      {/* Nom */}
      <Text style={styles.label}>Nom du produit</Text>
      <TextInput
        style={styles.input}
        value={nom}
        onChangeText={setNom}
        placeholder="Ex: Farine T55"
        placeholderTextColor="#bbb"
      />

      {/* Catégorie */}
      <Text style={styles.label}>Catégorie</Text>
      <View style={styles.optionsGroupe}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.option, categorieId === cat.id && styles.optionActive]}
            onPress={() => setCategorieId(cat.id)}
          >
            <Text style={[styles.optionTxt, categorieId === cat.id && styles.optionTxtActive]}>
              {cat.nom}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.option, styles.optionNew, categorieId === 'new' && styles.optionActive]}
          onPress={() => setCategorieId('new')}
        >
          <Text style={[styles.optionTxt, categorieId === 'new' && styles.optionTxtActive]}>
            + Nouvelle
          </Text>
        </TouchableOpacity>
      </View>
      {categorieId === 'new' && (
        <TextInput
          style={styles.input}
          value={nouvelleCategorie}
          onChangeText={setNouvelleCategorie}
          placeholder="Nom de la nouvelle catégorie"
          placeholderTextColor="#bbb"
        />
      )}

      {/* Type produit */}
      <Text style={styles.label}>Type de produit</Text>
      <View style={styles.optionsGroupe}>
        {TYPES_PRODUIT.map((type) => (
          <TouchableOpacity
            key={type.valeur}
            style={[styles.option, typeProduit === type.valeur && styles.optionActive]}
            onPress={() => setTypeProduit(type.valeur)}
          >
            <Text style={[styles.optionTxt, typeProduit === type.valeur && styles.optionTxtActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Unité */}
      <Text style={styles.label}>Unité</Text>
      <View style={styles.optionsGroupe}>
        {unites.map((unite) => (
          <TouchableOpacity
            key={unite.id}
            style={[styles.option, uniteId === unite.id && styles.optionActive]}
            onPress={() => setUniteId(unite.id)}
          >
            <Text style={[styles.optionTxt, uniteId === unite.id && styles.optionTxtActive]}>
              {unite.nom}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.option, styles.optionNew, uniteId === 'new' && styles.optionActive]}
          onPress={() => setUniteId('new')}
        >
          <Text style={[styles.optionTxt, uniteId === 'new' && styles.optionTxtActive]}>
            + Nouvelle
          </Text>
        </TouchableOpacity>
      </View>
      {uniteId === 'new' && (
        <TextInput
          style={styles.input}
          value={nouvelleUnite}
          onChangeText={setNouvelleUnite}
          placeholder="Nom de la nouvelle unité"
          placeholderTextColor="#bbb"
        />
      )}

      {/* Bouton */}
      <TouchableOpacity
        style={[styles.bouton, envoi && styles.boutonDisabled]}
        onPress={ajouterProduit}
        disabled={envoi}
      >
        {envoi
          ? <ActivityIndicator color="white" />
          : <Text style={styles.boutonTxt}>Ajouter le produit</Text>
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

  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
  },

  optionsGroupe: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  option: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  optionActive: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  optionNew: {
    borderStyle: 'dashed',
  },
  optionTxt: { fontSize: 13, color: '#555' },
  optionTxtActive: { color: 'white', fontWeight: '600' },

  bouton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  boutonDisabled: { backgroundColor: '#999' },
  boutonTxt: { color: 'white', fontSize: 16, fontWeight: '600' },
});