import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function demanderReset() {
    setErreur('');
    setMessage('');
    setChargement(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/reset-password'
    });

    setChargement(false);

    if (error) {
      setErreur(error.message);
      return;
    }

    setMessage('Un email de réinitialisation vous a été envoyé.');
    setEmail('');
  }

  return (
    <View style={styles.container}>
      <View style={styles.carte}>
        <Text style={styles.titre}>Mot de passe oublié</Text>

        {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
        {message ? <Text style={styles.succes}>{message}</Text> : null}

        <Text style={styles.label}>Adresse email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.bouton} onPress={demanderReset} disabled={chargement}>
          {chargement
            ? <ActivityIndicator color="white" />
            : <Text style={styles.boutonTxt}>Envoyer le lien</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', padding: 20 },
  carte: { width: '100%', maxWidth: 400, backgroundColor: 'white', padding: 24, borderRadius: 12, elevation: 4 },
  titre: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#333' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  bouton: { backgroundColor: '#333', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  boutonTxt: { color: 'white', fontSize: 16, fontWeight: '600' },
  erreur: { color: 'red', marginBottom: 12, textAlign: 'center' },
  succes: { color: 'green', marginBottom: 12, textAlign: 'center' }
});