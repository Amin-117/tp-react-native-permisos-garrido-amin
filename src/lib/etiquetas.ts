import type { EstadoPermiso } from './interpretar';
import type { Categoria, EstadoReporte, Sector, UbicacionReporte } from './tipos';

// Textos que ve la persona para cada valor interno.

export const ETIQUETA_CATEGORIA: Record<Categoria, string> = {
  electricidad: 'Electricidad',
  agua: 'Agua',
  mobiliario: 'Mobiliario',
  equipos: 'Equipos',
};

export const ETIQUETA_SECTOR: Record<Sector, string> = {
  patio: 'Patio',
  estacionamiento: 'Estacionamiento',
  pasillo: 'Pasillo',
  aula: 'Aula',
  otro: 'Otro',
};

export const ETIQUETA_ESTADO_REPORTE: Record<EstadoReporte, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  resuelto: 'Resuelto',
};

export const ETIQUETA_ESTADO_PERMISO: Record<EstadoPermiso, string> = {
  cargando: 'Consultando…',
  concedido: 'Concedido',
  preguntable: 'Sin decidir / se puede pedir',
  bloqueado: 'Bloqueado',
};

// Una ubicación aproximada nunca muestra coordenadas: solo "Ubicación aproximada".
export function describirUbicacion(u: UbicacionReporte): string {
  if (u.tipo === 'sector') return `Sector: ${ETIQUETA_SECTOR[u.sector]}`;
  if (u.aproximada) return 'Ubicación aproximada';
  return `${u.latitud.toFixed(4)}, ${u.longitud.toFixed(4)}`;
}
