import { StyleSheet, Text, View } from 'react-native';

import type { EstadoPermiso } from '@/lib/interpretar';
import { RECURSOS, type Recurso } from '@/lib/permisos';
import { AvisoBloqueado } from './AvisoBloqueado';
import { Boton } from './Boton';
import { Cargando } from './Cargando';
import { COLORES, ESPACIO } from './tema';

interface Props {
  recurso: Recurso;
  estado: EstadoPermiso;
  onContinuar: () => void;
  ocupado?: boolean; // true mientras está abierto el diálogo del sistema
  alternativa?: string; // se muestra si está bloqueado
}

// Pantalla previa al diálogo del sistema: ícono, beneficio en una frase y UN solo botón.
// - "Continuar" y no "Permitir": el que permite o no es el diálogo del sistema que viene después.
// - Sin "Ahora no" ni "Cerrar" (pauta 5.1.1(iv) de Apple): la persona sale con el gesto
//   o el botón de volver del sistema, y la pantalla de origen ofrece la alternativa.
// - Quién decide entre "Continuar" y "Abrir Ajustes" es canAskAgain, vía interpretar().
export function PantallaPrevia({ recurso, estado, onContinuar, ocupado = false, alternativa }: Props) {
  if (estado === 'cargando') return <Cargando />;

  if (estado === 'bloqueado') return <AvisoBloqueado recurso={recurso} alternativa={alternativa} />;

  const { titulo, beneficio, icono } = RECURSOS[recurso];

  if (estado === 'concedido') {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>
          {icono} {titulo}: ya está permitido
        </Text>
      </View>
    );
  }

  // estado === 'preguntable'
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.icono} accessibilityElementsHidden importantForAccessibility="no">
        {icono}
      </Text>
      <Text style={estilos.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      <Text style={estilos.beneficio}>{beneficio}</Text>
      <Text style={estilos.aclaracion}>Podés cambiarlo cuando quieras en Ajustes.</Text>
      <Boton texto="Continuar" onPress={onContinuar} ocupado={ocupado} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: ESPACIO.m,
    padding: ESPACIO.xl,
    borderRadius: 12,
    backgroundColor: COLORES.superficie,
  },
  icono: { fontSize: 48, textAlign: 'center' },
  titulo: { fontSize: 20, fontWeight: '700', color: COLORES.texto, textAlign: 'center' },
  beneficio: { fontSize: 16, color: COLORES.texto, textAlign: 'center', lineHeight: 22 },
  aclaracion: { fontSize: 14, color: COLORES.textoSuave, textAlign: 'center' },
});
