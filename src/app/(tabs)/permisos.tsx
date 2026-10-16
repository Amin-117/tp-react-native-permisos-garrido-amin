import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { FilaFotos, FilaPermiso } from '@/components/FilaPermiso';
import { COLORES, ESPACIO } from '@/components/tema';
import { usePermiso, type ResultadoPermiso } from '@/hooks/usePermiso';
import type { Recurso } from '@/lib/permisos';

// "/permisos" → estado de cada permiso. Solo consulta; "Pedir" abre la pantalla previa.
// Se actualiza:
// - al volver de Ajustes (AppState, dentro de usePermiso), y
// - al volver a esta pantalla (useFocusEffect), p. ej. cuando se cierra el modal
//   /permisos/[recurso]: ahí la app nunca sale del primer plano, así que AppState no avisa.
export default function Permisos() {
  const camara = usePermiso('camara');
  const ubicacion = usePermiso('ubicacion');
  const notificaciones = usePermiso('notificaciones');

  const consultarCamara = camara.consultar;
  const consultarUbicacion = ubicacion.consultar;
  const consultarNotificaciones = notificaciones.consultar;
  useFocusEffect(
    useCallback(() => {
      consultarCamara();
      consultarUbicacion();
      consultarNotificaciones();
    }, [consultarCamara, consultarUbicacion, consultarNotificaciones]),
  );

  const filas: [Recurso, ResultadoPermiso][] = [
    ['camara', camara],
    ['ubicacion', ubicacion],
    ['notificaciones', notificaciones],
  ];

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Text style={estilos.aclaracion}>
        Ningún permiso es obligatorio: si no das alguno, la app te ofrece otra forma de hacer lo mismo.
      </Text>
      {filas.map(([recurso, p]) => (
        <FilaPermiso
          key={recurso}
          recurso={recurso}
          estado={p.estado}
          parcial={p.parcial}
          detalle={p.detalle}
          respuesta={p.respuesta}
          onAbrirAjustes={p.abrirAjustes}
        />
      ))}
      <FilaFotos />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: ESPACIO.m, padding: ESPACIO.l },
  aclaracion: { fontSize: 14, color: COLORES.textoSuave },
});
