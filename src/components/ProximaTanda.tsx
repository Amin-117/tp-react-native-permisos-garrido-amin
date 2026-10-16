import { StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIO } from './tema';

// Temporal: marca las pantallas que se completan en las tandas 5b y 5c. Se borra en la 5c.
export function ProximaTanda({ tanda, que }: { tanda: string; que: string }) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.texto}>
        {que}: se completa en la tanda {tanda}.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ESPACIO.xl },
  texto: { fontSize: 16, color: COLORES.textoSuave, textAlign: 'center' },
});
