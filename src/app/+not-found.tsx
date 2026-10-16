import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIO } from '@/components/tema';

export default function NoEncontrado() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Esta pantalla no existe</Text>
      <Link href="/" style={estilos.link}>
        Ir a Inicio
      </Link>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ESPACIO.l, padding: ESPACIO.xl },
  titulo: { fontSize: 18, fontWeight: '700', color: COLORES.texto },
  link: { fontSize: 16, color: COLORES.primario, textDecorationLine: 'underline' },
});
