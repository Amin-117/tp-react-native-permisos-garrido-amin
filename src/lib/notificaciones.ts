import { isRunningInExpoGo, type PermissionResponse } from 'expo';
import { Platform } from 'react-native';

import { DEMORA_RESOLUCION_MS, textoAvisoResolucion } from './almacen';
import type { Reporte } from './tipos';

// ÚNICO archivo que usa expo-notifications. Ninguna ruta lo importa directo: si el módulo
// no carga, la app arranca igual y los avisos siguen llegando a /avisos (ver almacen.tsx).

type Modulo = typeof import('expo-notifications'); // solo el tipo: no carga nada

function cargar(): Modulo | null {
  // En Expo Go Android ni siquiera lo intentamos: el binario de Expo Go (SDK 53+) no trae
  // los módulos nativos de expo-notifications (p. ej. ExpoTopicSubscriptionModule), así
  // que importarlo falla al evaluar el archivo, y además el paquete tira un console.error
  // que en desarrollo abre la pantalla roja de LogBox. En la development build sí está.
  if (Platform.OS === 'android' && isRunningInExpoGo()) return null;
  try {
    // require y no import: un import arriba de todo falla antes de que podamos atraparlo.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as Modulo;
  } catch {
    return null; // cualquier otro entorno donde falte el módulo nativo
  }
}

const N = cargar();

export const notificacionesDisponibles = N !== null;

export const CANAL_REPORTES = 'reportes';

// Con la app abierta, iOS y Android no muestran las notificaciones locales a menos que
// se lo indiquemos. Esto NO pide ningún permiso: solo dice cómo mostrar las que lleguen.
N?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function modulo(): Modulo {
  if (!N) throw new Error('expo-notifications no está disponible en este entorno');
  return N;
}

export function consultarPermisoNotificaciones(): Promise<PermissionResponse> {
  return modulo().getPermissionsAsync();
}

export async function pedirPermisoNotificaciones(): Promise<PermissionResponse> {
  const n = modulo();
  // En Android 8+ las notificaciones necesitan un canal. Lo creamos antes de pedir el
  // permiso para que el diálogo del sistema (Android 13+) aparezca en ese momento y
  // no cuando llegue la primera notificación. Crear un canal que ya existe no hace nada.
  if (Platform.OS === 'android') {
    await n.setNotificationChannelAsync(CANAL_REPORTES, {
      name: 'Reportes',
      description: 'Avisos cuando se resuelve un reporte',
      importance: n.AndroidImportance.DEFAULT,
    });
  }
  return n.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
}

export async function programarAvisoResolucion(reporte: Reporte): Promise<void> {
  const n = modulo();
  await n.scheduleNotificationAsync({
    content: {
      title: 'Reporte resuelto',
      body: textoAvisoResolucion(reporte),
      data: { reporteId: reporte.id },
    },
    trigger: {
      type: n.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: DEMORA_RESOLUCION_MS / 1000,
      channelId: CANAL_REPORTES, // Android: el canal creado antes de pedir el permiso
    },
  });
}

// Llegó una notificación con la app abierta. Devuelve la función para dejar de escuchar.
export function alRecibirNotificacion(cb: () => void): () => void {
  const sub = N?.addNotificationReceivedListener(cb);
  return () => sub?.remove();
}

// La persona tocó una notificación. cb recibe el reporteId tal cual vino (sin validar).
export function alTocarNotificacion(cb: (reporteId: unknown) => void): () => void {
  const sub = N?.addNotificationResponseReceivedListener((r) => {
    N?.clearLastNotificationResponse(); // para no volver a abrirlo con ultimoReporteTocado()
    cb(r.notification.request.content.data?.reporteId);
  });
  return () => sub?.remove();
}

// Si la app se abrió tocando una notificación (arranque en frío): su reporteId, una sola vez.
export function ultimoReporteTocado(): unknown {
  const ultima = N?.getLastNotificationResponse();
  if (!ultima) return undefined;
  N?.clearLastNotificationResponse();
  return ultima.notification.request.content.data?.reporteId;
}
