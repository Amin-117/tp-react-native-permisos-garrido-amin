import { router } from 'expo-router';

import type { EstadoPermiso } from './interpretar';
import type { Recurso } from './permisos';

// Pantallas a las que se puede seguir después de la pantalla previa.
// "siguiente" llega como parámetro de URL (cualquiera puede abrir
// mantenimientoipf://permisos/camara?siguiente=...), así que solo se aceptan estas.
export const DESTINOS = ['/reporte/escanear', '/reporte/foto', '/reporte/ubicacion', '/ajustes-app'] as const;
export type Destino = (typeof DESTINOS)[number];

export function esDestinoValido(valor: unknown): valor is Destino {
  return typeof valor === 'string' && (DESTINOS as readonly string[]).includes(valor);
}

// Lo que hace el botón "Escanear QR del aula" de /reporte/nuevo:
// - concedido  → directo a la función.
// - preguntable → primero la pantalla previa (/permisos/[recurso]), que sigue a destino si se concede.
// - bloqueado / cargando → a la función igual: esa pantalla muestra el aviso con
//   "Abrir Ajustes" y la alternativa (aula a mano).
// "Marcar ubicación" no lo usa: va siempre a /reporte/ubicacion (ver nuevo.tsx).
// Nunca pide el permiso: eso pasa solo en el "Continuar" de la pantalla previa.
export function irConPermiso(recurso: Recurso, estado: EstadoPermiso, destino: Destino): void {
  if (estado === 'preguntable') {
    router.push({ pathname: '/permisos/[recurso]', params: { recurso, siguiente: destino } });
  } else {
    router.push(destino);
  }
}
