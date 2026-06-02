import { Tabs } from 'expo-router';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#333' }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="produits" options={{ title: 'Produits' }} />
      <Tabs.Screen name="inventaire" options={{ title: 'Inventaire' }} />
      <Tabs.Screen name="statistiques" options={{ title: 'Stats' }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil' }} />
    </Tabs>
  );
}