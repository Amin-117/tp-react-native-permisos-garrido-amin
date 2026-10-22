import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { Cargando } from '@/components/Cargando';
import { EtiquetaEstado } from '@/components/EtiquetaEstado';
import { COLORES, ESPACIO } from '@/components/tema';
import { usePermiso } from '@/hooks/usePermiso';
import { useAlmacen } from '@/lib/almacen';
import { describirUbicacion, ETIQUETA_CATEGORIA } from '@/lib/etiquetas';
import { esIdValido } from '@/lib/ids';
import { programarAvisoResolucion } from '@/lib/notificaciones';
import type { Reporte } from '@/lib/tipos';

// "/reporte/[id]" → detalle. El id viene de la URL: se valida antes de buscarlo.
export default function DetalleReporte() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cargado, reportes } = useAlmacen();

  if (!cargado) return <Cargando texto="Cargando reporte…" />;

  const reporte = esIdValido(id) ? reportes.find((r) => r.id === id) : undefined;
  if (!reporte) {
    return (
      <View style={estilos.noEncontrado}>
        <Stack.Screen options={{ title: 'Reporte' }} />
        <Text style={estilos.noEncontradoTexto}>No encontramos ese reporte.</Text>
        <Boton texto="Ir a Inicio" onPress={() => router.dismissTo('/')} />
      </View>
    );
  }
  return <Detalle reporte={reporte} />;
}

function Detalle({ reporte }: { reporte: Reporte }) {
  const { preferencias, programarResolucion } = useAlmacen();
  const notificaciones = usePermiso('notificaciones');
  const [aviso, setAviso] = useState<string | null>(null);

  // Si cambió el permiso en /ajustes-app o en el panel, lo sabemos al volver acá.
  const consultarNotificaciones = notificaciones.consultar;
  useFocusEffect(
    useCallback(() => {
      consultarNotificaciones();
    }, [consultarNotificaciones]),
  );

  async function simularResolucion() {
    // Pasa a "en curso" y programa SIEMPRE el setTimeout que lo resuelve (ver almacen.tsx):
    // aunque no haya permiso de notificaciones, el aviso aparece en /avisos.
    programarResolucion(reporte.id);

    // La notificación del sistema es un extra: solo si la persona la pidió y hay permiso.
    if (!(preferencias.avisarResolucion && notificaciones.estado === 'concedido')) {
      setAviso('En 10 segundos vas a ver el aviso en la pestaña Avisos.');
      return;
    }
    try {
      await programarAvisoResolucion(reporte);
      setAviso('En 10 segundos te llega una notificación y el aviso en la pestaña Avisos.');
    } catch {
      setAviso('No pudimos programar la notificación. En 10 segundos vas a ver el aviso en la pestaña Avisos.');
    }
  }

  const fecha = new Date(reporte.creadoEn).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: reporte.titulo }} />
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>{reporte.titulo}</Text>
        <EtiquetaEstado estado={reporte.estado} />
      </View>

      <Dato etiqueta="Categoría" valor={ETIQUETA_CATEGORIA[reporte.categoria]} />
      {reporte.aula ? <Dato etiqueta="Aula" valor={reporte.aula} /> : null}
      <Dato
        etiqueta="Ubicación"
        valor={reporte.ubicacion ? describirUbicacion(reporte.ubicacion) : 'Sin ubicación'}
      />
      {reporte.descripcion ? <Dato etiqueta="Descripción" valor={reporte.descripcion} /> : null}
      <Dato etiqueta="Creado" valor={fecha} />

      {reporte.fotoUri ? (
        <Image source={{ uri: reporte.fotoUri }} style={estilos.foto} accessibilityLabel="Foto del desperfecto" />
      ) : null}

      {reporte.estado === 'pendiente' ? (
        <View style={estilos.prueba}>
          <Text style={estilos.pruebaTexto}>Botón de prueba: simula que mantenimiento lo resuelve en 10 segundos.</Text>
          <Boton texto="Simular resolución" onPress={simularResolucion} />
        </View>
      ) : null}
      {reporte.estado === 'en_curso' ? (
        <Text style={estilos.nota}>{aviso ?? 'Se está resolviendo…'}</Text>
      ) : null}
    </ScrollView>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={estilos.dato}>
      <Text style={estilos.datoEtiqueta}>{etiqueta}</Text>
      <Text style={estilos.datoValor}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: ESPACIO.m, padding: ESPACIO.l },
  encabezado: { gap: ESPACIO.s, marginBottom: ESPACIO.s },
  titulo: { fontSize: 22, fontWeight: '700', color: COLORES.texto },
  dato: { gap: 2 },
  datoEtiqueta: { fontSize: 13, color: COLORES.textoSuave },
  datoValor: { fontSize: 16, color: COLORES.texto },
  foto: { width: '100%', height: 240, borderRadius: 12 },
  prueba: { gap: ESPACIO.s, marginTop: ESPACIO.l, padding: ESPACIO.l, borderRadius: 12, backgroundColor: COLORES.primarioSuave },
  pruebaTexto: { fontSize: 14, color: COLORES.texto },
  nota: { fontSize: 14, color: COLORES.textoSuave, marginTop: ESPACIO.l },
  noEncontrado: { flex: 1, justifyContent: 'center', gap: ESPACIO.l, padding: ESPACIO.xl },
  noEncontradoTexto: { fontSize: 16, color: COLORES.texto, textAlign: 'center' },
});
