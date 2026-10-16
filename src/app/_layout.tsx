import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { COLORES } from '@/components/tema';
import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';
import { ProveedorAlmacen, useAlmacen } from '@/lib/almacen';
import { esIdValido } from '@/lib/ids';

// Con la app abierta, iOS y Android no muestran las notificaciones locales a menos que
// se lo indiquemos. Esto NO pide ningún permiso: solo dice cómo mostrar las que lleguen.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Layout raíz. Acá no se pide ningún permiso: cada uno se pide al tocar su función.
export default function RootLayout() {
  return (
    <ProveedorAlmacen>
      <OyenteNotificaciones />
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

function abrirReporte(respuesta: Notifications.NotificationResponse) {
  const id = respuesta.notification.request.content.data?.reporteId;
  if (esIdValido(id)) router.push({ pathname: '/reporte/[id]', params: { id } });
  // Para no volver a abrirlo si después se consulta la última respuesta.
  Notifications.clearLastNotificationResponse();
}

// Mantiene los reportes al día. resolverPendientes() es idempotente: lo pueden llamar
// todos estos caminos y cada reporte se resuelve (y genera su aviso) una sola vez.
function OyenteNotificaciones() {
  const { cargado, resolverPendientes } = useAlmacen();

  useEffect(() => {
    // Llegó una notificación con la app abierta.
    const recibida = Notifications.addNotificationReceivedListener(() => resolverPendientes());
    // La persona tocó una notificación (con la app abierta o en segundo plano): abrimos el reporte.
    const respondida = Notifications.addNotificationResponseReceivedListener((respuesta) => {
      resolverPendientes();
      abrirReporte(respuesta);
    });
    return () => {
      recibida.remove();
      respondida.remove();
    };
  }, [resolverPendientes]);

  // Al terminar de leer AsyncStorage: resuelve lo que venció con la app cerrada y, si la
  // app se abrió tocando una notificación (arranque en frío), abre ese reporte.
  useEffect(() => {
    if (!cargado) return;
    resolverPendientes();
    const ultima = Notifications.getLastNotificationResponse();
    if (ultima) abrirReporte(ultima);
  }, [cargado, resolverPendientes]);

  // Al volver al primer plano (p. ej. si la notificación llegó con la app en segundo plano).
  useRevisarAlVolver(resolverPendientes);

  return null;
}
