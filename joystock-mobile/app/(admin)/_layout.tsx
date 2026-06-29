import { useState } from 'react';
import { Tabs } from 'expo-router';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function BoutonPlus({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.tabBouton}>
      <Ionicons name="ellipsis-horizontal" size={24} color="#8e8e8f" />
      <Text style={styles.tabLabel}>Plus</Text>
    </TouchableOpacity>
  );
}

export default function AdminLayout() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function naviguer(chemin: string) {
    setMenuOuvert(false);
    setTimeout(() => router.push(chemin as any), 150);
  }

  const MENU_ITEMS = [
    { label: 'Alertes',     icone: 'warning-outline',      chemin: '/(admin)/pages_cachees/alertes' },
    { label: 'Invitations', icone: 'mail-outline',          chemin: '/(admin)/pages_cachees/invitations' },
    { label: 'Équipe',      icone: 'people-outline',        chemin: '/(admin)/pages_cachees/equipe' },
  ];

  return (
    <>
      <Tabs
        screenOptions={{
//          headerShown: false,
          tabBarActiveTintColor: '#333',
          tabBarInactiveTintColor: '#8e8e8f',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom + 4,
            paddingTop: 4,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          headerStyle: { backgroundColor: 'white' },
          headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#333' },
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="produits"
          options={{
            title: 'Produits',
            tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="inventaire"
          options={{
            title: 'Inventaire',
            tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} />,
          }}
        />

        <Tabs.Screen
          name="plus"
          options={{
            title: 'Plus',
            tabBarButton: () => <BoutonPlus onPress={() => setMenuOuvert(true)} />,
          }}
        />

        <Tabs.Screen
          name="profil"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          }}
        />
        

        <Tabs.Screen name="pages_cachees" options={{ href: null, headerShown: false }} />

        {/* Pages cachées */}
       {/* <Tabs.Screen name="pages_cachees/ajout-produit"       options={{ href: null, title: 'Ajouter un produit' }} />
        <Tabs.Screen name="pages_cachees/demarrer-inventaire" options={{ href: null, title: 'Démarrer inventaire' }} />
        <Tabs.Screen name="pages_cachees/reception-livraison" options={{ href: null, title: 'Réception livraison' }} />
        <Tabs.Screen name="pages_cachees/statistiques"        options={{ href: null, title: 'Statistiques' }} />
        <Tabs.Screen name="pages_cachees/alertes"             options={{ href: null, title: 'Alertes' }} />
        <Tabs.Screen name="pages_cachees/recettes"            options={{ href: null, title: 'Recettes' }} />
        <Tabs.Screen name="pages_cachees/invitations"         options={{ href: null, title: 'Invitations' }} />
        <Tabs.Screen name="pages_cachees/ajouter-recette"     options={{ href: null, title: 'Ajouter recette' }} />
        <Tabs.Screen name="pages_cachees/modifier-recette"    options={{ href: null, title: 'Modifier recette' }} />  */}
      </Tabs>

      {/* Menu vertical "Plus" */}
      <Modal
        visible={menuOuvert}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOuvert(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuOuvert(false)}>
          <Pressable
            style={[styles.menu, { paddingBottom: insets.bottom + 24 }]}
            onPress={() => {}}
          >
            <View style={styles.menuHandle} />
            <Text style={styles.menuTitre}>Menu admin</Text>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.chemin}
                style={styles.menuItem}
                onPress={() => naviguer(item.chemin)}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconeWrapper}>
                  <Ionicons name={item.icone as any} size={20} color="#333" />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tabBouton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: { fontSize: 11, color: '#8e8e8f', marginTop: 2, fontWeight: '500' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  menuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  menuTitre: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconeWrapper: {
    width: 36,
    height: 36,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: '#333' },
});