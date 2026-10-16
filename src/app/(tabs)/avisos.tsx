import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIO } from '@/components/tema';
import { useAlmacen } from '@/lib/almacen';
import type { Aviso } from '@/lib/tipos';

// "/avisos" → bandeja dentro de la app. Es la alternativa a las notificaciones: cada
// resolución deja su aviso acá, haya o no permiso. El número de la pestaña son los no leídos.
export default function Avisos() {
  const { avisos, noLeidos, marcarAvisoLeido } = useAlmacen();

  function abrir(aviso: Aviso) {
    marcarAvisoLeido(aviso.id);
    router.push({ pathname: '/reporte/[id]', params: { id: aviso.reporteId } });
  }

  return (
    <FlatList
      data={avisos}
      keyExtractor={(a) => a.id}
      contentContainerStyle={estilos.lista}
      ListHeaderComponent={
        <View style={estilos.encabezado}>
          <Text style={estilos.aclaracion}>
            Acá vas a ver cuando se resuelva un reporte, aunque no hayas activado las notificaciones.
          </Text>
          {noLeidos > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => avisos.filter((a) => !a.leido).forEach((a) => marcarAvisoLeido(a.id))}
              hitSlop={8}>
              <Text style={estilos.link}>Marcar todos como leídos</Text>
            </Pressable>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Abre el reporte y marca el aviso como leído"
          onPress={() => abrir(item)}
          style={({ pressed }) => [estilos.aviso, !item.leido && estilos.noLeido, pressed && estilos.presionado]}>
          <View style={estilos.fila}>
            {!item.leido ? <View style={estilos.punto} accessibilityLabel="No leído" /> : null}
            <Text style={[estilos.texto, !item.leido && estilos.textoNoLeido]}>{item.texto}</Text>
          </View>
          <Text style={estilos.fecha}>
            {new Date(item.creadoEn).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
          </Text>
        </Pressable>
      )}
      ListEmptyComponent={<Text style={estilos.vacio}>No tenés avisos todavía.</Text>}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { gap: ESPACIO.m, padding: ESPACIO.l },
  encabezado: { gap: ESPACIO.s },
  aclaracion: { fontSize: 14, color: COLORES.textoSuave },
  link: { fontSize: 14, color: COLORES.primario, fontWeight: '600' },
  aviso: {
    gap: ESPACIO.xs,
    padding: ESPACIO.l,
    borderRadius: 12,
    backgroundColor: COLORES.superficie,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  noLeido: { borderColor: COLORES.primario, backgroundColor: COLORES.primarioSuave },
  presionado: { opacity: 0.7 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.primario },
  texto: { flex: 1, fontSize: 15, color: COLORES.texto },
  textoNoLeido: { fontWeight: '600' },
  fecha: { fontSize: 12, color: COLORES.textoSuave },
  vacio: { fontSize: 15, color: COLORES.textoSuave, textAlign: 'center', marginTop: ESPACIO.xl },
});
