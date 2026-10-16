import { FlatList, StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIO } from '@/components/tema';
import { useAlmacen } from '@/lib/almacen';

// "/avisos" → bandeja dentro de la app. Es la alternativa a las notificaciones:
// los avisos aparecen acá aunque el permiso esté denegado.
// (Versión básica: en la tanda 5c se suma marcar como leído y abrir el reporte.)
export default function Avisos() {
  const { avisos } = useAlmacen();

  return (
    <FlatList
      data={avisos}
      keyExtractor={(a) => a.id}
      contentContainerStyle={estilos.lista}
      ListHeaderComponent={
        <Text style={estilos.aclaracion}>
          Acá vas a ver cuando se resuelva un reporte, aunque no hayas activado las notificaciones.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={estilos.aviso}>
          <Text style={estilos.texto}>{item.texto}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={estilos.vacio}>No tenés avisos todavía.</Text>}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { gap: ESPACIO.m, padding: ESPACIO.l },
  aclaracion: { fontSize: 14, color: COLORES.textoSuave },
  aviso: { padding: ESPACIO.l, borderRadius: 12, backgroundColor: COLORES.superficie },
  texto: { fontSize: 15, color: COLORES.texto },
  vacio: { fontSize: 15, color: COLORES.textoSuave, textAlign: 'center', marginTop: ESPACIO.xl },
});
