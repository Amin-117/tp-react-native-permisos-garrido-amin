import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIO } from './tema';

// Estado 'cargando' (respuesta null): se muestra esto, nunca "denegado".
export function Cargando({ texto = 'Consultando permisos…' }: { texto?: string }) {
  return (
    <View style={estilos.contenedor} accessibilityRole="progressbar" accessibilityLabel={texto}>
      <ActivityIndicator size="large" color={COLORES.primario} />
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ESPACIO.m, padding: ESPACIO.xl },
  texto: { color: COLORES.textoSuave, fontSize: 15 },
});
