import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AvisoBloqueado } from '@/components/AvisoBloqueado';
import { Boton } from '@/components/Boton';
import { Cargando } from '@/components/Cargando';
import { PantallaPrevia } from '@/components/PantallaPrevia';
import { COLORES, ESPACIO } from '@/components/tema';
import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';
import { useAlmacen } from '@/lib/almacen';
import { leerCodigoAula } from '@/lib/qr';

// "/reporte/escanear" → lee el QR de la puerta del aula.
//
// Decisión: la consigna pide useCameraPermissions acá, así que esta pantalla usa el hook
// de expo-camera directo (Receta 1) en lugar de usePermiso. Los cuatro estados salen
// de leer la respuesta a mano:
//   1. !permiso              → cargando (primer render: todavía no sabemos)
//   2. permiso.granted       → la cámara
//   3. permiso.canAskAgain   → pantalla previa con "Continuar"
//   4. si no                 → bloqueado: "Abrir Ajustes" (no se llama a request…())
// El hook de Expo NO se entera solo de los cambios hechos en Ajustes: por eso
// useRevisarAlVolver(consultarPermiso) re-consulta al volver al primer plano.
// Sin opciones, el hook solo consulta al montar (con { request: true } pediría al abrir: no).
export default function Escanear() {
  const [permiso, pedirPermiso, consultarPermiso] = useCameraPermissions();
  const [pidiendo, setPidiendo] = useState(false);
  useRevisarAlVolver(consultarPermiso);

  // 1. Cargando
  if (!permiso) return <Cargando />;

  // 2. Concedido
  if (permiso.granted) return <Camara />;

  // Se llama solo desde el botón "Continuar".
  async function continuar() {
    setPidiendo(true);
    try {
      await pedirPermiso(); // el hook actualiza `permiso` y la pantalla cambia sola de estado
    } finally {
      setPidiendo(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
      {permiso.canAskAgain ? (
        // 3. Preguntable
        <PantallaPrevia recurso="camara" estado="preguntable" onContinuar={continuar} ocupado={pidiendo} />
      ) : (
        // 4. Bloqueado
        <AvisoBloqueado recurso="camara" />
      )}
      {/* Alternativa, separada de la pantalla previa: el reporte se puede hacer igual. */}
      <AulaAMano />
    </ScrollView>
  );
}

function Camara() {
  const { actualizarBorrador } = useAlmacen();
  // onBarcodeScanned se dispara muchas veces por segundo: con la ref leemos una sola vez.
  const leido = useRef(false);
  const [error, setError] = useState<string | null>(null);

  function alLeer({ data }: BarcodeScanningResult) {
    if (leido.current) return;
    leido.current = true;
    const aula = leerCodigoAula(data);
    if (aula === null) {
      setError('Ese QR no es el de un aula. Probá con el de la puerta o escribí el aula a mano.');
      return; // queda pausado hasta que toque "Volver a intentar"
    }
    actualizarBorrador({ aula });
    router.back();
  }

  return (
    <View style={estilos.camaraContenedor}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={error ? undefined : alLeer}
      />
      <View style={estilos.camaraPie}>
        {error ? (
          <>
            <Text style={estilos.camaraTexto}>{error}</Text>
            <Boton
              texto="Volver a intentar"
              onPress={() => {
                setError(null);
                leido.current = false;
              }}
            />
          </>
        ) : (
          <Text style={estilos.camaraTexto}>Apuntá al QR pegado en la puerta del aula.</Text>
        )}
      </View>
    </View>
  );
}

function AulaAMano() {
  const { borrador, actualizarBorrador } = useAlmacen();
  const [texto, setTexto] = useState(borrador.aula);

  return (
    <View style={estilos.aMano}>
      <Text style={estilos.aManoTitulo}>Escribir el código del aula a mano</Text>
      <TextInput
        style={estilos.input}
        value={texto}
        onChangeText={setTexto}
        placeholder="Ej.: B12"
        placeholderTextColor={COLORES.textoSuave}
        autoCapitalize="characters"
        returnKeyType="done"
      />
      <Boton
        texto="Usar este código"
        variante="secundario"
        deshabilitado={texto.trim() === ''}
        onPress={() => {
          actualizarBorrador({ aula: texto.trim() });
          router.back();
        }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: ESPACIO.xl, padding: ESPACIO.l },
  camaraContenedor: { flex: 1, backgroundColor: '#000' },
  camaraPie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: ESPACIO.m,
    padding: ESPACIO.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  camaraTexto: { color: '#FFF', fontSize: 16, textAlign: 'center' },
  aMano: { gap: ESPACIO.s, padding: ESPACIO.l, borderRadius: 12, backgroundColor: COLORES.superficie },
  aManoTitulo: { fontSize: 15, fontWeight: '600', color: COLORES.texto },
  input: {
    minHeight: 48,
    paddingHorizontal: ESPACIO.m,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORES.borde,
    fontSize: 16,
    color: COLORES.texto,
  },
});
