import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import type { PermissionResponse } from 'expo';

import { interpretar, type EstadoPermiso } from '@/lib/interpretar';
import { RECURSOS, type Recurso } from '@/lib/permisos';
import { useRevisarAlVolver } from './useRevisarAlVolver';

export interface ResultadoPermiso {
  estado: EstadoPermiso;
  parcial: boolean;
  detalle?: string;
  respuesta: PermissionResponse | null;
  pedir: () => Promise<PermissionResponse>;
  consultar: () => Promise<PermissionResponse | null>; // devuelve la respuesta (o null si falló)
  abrirAjustes: () => Promise<void>;
}

// Hook unificado para cámara, ubicación y notificaciones.
// Regla: este hook SOLO consulta (al montar y al volver al primer plano).
// pedir() existe para que la pantalla lo llame desde un onPress, nunca solo.
export function usePermiso(recurso: Recurso): ResultadoPermiso {
  // Guardamos de qué recurso es la respuesta: si la misma pantalla pasa a otro
  // recurso, la respuesta vieja no sirve y volvemos a 'cargando'.
  const [leido, setLeido] = useState<{ recurso: Recurso; respuesta: PermissionResponse } | null>(null);
  const respuesta = leido?.recurso === recurso ? leido.respuesta : null;

  // useCallback: la misma función mientras no cambie el recurso, así
  // useRevisarAlVolver no se re-suscribe a AppState en cada render.
  const consultar = useCallback(async () => {
    try {
      const r = await RECURSOS[recurso].consultar();
      setLeido({ recurso, respuesta: r });
      return r;
    } catch {
      // Si la consulta falla (p. ej. módulo no disponible) nos quedamos en 'cargando'.
      return null;
    }
  }, [recurso]);

  const pedir = useCallback(async () => {
    const r = await RECURSOS[recurso].pedir();
    setLeido({ recurso, respuesta: r });
    return r;
  }, [recurso]);

  const abrirAjustes = useCallback(() => Linking.openSettings(), []);

  // Al montar: solo consultar. Pedir acá sería mostrar el diálogo sin que la persona tocara nada.
  // El setState va en el .then() (respuesta del sistema), y 'activo' descarta la
  // respuesta si la pantalla se desmontó o cambió de recurso mientras tanto.
  useEffect(() => {
    let activo = true;
    RECURSOS[recurso]
      .consultar()
      .then((r) => {
        if (activo) setLeido({ recurso, respuesta: r });
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [recurso]);

  // Al volver de Ajustes (o de cualquier otra app): re-consultar.
  useRevisarAlVolver(consultar);

  const { estado, parcial, detalle } = interpretar(respuesta);
  return { estado, parcial, detalle, respuesta, pedir, consultar, abrirAjustes };
}
