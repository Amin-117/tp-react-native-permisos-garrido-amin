import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { COLORES } from '@/components/tema';
import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';
import { ProveedorAlmacen, useAlmacen } from '@/lib/almacen';
import { esIdValido } from '@/lib/ids';
// Al cargarse configura cómo se muestran las notificaciones con la app abierta (si el módulo existe).
import { alRecibirNotificacion, alTocarNotificacion, ultimoReporteTocado } from '@/lib/notificaciones';

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

// El reporteId viene de afuera (la notificación): se valida antes de navegar.
function abrirReporte(id: unknown) {
  if (esIdValido(id)) router.push({ pathname: '/reporte/[id]', params: { id } });
}

// Mantiene los reportes al día. resolverPendientes() es idempotente: lo pueden llamar
// todos estos caminos y cada reporte se resuelve (y genera su aviso) una sola vez.
// Sin expo-notifications (Expo Go Android) las suscripciones no hacen nada y
// quedan la carga inicial y el volver al primer plano.
function OyenteNotificaciones() {
  const { cargado, resolverPendientes } = useAlmacen();

  useEffect(() => {
    // Llegó una notificación con la app abierta.
    const dejarRecibida = alRecibirNotificacion(() => resolverPendientes());
    // La persona tocó una notificación (con la app abierta o en segundo plano): abrimos el reporte.
    const dejarTocada = alTocarNotificacion((id) => {
      resolverPendientes();
      abrirReporte(id);
    });
    return () => {
      dejarRecibida();
      dejarTocada();
    };
  }, [resolverPendientes]);

  // Al terminar de leer AsyncStorage: resuelve lo que venció con la app cerrada y, si la
  // app se abrió tocando una notificación (arranque en frío), abre ese reporte.
  useEffect(() => {
    if (!cargado) return;
    resolverPendientes();
    abrirReporte(ultimoReporteTocado());
  }, [cargado, resolverPendientes]);

  // Al volver al primer plano (p. ej. si la notificación llegó con la app en segundo plano).
  useRevisarAlVolver(resolverPendientes);

  return null;
}
