import { Stack } from 'expo-router';

export default function PagesCacheesLayout() {
  return (

    
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: 'white' },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#333' },
        headerShadowVisible: false,
        headerTintColor: '#333', // couleur du bouton retour
      }}
    />
    
  );
}