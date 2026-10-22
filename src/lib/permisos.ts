import { Camera } from 'expo-camera';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Location from 'expo-location';
import { Platform, type PlatformOSType } from 'react-native';
import type { PermissionResponse } from 'expo';

import {
  consultarPermisoNotificaciones,
  notificacionesDisponibles,
  pedirPermisoNotificaciones,
} from './notificaciones';

export { interpretar, type EstadoPermiso, type Interpretacion } from './interpretar';

// Adaptador uniforme: cada recurso expone consultar() y pedir() con la misma forma,
// y interpretar() traduce cualquier respuesta a los cuatro estados de la app.
// Las fotos NO están acá: se eligen con el selector del sistema, que no pide permiso.

export type Recurso = 'camara' | 'ubicacion' | 'notificaciones';

export interface DefinicionRecurso {
  titulo: string;
  beneficio: string;
  icono: string;
  // false si el módulo nativo no está en este entorno (notificaciones en Expo Go Android).
  disponible: boolean;
  // Solo lee el estado: nunca muestra un diálogo.
  consultar: () => Promise<PermissionResponse>;
  // Puede mostrar el diálogo del sistema. Llamarlo solo como respuesta a un toque.
  pedir: () => Promise<PermissionResponse>;
}

export const RECURSOS: Record<Recurso, DefinicionRecurso> = {
  camara: {
    titulo: 'Cámara',
    beneficio: 'Para leer el QR de la puerta del aula y sacar fotos del desperfecto.',
    icono: '📷',
    disponible: true,
    consultar: () => Camera.getCameraPermissionsAsync(),
    pedir: () => Camera.requestCameraPermissionsAsync(),
  },
  ubicacion: {
    titulo: 'Ubicación',
    beneficio: 'Para marcar en qué parte del edificio está el problema. Solo mientras usás la app.',
    icono: '📍',
    disponible: true,
    consultar: () => Location.getForegroundPermissionsAsync(),
    pedir: () => Location.requestForegroundPermissionsAsync(),
  },
  notificaciones: {
    titulo: 'Notificaciones',
    beneficio: 'Para avisarte cuando se resuelva el reporte que hiciste.',
    icono: '🔔',
    disponible: notificacionesDisponibles,
    consultar: consultarPermisoNotificaciones,
    pedir: pedirPermisoNotificaciones, // primero crea el canal "reportes", después pide
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
