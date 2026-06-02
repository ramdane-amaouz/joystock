import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabaseClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [afficherMDP, setAfficherMDP] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function connexion() {
    setErreur('');
    setChargement(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse
    });

    setChargement(false);

    if (error) {
      setErreur(error.message);
      return;
    }
    // Le _layout.tsx gère la redirection automatiquement
  }

  return (
    <View style={styles.container}>
      <View style={styles.carte}>
        <Text style={styles.titre}>Connexion</Text>

        {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

        <Text style={styles.label}>Adresse email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { paddingRight: 70 }]}
            placeholder="Mot de passe"
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry={!afficherMDP}
          />
          <TouchableOpacity
            style={styles.voirBtn}
            onPress={() => setAfficherMDP(!afficherMDP)}
          >
            <Text style={styles.voirTxt}>{afficherMDP ? 'Cacher' : 'Voir'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.bouton}
          onPress={connexion}
          disabled={chargement}
        >
          {chargement
            ? <ActivityIndicator color="white" />
            : <Text style={styles.boutonTxt}>Se connecter</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/reset-password')}>
          <Text style={styles.lien}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  carte: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  titre: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#333'
  },
  inputWrapper: {
    position: 'relative'
  },
  voirBtn: {
    position: 'absolute',
    right: 12,
    top: 12
  },
  voirTxt: {
    color: '#555',
    fontSize: 14
  },
  bouton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16
  },
  boutonTxt: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  erreur: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center'
  },
  lien: {
    color: '#333',
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontSize: 14
  }
});