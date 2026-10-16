import { Camera } from 'expo-camera';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform, type PlatformOSType } from 'react-native';
import type { PermissionResponse } from 'expo';

export { interpretar, type EstadoPermiso, type Interpretacion } from './interpretar';

// Adaptador uniforme: cada recurso expone consultar() y pedir() con la misma forma,
// y interpretar() traduce cualquier respuesta a los cuatro estados de la app.
// Las fotos NO están acá: se eligen con el selector del sistema, que no pide permiso.

export type Recurso = 'camara' | 'ubicacion' | 'notificaciones';

export interface DefinicionRecurso {
  titulo: string;
  beneficio: string;
  icono: string;
  // Solo lee el estado: nunca muestra un diálogo.
  consultar: () => Promise<PermissionResponse>;
  // Puede mostrar el diálogo del sistema. Llamarlo solo como respuesta a un toque.
  pedir: () => Promise<PermissionResponse>;
}

export const CANAL_REPORTES = 'reportes';

// En Android 8+ las notificaciones necesitan un canal. Lo creamos antes de pedir el
// permiso para que el diálogo del sistema (Android 13+) aparezca en ese momento y
// no cuando llegue la primera notificación. Crear un canal que ya existe no hace nada.
async function crearCanalReportes(): Promise<void> {
  if (Platform.OS !== 'android') return; // en iOS no existen los canales
  await Notifications.setNotificationChannelAsync(CANAL_REPORTES, {
    name: 'Reportes',
    description: 'Avisos cuando se resuelve un reporte',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export const RECURSOS: Record<Recurso, DefinicionRecurso> = {
  camara: {
    titulo: 'Cámara',
    beneficio: 'Para leer el QR de la puerta del aula y sacar fotos del desperfecto.',
    icono: '📷',
    consultar: () => Camera.getCameraPermissionsAsync(),
    pedir: () => Camera.requestCameraPermissionsAsync(),
  },
  ubicacion: {
    titulo: 'Ubicación',
    beneficio: 'Para marcar en qué parte del edificio está el problema. Solo mientras usás la app.',
    icono: '📍',
    consultar: () => Location.getForegroundPermissionsAsync(),
    pedir: () => Location.requestForegroundPermissionsAsync(),
  },
  notificaciones: {
    titulo: 'Notificaciones',
    beneficio: 'Para avisarte cuando se resuelva el reporte que hiciste.',
    icono: '🔔',
    consultar: () => Notifications.getPermissionsAsync(),
    pedir: async () => {
      await crearCanalReportes(); // primero el canal, después el pedido
      return Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
    },
  },
};

export function esRecurso(valor: unknown): valor is Recurso {
  return typeof valor === 'string' && Object.hasOwn(RECURSOS, valor);
}

// Nombre con el que aparece la app en Ajustes. En Expo Go los permisos son de Expo Go,
// no de nuestra app (por eso tampoco se ven nuestros textos de propósito).
function nombreEnAjustes(): string {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return 'Expo Go';
  return Constants.expoConfig?.name ?? 'Mantenimiento IPF';
}

// Camino exacto en Ajustes según la plataforma (desafío "bloqueo por plataforma").
// Los nombres de menú pueden variar un poco según el fabricante en Android.
export function pasosAjustes(recurso: Recurso, os: PlatformOSType = Platform.OS): string[] {
  const app = nombreEnAjustes();
  if (os === 'android') {
    switch (recurso) {
      case 'camara':
        return ['Ajustes', 'Apps', app, 'Permisos', 'Cámara', 'Permitir solo mientras se usa la app'];
      case 'ubicacion':
        return [
          'Ajustes',
          'Apps',
          app,
          'Permisos',
          'Ubicación',
          'Permitir solo mientras se usa la app (activá "Usar ubicación precisa" si querés la exacta)',
        ];
      case 'notificaciones':
        return ['Ajustes', 'Apps', app, 'Notificaciones', 'Activar "Todas las notificaciones"'];
    }
  }
  if (os === 'ios') {
    switch (recurso) {
      case 'camara':
        return ['Ajustes', app, 'Activar "Cámara"'];
      case 'ubicacion':
        return ['Ajustes', app, 'Ubicación', '"Mientras se usa la app" (activá "Ubicación exacta" si querés la exacta)'];
      case 'notificaciones':
        return ['Ajustes', app, 'Notificaciones', 'Activar "Permitir notificaciones"'];
    }
  }
  return ['Configuración del navegador', 'Permisos del sitio', RECURSOS[recurso].titulo, 'Permitir'];
}
