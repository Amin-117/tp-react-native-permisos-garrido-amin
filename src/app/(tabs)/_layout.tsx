import { Link, Tabs } from 'expo-router';
import { Pressable, Text, type ColorValue } from 'react-native';

import { COLORES } from '@/components/tema';
import { useAlmacen } from '@/lib/almacen';

function IconoTab({ emoji, color }: { emoji: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const { noLeidos } = useAlmacen();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORES.primario,
        headerTitleStyle: { color: COLORES.texto },
        sceneStyle: { backgroundColor: COLORES.fondo },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color }) => <IconoTab emoji="📋" color={color} />,
          headerRight: () => (
            <Link href="/ajustes-app" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Ajustes de la app" hitSlop={12} style={{ paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 22 }}>⚙️</Text>
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="avisos"
        options={{
          title: 'Avisos',
          tabBarIcon: ({ color }) => <IconoTab emoji="📬" color={color} />,
          tabBarBadge: noLeidos > 0 ? noLeidos : undefined,
        }}
      />
      <Tabs.Screen
        name="permisos"
        options={{
          title: 'Permisos',
          tabBarIcon: ({ color }) => <IconoTab emoji="🔐" color={color} />,
        }}
      />
    </Tabs>
  );
}
