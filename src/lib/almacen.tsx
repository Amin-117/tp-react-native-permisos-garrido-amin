import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { generarId } from './ids';
import type { Aviso, Borrador, Preferencias, Reporte } from './tipos';

// Estado global de la app: reportes, avisos, borrador y preferencias.
// Ojo: acá NUNCA se guarda el estado de los permisos. Ese se consulta al sistema
// cada vez (al montar y al volver al primer plano), porque la persona lo puede
// cambiar desde Ajustes en cualquier momento.

const CLAVE_GUARDADO = 'mantenimiento-ipf/v1';

// Lo que se resuelve con "Simular resolución" tarda esto en pasar a resuelto.
export const DEMORA_RESOLUCION_MS = 10_000;

const BORRADOR_VACIO: Borrador = { titulo: '', descripcion: '', aula: '', categoria: null };

interface Estado {
  cargado: boolean; // true cuando ya se leyó AsyncStorage
  reportes: Reporte[];
  avisos: Aviso[];
  borrador: Borrador;
  preferencias: Preferencias;
}

interface Guardado {
  reportes: Reporte[];
  avisos: Aviso[];
  preferencias: Preferencias;
}

type Accion =
  | { tipo: 'hidratar'; guardado: Partial<Guardado> | null }
  | { tipo: 'crearReporte'; reporte: Reporte }
  | { tipo: 'actualizarBorrador'; cambios: Partial<Borrador> }
  | { tipo: 'limpiarBorrador' }
  | { tipo: 'programarResolucion'; id: string; para: number }
  | { tipo: 'resolverPendientes'; ahora: number }
  | { tipo: 'agregarAviso'; aviso: Aviso }
  | { tipo: 'marcarAvisoLeido'; id: string }
  | { tipo: 'setAvisarResolucion'; valor: boolean };

const ESTADO_INICIAL: Estado = {
  cargado: false,
  reportes: [],
  avisos: [],
  borrador: BORRADOR_VACIO,
  preferencias: { avisarResolucion: false },
};

export function textoAvisoResolucion(reporte: Pick<Reporte, 'titulo'>): string {
  return `Se resolvió tu reporte "${reporte.titulo}".`;
}

function reducer(estado: Estado, accion: Accion): Estado {
  switch (accion.tipo) {
    case 'hidratar': {
      const g = accion.guardado;
      return {
        ...estado,
        cargado: true,
        reportes: Array.isArray(g?.reportes) ? g.reportes : [],
        avisos: Array.isArray(g?.avisos) ? g.avisos : [],
        preferencias: { avisarResolucion: g?.preferencias?.avisarResolucion === true },
      };
    }
    case 'crearReporte':
      return { ...estado, reportes: [accion.reporte, ...estado.reportes] };
    case 'actualizarBorrador':
      return { ...estado, borrador: { ...estado.borrador, ...accion.cambios } };
    case 'limpiarBorrador':
      return { ...estado, borrador: BORRADOR_VACIO };
    case 'programarResolucion':
      return {
        ...estado,
        reportes: estado.reportes.map((r) =>
          // Solo un reporte pendiente se puede pasar a "en curso".
          r.id === accion.id && r.estado === 'pendiente'
            ? { ...r, estado: 'en_curso', resolucionProgramadaPara: accion.para }
            : r,
        ),
      };
    case 'resolverPendientes': {
      // Es idempotente: lo llaman el setTimeout, la notificación y el regreso
      // al primer plano, y cada reporte se resuelve (y genera su aviso) una sola vez.
      const vencidos = estado.reportes.filter(
        (r) =>
          r.estado === 'en_curso' &&
          r.resolucionProgramadaPara !== undefined &&
          r.resolucionProgramadaPara <= accion.ahora,
      );
      if (vencidos.length === 0) return estado;
      const idsVencidos = new Set(vencidos.map((r) => r.id));
      const nuevosAvisos: Aviso[] = vencidos.map((r) => ({
        id: `aviso-${r.id}`,
        reporteId: r.id,
        texto: textoAvisoResolucion(r),
        creadoEn: accion.ahora,
        leido: false,
      }));
      return {
        ...estado,
        reportes: estado.reportes.map((r) => (idsVencidos.has(r.id) ? { ...r, estado: 'resuelto' } : r)),
        avisos: [...nuevosAvisos, ...estado.avisos],
      };
    }
    case 'agregarAviso':
      if (estado.avisos.some((a) => a.id === accion.aviso.id)) return estado;
      return { ...estado, avisos: [accion.aviso, ...estado.avisos] };
    case 'marcarAvisoLeido':
      return {
        ...estado,
        avisos: estado.avisos.map((a) => (a.id === accion.id ? { ...a, leido: true } : a)),
      };
    case 'setAvisarResolucion':
      return { ...estado, preferencias: { ...estado.preferencias, avisarResolucion: accion.valor } };
  }
}

export type DatosNuevoReporte = Omit<Reporte, 'id' | 'estado' | 'creadoEn' | 'resolucionProgramadaPara'>;

