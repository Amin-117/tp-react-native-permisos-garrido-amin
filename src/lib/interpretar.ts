import type { PermissionResponse } from 'expo';

// Lógica pura, sin módulos nativos: se puede probar con objetos de ejemplo
// (ver scripts/probar-interpretar.mjs).

// 'no_disponible' no sale de interpretar(): lo pone usePermiso cuando el módulo nativo
// no está en este entorno (ver lib/notificaciones.ts).
export type EstadoPermiso = 'cargando' | 'concedido' | 'preguntable' | 'bloqueado' | 'no_disponible';

export interface Interpretacion {
  estado: EstadoPermiso;
  parcial: boolean;
  detalle?: string;
}

// Valores de Notifications.IosAuthorizationStatus (expo-notifications, SDK 57).
// Se copian acá para no importar el módulo nativo.
export const IOS_NOTIF_PROVISIONAL = 3;
export const IOS_NOTIF_EPHEMERAL = 4;

// Campos que algunos módulos agregan a PermissionResponse y que marcan un acceso parcial.
interface Matices {
  accessPrivileges?: 'all' | 'limited' | 'none'; // fotos (iOS 14+ / Android 14+)
  android?: { accuracy?: string }; // ubicación: 'fine' | 'coarse' | 'none'
  ios?: { accuracy?: string; status?: number }; // ubicación: 'full' | 'reduced'; notificaciones: status numérico
}

export function interpretar(respuesta: PermissionResponse | null): Interpretacion {
  // null: todavía no terminó la primera consulta. Se muestra <Cargando />, nunca "denegado".
  if (respuesta === null) return { estado: 'cargando', parcial: false };

  const m = respuesta as PermissionResponse & Matices;

  // Notificaciones provisionales (iOS 12+): llegan en silencio al Centro de notificaciones.
  // En SDK 57 expo-notifications devuelve status 'undetermined' y granted false, así que
  // hay que mirar ios.status ANTES que granted; si no, se vería como "preguntable".
  if (m.ios?.status === IOS_NOTIF_PROVISIONAL) {
    return { estado: 'concedido', parcial: true, detalle: 'provisional' };
  }

  // Efímero (iOS 14+): autorización temporal que iOS da solo a los App Clips (unas horas).
  // No es lo mismo que provisional: es completa pero vence. Esta app no tiene App Clip,
  // así que no debería aparecer; si aparece, se puede usar (concedido) con su propio detalle.
  if (m.ios?.status === IOS_NOTIF_EPHEMERAL) {
    return { estado: 'concedido', parcial: true, detalle: 'efímero (App Clip)' };
  }

  // granted: se puede usar. Puede ser parcial: fotos limitadas o ubicación aproximada.
  // Parcial no es un error: la función anda, con menos detalle.
  if (respuesta.granted) {
    if (m.accessPrivileges === 'limited') {
      return { estado: 'concedido', parcial: true, detalle: 'acceso limitado' };
    }
    if (m.android?.accuracy === 'coarse' || m.ios?.accuracy === 'reduced') {
      return { estado: 'concedido', parcial: true, detalle: 'ubicación aproximada' };
    }
    return { estado: 'concedido', parcial: false };
  }

  // No concedido pero canAskAgain true: todavía se puede mostrar el diálogo.
  // Cubre 'undetermined' (nunca se preguntó) y 'denied' con canAskAgain (en Android,
  // después del primer "No permitir"). La app muestra la pantalla previa con "Continuar".
  if (respuesta.canAskAgain) return { estado: 'preguntable', parcial: false };

  // No concedido y canAskAgain false: request…() ya no muestra nada y devuelve
  // 'denied' al instante. Pasa en Android tras dos rechazos y en iOS tras el primero.
  // Lo único que queda es mandar a Ajustes.
  return { estado: 'bloqueado', parcial: false };
}
