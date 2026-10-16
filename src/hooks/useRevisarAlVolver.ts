import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

// Receta 5 de la clase: los hooks de permisos de Expo no se enteran solos de que
// la persona cambió algo en Ajustes. Cuando la app vuelve al primer plano
// (de 'background'/'inactive' a 'active') llamamos a alVolver() para re-consultar.
// alVolver tiene que ser estable (useCallback) o se re-suscribe en cada render.
export function useRevisarAlVolver(alVolver: () => void): void {
  const anterior = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nuevo) => {
      if (anterior.current !== 'active' && nuevo === 'active') alVolver();
      anterior.current = nuevo;
    });
    return () => sub.remove();
  }, [alVolver]);
}