interface ValorAlmacen extends Estado {
  noLeidos: number;
  crearReporte: (datos: DatosNuevoReporte) => Reporte;
  actualizarBorrador: (cambios: Partial<Borrador>) => void;
  limpiarBorrador: () => void;
  programarResolucion: (id: string) => number;
  resolverPendientes: () => void;
  agregarAviso: (aviso: Omit<Aviso, 'id' | 'creadoEn' | 'leido'> & { id?: string }) => void;
  marcarAvisoLeido: (id: string) => void;
  setAvisarResolucion: (valor: boolean) => void;
}

const ContextoAlmacen = createContext<ValorAlmacen | null>(null);

export function ProveedorAlmacen({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, ESTADO_INICIAL);

  // Leer lo guardado una sola vez al arrancar.
  useEffect(() => {
    let activo = true;
    AsyncStorage.getItem(CLAVE_GUARDADO)
      .then((texto) => (texto ? (JSON.parse(texto) as Partial<Guardado>) : null))
      .catch(() => null) // JSON roto o error de lectura: arrancamos vacíos
      .then((guardado) => {
        if (activo) dispatch({ tipo: 'hidratar', guardado });
      });
    return () => {
      activo = false;
    };
  }, []);

  // Guardar cada vez que cambian los datos persistentes. No se guarda antes
  // de hidratar para no pisar lo que había con el estado vacío inicial.
  const { cargado, reportes, avisos, preferencias } = estado;
  useEffect(() => {
    if (!cargado) return;
    const guardado: Guardado = { reportes, avisos, preferencias };
    AsyncStorage.setItem(CLAVE_GUARDADO, JSON.stringify(guardado)).catch(() => {
      // Si falla el guardado la app sigue funcionando en memoria.
    });
  }, [cargado, reportes, avisos, preferencias]);

  const crearReporte = useCallback((datos: DatosNuevoReporte) => {
    const reporte: Reporte = { ...datos, id: generarId(), estado: 'pendiente', creadoEn: Date.now() };
    dispatch({ tipo: 'crearReporte', reporte });
    return reporte;
  }, []);

  const actualizarBorrador = useCallback(
    (cambios: Partial<Borrador>) => dispatch({ tipo: 'actualizarBorrador', cambios }),
    [],
  );

  const limpiarBorrador = useCallback(() => dispatch({ tipo: 'limpiarBorrador' }), []);

  // Devuelve el momento en que se va a resolver, para que la pantalla programe
  // la notificación y el setTimeout con el mismo valor.
  const programarResolucion = useCallback((id: string) => {
    const para = Date.now() + DEMORA_RESOLUCION_MS;
    dispatch({ tipo: 'programarResolucion', id, para });
    return para;
  }, []);

  const resolverPendientes = useCallback(() => dispatch({ tipo: 'resolverPendientes', ahora: Date.now() }), []);

  const agregarAviso = useCallback<ValorAlmacen['agregarAviso']>(({ id, reporteId, texto }) => {
    dispatch({
      tipo: 'agregarAviso',
      aviso: { id: id ?? `aviso-${generarId()}`, reporteId, texto, creadoEn: Date.now(), leido: false },
    });
  }, []);

  const marcarAvisoLeido = useCallback((id: string) => dispatch({ tipo: 'marcarAvisoLeido', id }), []);

  const setAvisarResolucion = useCallback(
    (valor: boolean) => dispatch({ tipo: 'setAvisarResolucion', valor }),
    [],
  );

  const valor = useMemo<ValorAlmacen>(
    () => ({
      ...estado,
      noLeidos: estado.avisos.filter((a) => !a.leido).length,
      crearReporte,
      actualizarBorrador,
      limpiarBorrador,
      programarResolucion,
      resolverPendientes,
      agregarAviso,
      marcarAvisoLeido,
      setAvisarResolucion,
    }),
    [
      estado,
      crearReporte,
      actualizarBorrador,
      limpiarBorrador,
      programarResolucion,
      resolverPendientes,
      agregarAviso,
      marcarAvisoLeido,
      setAvisarResolucion,
    ],
  );

  return <ContextoAlmacen.Provider value={valor}>{children}</ContextoAlmacen.Provider>;
}

export function useAlmacen(): ValorAlmacen {
  const valor = useContext(ContextoAlmacen);
  if (!valor) throw new Error('useAlmacen tiene que usarse dentro de <ProveedorAlmacen>');
  return valor;
}

// Reglas para poder guardar: título y, como mínimo, el aula escrita/escaneada
// o un sector elegido a mano. Nada de esto depende de un permiso.
export function validarBorrador(borrador: Borrador): string[] {
  const errores: string[] = [];
  if (borrador.titulo.trim() === '') errores.push('Escribí un título.');
  if (borrador.aula.trim() === '' && borrador.ubicacion?.tipo !== 'sector') {
    errores.push('Indicá el aula (escribila o escaneá el QR) o elegí un sector.');
  }
  if (borrador.categoria === null) errores.push('Elegí una categoría.');
  return errores;
}
