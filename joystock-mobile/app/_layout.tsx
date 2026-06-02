import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useSession } from '../hooks/useSession';
import { useProfile } from '../hooks/useProfile';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const { session, chargement } = useSession();
  const profil = useProfile(session);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (chargement) return;

    const dansAuth = segments[0] === '(auth)';

    if (!session && !dansAuth) {
      router.replace('/(auth)/login');
    } else if (session && profil && dansAuth) {
      if (profil.role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(employe)');
      }
    }
  }, [session, profil, chargement]);

  if (chargement) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return <Slot />;
}