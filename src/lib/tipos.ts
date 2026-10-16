export type Categoria = 'electricidad' | 'agua' | 'mobiliario' | 'equipos';

export type EstadoReporte = 'pendiente' | 'en_curso' | 'resuelto';

export type Sector = 'patio' | 'estacionamiento' | 'pasillo' | 'aula' | 'otro';

// La ubicación sale del GPS (si hay permiso) o del sector elegido a mano (la alternativa).
export type UbicacionReporte =
  | { tipo: 'gps'; latitud: number; longitud: number; aproximada: boolean }
  | { tipo: 'sector'; sector: Sector };

export interface Reporte {
  id: string;
  titulo: string;
  descripcion: string;
  aula: string;
  categoria: Categoria;
  fotoUri?: string;
  ubicacion?: UbicacionReporte;
  estado: EstadoReporte;
  creadoEn: number;
  resolucionProgramadaPara?: number;
}

export interface Aviso {
  id: string;
  reporteId: string;
  texto: string;
  creadoEn: number;
  leido: boolean;
}

// El reporte que se está cargando en /reporte/nuevo. Lo completan también
// /reporte/escanear (aula), /reporte/foto (fotoUri) y /reporte/ubicacion.
export interface Borrador {
  titulo: string;
  descripcion: string;
  aula: string;
  categoria: Categoria | null;
  fotoUri?: string;
  ubicacion?: UbicacionReporte;
}

export interface Preferencias {
  avisarResolucion: boolean;
}

export const CATEGORIAS: Categoria[] = ['electricidad', 'agua', 'mobiliario', 'equipos'];

export const SECTORES: Sector[] = ['patio', 'estacionamiento', 'pasillo', 'aula', 'otro'];
