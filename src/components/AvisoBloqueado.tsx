import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { pasosAjustes, RECURSOS, type Recurso } from '@/lib/permisos';
import { Boton } from './Boton';
import { COLORES, ESPACIO } from './tema';

interface Props {
  recurso: Recurso;
  // Qué puede hacer la persona igual, sin el permiso (p. ej. "Podés escribir el aula a mano").
  alternativa?: string;
}

// Permiso bloqueado (canAskAgain === false): request…() ya no muestra diálogo,
// así que no lo llamamos. Explicamos el camino y ofrecemos abrir Ajustes.
export function AvisoBloqueado({ recurso, alternativa }: Props) {
  const { titulo, icono } = RECURSOS[recurso];
  const pasos = pasosAjustes(recurso, Platform.OS);

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.icono} accessibilityElementsHidden importantForAccessibility="no">
        {icono}
      </Text>
      <Text style={estilos.titulo} accessibilityRole="header">
        {titulo}: permiso bloqueado
      </Text>
      <Text style={estilos.texto}>
        Antes elegiste no permitirlo y el sistema ya no nos deja volver a preguntarte. Si querés usar esta función,
        activalo desde Ajustes:
      </Text>
      <View style={estilos.pasos}>
        {pasos.map((paso, i) => (
          <Text key={paso} style={estilos.paso}>
            {i + 1}. {paso}
          </Text>
        ))}
      </View>
      <Boton texto="Abrir Ajustes" onPress={() => Linking.openSettings()} />
      {alternativa ? <Text style={estilos.alternativa}>{alternativa}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: ESPACIO.m,
    padding: ESPACIO.l,
    borderRadius: 12,
    backgroundColor: COLORES.advertenciaSuave,
  },
  icono: { fontSize: 36, textAlign: 'center' },
  titulo: { fontSize: 18, fontWeight: '700', color: COLORES.texto, textAlign: 'center' },
  texto: { fontSize: 15, color: COLORES.texto, lineHeight: 21 },
  pasos: { gap: ESPACIO.xs, paddingLeft: ESPACIO.s },
  paso: { fontSize: 15, color: COLORES.texto },
  alternativa: { fontSize: 14, color: COLORES.textoSuave, textAlign: 'center' },
});
