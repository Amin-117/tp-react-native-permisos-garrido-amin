import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { PantallaPrevia } from '@/components/PantallaPrevia';
import { COLORES, ESPACIO } from '@/components/tema';
import { usePermiso } from '@/hooks/usePermiso';
import { interpretar } from '@/lib/interpretar';
import { esDestinoValido, type Destino } from '@/lib/navegacion';
import { esRecurso, RECURSOS, type Recurso } from '@/lib/permisos';

// "/permisos/[recurso]" (modal) → pantalla previa al diálogo del sistema.
// Solo se abre por un toque (botones de /reporte/nuevo, /reporte/foto, /ajustes-app o
// "Pedir" en /permisos), nunca automáticamente.
export default function PantallaPermiso() {
  const { recurso, siguiente } = useLocalSearchParams<{ recurso: string; siguiente?: string }>();

  // El recurso viene de la URL: puede ser cualquier cosa.
  if (!esRecurso(recurso)) {
    return (
      <View style={estilos.error}>
        <Stack.Screen options={{ title: 'Permiso desconocido' }} />
        <Text style={estilos.errorTexto}>No conocemos el permiso &quot;{String(recurso)}&quot;.</Text>
        <Boton texto="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  return <Previa recurso={recurso} siguiente={esDestinoValido(siguiente) ? siguiente : undefined} />;
}

// Componente aparte para que usePermiso reciba siempre un recurso válido
// (los hooks no pueden ir después de un return condicional).
function Previa({ recurso, siguiente }: { recurso: Recurso; siguiente?: Destino }) {
  const { estado, pedir } = usePermiso(recurso);
  const [pidiendo, setPidiendo] = useState(false);

  // Único lugar donde se llama a pedir() de usePermiso, y solo al tocar "Continuar".
  // (El escáner usa el requestPermission de useCameraPermissions: ver /reporte/escanear.)
  async function continuar() {
    setPidiendo(true);
    try {
      const respuesta = await pedir();
      if (interpretar(respuesta).estado === 'concedido' && siguiente) {
        // concedido: seguimos a la función. dismissTo vuelve a esa pantalla si ya está en el
        // stack (p. ej. desde /reporte/foto) o reemplaza al modal si no (p. ej. /reporte/escanear).
        router.dismissTo(siguiente);
      } else {
        router.back(); // no concedido: la pantalla de origen muestra su alternativa
      }
    } finally {
      setPidiendo(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: RECURSOS[recurso].titulo }} />
      <PantallaPrevia recurso={recurso} estado={estado} onContinuar={continuar} ocupado={pidiendo} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { flexGrow: 1, justifyContent: 'center', padding: ESPACIO.l },
  error: { flex: 1, justifyContent: 'center', gap: ESPACIO.l, padding: ESPACIO.xl },
  errorTexto: { fontSize: 16, color: COLORES.texto, textAlign: 'center' },
});
