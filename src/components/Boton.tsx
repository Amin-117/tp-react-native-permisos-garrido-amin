import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { COLORES, ESPACIO } from './tema';

interface Props {
  texto: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  ocupado?: boolean; // mientras espera (p. ej. el diálogo del sistema): evita el doble toque
  deshabilitado?: boolean;
}

export function Boton({ texto, onPress, variante = 'primario', ocupado = false, deshabilitado = false }: Props) {
  const inactivo = ocupado || deshabilitado;
  const primario = variante === 'primario';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: ocupado }}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        primario ? estilos.primario : estilos.secundario,
        (pressed || inactivo) && estilos.apagado,
      ]}>
      {ocupado ? (
        <ActivityIndicator color={primario ? COLORES.superficie : COLORES.primario} />
      ) : (
        <Text style={[estilos.texto, primario ? estilos.textoPrimario : estilos.textoSecundario]}>{texto}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: ESPACIO.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: { backgroundColor: COLORES.primario },
  secundario: { backgroundColor: COLORES.superficie, borderWidth: 1, borderColor: COLORES.primario },
  apagado: { opacity: 0.6 },
  texto: { fontSize: 16, fontWeight: '600' },
  textoPrimario: { color: COLORES.superficie },
  textoSecundario: { color: COLORES.primario },
});
