import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { AvisoBloqueado } from '@/components/AvisoBloqueado';
import { COLORES, ESPACIO } from '@/components/tema';
import { usePermiso } from '@/hooks/usePermiso';
import { useAlmacen } from '@/lib/almacen';
import { TEXTO_NO_DISPONIBLE } from '@/lib/etiquetas';
import { interpretar } from '@/lib/interpretar';

const SIN_PERMISO = 'Igual vas a ver los avisos en la pestaña Avisos.';

// "/ajustes-app" → el ÚNICO lugar donde se ofrecen las notificaciones: al activar el
// interruptor. La preferencia (de la app) y el permiso (del sistema) son cosas distintas:
// el interruptor se ve encendido solo si están los dos.
export default function AjustesApp() {
  const { preferencias, setAvisarResolucion } = useAlmacen();
  const notificaciones = usePermiso('notificaciones');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [mostrarBloqueo, setMostrarBloqueo] = useState(false);
  // true mientras está abierta la pantalla previa que abrimos desde acá.
  const esperandoPermiso = useRef(false);

  // Al volver (del modal o de otra pantalla) re-consultamos. Si veníamos de la pantalla
  // previa, con la respuesta decidimos si se activa la preferencia.
  const consultar = notificaciones.consultar;
  useFocusEffect(
    useCallback(() => {
      const veniaDelModal = esperandoPermiso.current;
      esperandoPermiso.current = false;
      consultar().then((respuesta) => {
        if (!veniaDelModal) return;
        if (interpretar(respuesta).estado === 'concedido') {
          setAvisarResolucion(true);
          setMensaje(null);
        } else {
          setMensaje(SIN_PERMISO); // no se concedió: el interruptor queda apagado
        }
      });
    }, [consultar, setAvisarResolucion]),
  );

  const { estado } = notificaciones;
  const encendido = preferencias.avisarResolucion && estado === 'concedido';

  function cambiar(valor: boolean) {
    setMensaje(null);
    setMostrarBloqueo(false);

    if (!valor) {
      // Apagar solo cambia la preferencia de la app: no toca el permiso del sistema.
      setAvisarResolucion(false);
      return;
    }
    if (estado === 'concedido') {
      setAvisarResolucion(true);
    } else if (estado === 'preguntable') {
      // Pantalla previa; su "Continuar" crea el canal "reportes" y recién ahí pide.
      esperandoPermiso.current = true;
      router.push({
        pathname: '/permisos/[recurso]',
        params: { recurso: 'notificaciones', siguiente: '/ajustes-app' },
      });
    } else if (estado === 'bloqueado') {
      setMostrarBloqueo(true); // queda apagado y explicamos cómo habilitarlo
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <View style={estilos.fila}>
        <Text style={estilos.etiqueta}>Avisarme cuando se resuelva mi reporte</Text>
        <Switch
          value={encendido}
          onValueChange={cambiar}
          disabled={estado === 'cargando' || estado === 'no_disponible'}
          trackColor={{ true: COLORES.primario }}
          accessibilityLabel="Avisarme cuando se resuelva mi reporte"
        />
      </View>
      <Text style={estilos.nota}>
        Te mandamos una notificación cuando mantenimiento resuelve un reporte tuyo. Si la apagás, solo dejamos de
        mandarla: el permiso del sistema no cambia.
      </Text>

      {/* Expo Go Android no trae expo-notifications: el interruptor queda apagado y lo explicamos. */}
      {estado === 'no_disponible' ? (
        <Text style={estilos.mensaje}>
          {TEXTO_NO_DISPONIBLE} {SIN_PERMISO}
        </Text>
      ) : null}

      {/* La preferencia quedó encendida pero el permiso se quitó desde Ajustes. */}
      {preferencias.avisarResolucion && (estado === 'bloqueado' || estado === 'preguntable') && !mostrarBloqueo ? (
        <Text style={estilos.mensaje}>Las notificaciones están desactivadas en el sistema. {SIN_PERMISO}</Text>
      ) : null}

      {mensaje ? <Text style={estilos.mensaje}>{mensaje}</Text> : null}
      {mostrarBloqueo && estado === 'bloqueado' ? (
        <AvisoBloqueado recurso="notificaciones" alternativa={SIN_PERMISO} />
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: ESPACIO.m, padding: ESPACIO.l },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ESPACIO.m,
    padding: ESPACIO.l,
    borderRadius: 12,
    backgroundColor: COLORES.superficie,
  },
  etiqueta: { flex: 1, fontSize: 16, color: COLORES.texto },
  nota: { fontSize: 14, color: COLORES.textoSuave },
  mensaje: {
    fontSize: 14,
    color: COLORES.advertencia,
    padding: ESPACIO.m,
    borderRadius: 10,
    backgroundColor: COLORES.advertenciaSuave,
  },
});
