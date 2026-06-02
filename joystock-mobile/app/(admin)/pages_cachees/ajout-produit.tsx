
/////////a revoir!!!!!


import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../supabaseClient';
import { API_URL } from '../../../constants/config';



export default function AjoutProduit() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('');
  const [quantite, setQuantite] = useState('');
  const [unite, setUnite] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  async function ajouterProduit() {
    setErreur('');

    if (!nom || !categorie || !quantite || !unite) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs');
      return;
    }

    setEnvoi(true);
    try {
      const response = await fetch(`${API_URL}/produits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, categorie, quantite: parseInt(quantite), unite }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du produit');
      }

      Alert.alert('Succès', 'Produit ajouté avec succès', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } /*catch (e) {
      setErreur(e.message);*/
    /*} finally {
      setEnvoi(false);
    }*/ finally {
      setEnvoi(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.titre}>Ajouter un produit</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom du produit"
        value={nom}
        onChangeText={setNom}
      />
      <TextInput
        style={styles.input}
        placeholder="Catégorie"
        value={categorie}
        onChangeText={setCategorie}
      />    
        <TextInput
        style={styles.input}
        placeholder="Quantité"
        value={quantite}
        onChangeText={setQuantite}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Unité (ex: kg, L, etc.)"
        value={unite}
        onChangeText={setUnite}
      />

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <TouchableOpacity
        style={[styles.bouton, envoi && styles.boutonDesactive]}
        onPress={ajouterProduit}
        disabled={envoi}
      >
        <Text style={styles.boutonTexte}>{envoi ? 'Envoi...' : 'Ajouter'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  titre: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  bouton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  boutonDesactive: {
    backgroundColor: '#aaa',
  },
  boutonTexte: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  erreur: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
}); 