import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import { supabase } from '../../../supabaseClient';
import { API_URL } from '../../../constants/config';

const ROLES = [
  { valeur: 'employe', label: 'Employé' },
  { valeur: 'admin',   label: 'Admin' },
];

export default function Invitations() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employe');
  const [lien, setLien] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  async function envoyerInvitation() {
    setErreur('');
    setLien('');

    if (!email.trim()) { setErreur("L'email est obligatoire"); return; }

    setEnvoi(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Non connecté');

      const response = await fetch(`${API_URL}/invitations/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      if (!response.ok) throw new Error("Erreur lors de la création de l'invitation");

      const data = await response.json();
      setLien(data.lien);
      setEmail('');
      setRole('employe');

      Alert.alert('Invitation envoyée', "L'email a été envoyé avec succès.");
    } catch (e: any) {
      setErreur(e.message || 'Erreur inconnue');
    } finally {
      setEnvoi(false);
    }
  }

  function copierLien() {
    Clipboard.setString(lien);
    Alert.alert('Copié', 'Le lien a été copié dans le presse-papiers.');
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.titre}>Inviter un employé</Text>

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <View style={styles.carte}>
        {/* Email */}
        <Text style={styles.label}>Adresse email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="email@exemple.com"
          placeholderTextColor="#bbb"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Rôle */}
        <Text style={styles.label}>Rôle</Text>
        <View style={styles.rolesGroupe}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.valeur}
              style={[styles.roleOption, role === r.valeur && styles.roleOptionActive]}
              onPress={() => setRole(r.valeur)}
              activeOpacity={0.7}
            >
              <Text style={[styles.roleOptionTxt, role === r.valeur && styles.roleOptionTxtActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.bouton, envoi && styles.boutonDisabled]}
          onPress={envoyerInvitation}
          disabled={envoi}
        >
          {envoi
            ? <ActivityIndicator color="white" />
            : <Text style={styles.boutonTxt}>Créer l'invitation</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Lien généré */}
      {lien ? (
        <View style={styles.lienCarte}>
          <Text style={styles.lienTitre}>Lien d'invitation</Text>
          <Text style={styles.lienTxt} numberOfLines={2}>{lien}</Text>
          <TouchableOpacity style={styles.boutonCopier} onPress={copierLien} activeOpacity={0.7}>
            <Text style={styles.boutonCopierTxt}>📋 Copier le lien</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  titre: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  erreur: { color: 'red', marginBottom: 12, fontSize: 13 },

  carte: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
  },

  rolesGroupe: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  roleOptionActive: { backgroundColor: '#333', borderColor: '#333' },
  roleOptionTxt: { fontSize: 14, fontWeight: '500', color: '#555' },
  roleOptionTxtActive: { color: 'white', fontWeight: '600' },

  bouton: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  boutonDisabled: { backgroundColor: '#999' },
  boutonTxt: { color: 'white', fontSize: 16, fontWeight: '600' },

  lienCarte: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  lienTitre: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  lienTxt: { fontSize: 12, color: '#666', marginBottom: 12, lineHeight: 18 },
  boutonCopier: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  boutonCopierTxt: { fontSize: 14, fontWeight: '500', color: '#333' },
});