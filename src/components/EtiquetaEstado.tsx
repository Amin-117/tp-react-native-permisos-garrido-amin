import { StyleSheet, Text, View } from 'react-native';

import { ETIQUETA_ESTADO_REPORTE } from '@/lib/etiquetas';
import type { EstadoReporte } from '@/lib/tipos';
import { COLORES, ESPACIO } from './tema';

const COLOR_POR_ESTADO: Record<EstadoReporte, { fondo: string; texto: string }> = {
  pendiente: { fondo: COLORES.advertenciaSuave, texto: COLORES.advertencia },
  en_curso: { fondo: COLORES.primarioSuave, texto: COLORES.primario },
  resuelto: { fondo: COLORES.exitoSuave, texto: COLORES.exito },
};

export function EtiquetaEstado({ estado }: { estado: EstadoReporte }) {
  const { fondo, texto } = COLOR_POR_ESTADO[estado];
  return (
    <View style={[estilos.pastilla, { backgroundColor: fondo }]}>
      <Text style={[estilos.texto, { color: texto }]}>{ETIQUETA_ESTADO_REPORTE[estado]}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  pastilla: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: ESPACIO.m, paddingVertical: ESPACIO.xs },
  texto: { fontSize: 13, fontWeight: '600' },
});
