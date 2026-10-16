import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIO } from './tema';

interface Props<T extends string> {
  opciones: readonly T[];
  etiquetas: Record<T, string>;
  valor: T | null;
  onCambiar: (valor: T) => void;
  titulo: string;
}

// Grupo de opciones de una sola elección. Base de SelectorSector y SelectorCategoria.
export function GrupoChips<T extends string>({ opciones, etiquetas, valor, onCambiar, titulo }: Props<T>) {
  return (
    <View style={estilos.contenedor} accessibilityRole="radiogroup" accessibilityLabel={titulo}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <View style={estilos.fila}>
        {opciones.map((opcion) => {
          const elegida = opcion === valor;
          return (
            <Pressable
              key={opcion}
              accessibilityRole="radio"
              accessibilityState={{ selected: elegida, checked: elegida }}
              onPress={() => onCambiar(opcion)}
              style={[estilos.chip, elegida && estilos.chipElegido]}>
              <Text style={[estilos.texto, elegida && estilos.textoElegido]}>{etiquetas[opcion]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: ESPACIO.s },
  titulo: { fontSize: 15, fontWeight: '600', color: COLORES.texto },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIO.s },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: ESPACIO.m,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: COLORES.superficie,
  },
  chipElegido: { borderColor: COLORES.primario, backgroundColor: COLORES.primarioSuave },
  texto: { fontSize: 14, color: COLORES.texto },
  textoElegido: { color: COLORES.primario, fontWeight: '600' },
});
