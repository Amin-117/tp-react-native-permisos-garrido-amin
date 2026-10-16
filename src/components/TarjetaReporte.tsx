import { Pressable, StyleSheet, Text, View } from 'react-native';

import { describirUbicacion, ETIQUETA_CATEGORIA } from '@/lib/etiquetas';
import type { Reporte } from '@/lib/tipos';
import { EtiquetaEstado } from './EtiquetaEstado';
import { COLORES, ESPACIO } from './tema';

export function TarjetaReporte({ reporte, onPress }: { reporte: Reporte; onPress: () => void }) {
  const lugar = reporte.aula
    ? `Aula ${reporte.aula}`
    : reporte.ubicacion
      ? describirUbicacion(reporte.ubicacion)
      : 'Sin lugar';
  const fecha = new Date(reporte.creadoEn).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}>
      <View style={estilos.fila}>
        <Text style={estilos.titulo} numberOfLines={1}>
          {reporte.titulo}
        </Text>
        <EtiquetaEstado estado={reporte.estado} />
      </View>
      <Text style={estilos.detalle}>
        {ETIQUETA_CATEGORIA[reporte.categoria]} · {lugar} · {fecha}
        {reporte.fotoUri ? ' · 📷' : ''}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: ESPACIO.s,
    padding: ESPACIO.l,
    borderRadius: 12,
    backgroundColor: COLORES.superficie,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  presionada: { opacity: 0.7 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s },
  titulo: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORES.texto },
  detalle: { fontSize: 14, color: COLORES.textoSuave },
});
