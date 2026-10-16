import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { COLORES } from '@/components/tema';
import { ProveedorAlmacen } from '@/lib/almacen';

// Layout raíz. Acá no se pide ningún permiso: cada uno se pide al tocar su función.
// (En la tanda 5c se suman setNotificationHandler y los listeners de notificaciones.)
export default function RootLayout() {
  return (
    <ProveedorAlmacen>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: COLORES.primario,
          headerTitleStyle: { color: COLORES.texto },
          contentStyle: { backgroundColor: COLORES.fondo },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reporte/nuevo" options={{ title: 'Nuevo reporte' }} />
        <Stack.Screen name="reporte/escanear" options={{ title: 'Escanear QR del aula' }} />
        <Stack.Screen name="reporte/foto" options={{ title: 'Foto del desperfecto' }} />
        <Stack.Screen name="reporte/ubicacion" options={{ title: 'Ubicación' }} />
        <Stack.Screen name="reporte/[id]" options={{ title: 'Reporte' }} />
        {/* Pantalla previa al diálogo del sistema: se abre como modal y solo por un toque. */}
        <Stack.Screen name="permisos/[recurso]" options={{ presentation: 'modal', title: 'Permiso' }} />
        <Stack.Screen name="ajustes-app" options={{ title: 'Ajustes de la app' }} />
        <Stack.Screen name="+not-found" options={{ title: 'No encontrado' }} />
      </Stack>
    </ProveedorAlmacen>
  );
}
