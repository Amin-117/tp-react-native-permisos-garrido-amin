import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { SelectorCategoria } from '@/components/SelectorCategoria';
import { COLORES, ESPACIO } from '@/components/tema';
import { usePermiso } from '@/hooks/usePermiso';
import { useAlmacen, validarBorrador } from '@/lib/almacen';
import { describirUbicacion } from '@/lib/etiquetas';
import { irConPermiso } from '@/lib/navegacion';

// "/reporte/nuevo" → formulario. Al abrir NO pide ningún permiso: solo consulta,
// para saber a dónde llevar cada botón. Cada permiso se pide al tocar su función.
export default function NuevoReporte() {
  const { borrador, actualizarBorrador, limpiarBorrador, crearReporte } = useAlmacen();
  const camara = usePermiso('camara');
  const ubicacion = usePermiso('ubicacion');
  const [errores, setErrores] = useState<string[]>([]);

  // Al volver del modal o de otra pantalla del stack AppState no cambia: re-consultamos al enfocar.
  const consultarCamara = camara.consultar;
  const consultarUbicacion = ubicacion.consultar;
  useFocusEffect(
    useCallback(() => {
      consultarCamara();
      consultarUbicacion();
    }, [consultarCamara, consultarUbicacion]),
  );

  function guardar() {
    const encontrados = validarBorrador(borrador);
    setErrores(encontrados);
    if (encontrados.length > 0 || borrador.categoria === null) return;
    crearReporte({
      titulo: borrador.titulo.trim(),
      descripcion: borrador.descripcion.trim(),
      aula: borrador.aula.trim(),
      categoria: borrador.categoria,
      fotoUri: borrador.fotoUri,
      ubicacion: borrador.ubicacion,
    });
    limpiarBorrador();
    router.dismissTo('/');
  }

  return (
    <KeyboardAvoidingView style={estilos.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <Campo etiqueta="Título">
          <TextInput
            style={estilos.input}
            value={borrador.titulo}
            onChangeText={(titulo) => actualizarBorrador({ titulo })}
            placeholder="Ej.: Luz quemada en el pasillo"
            placeholderTextColor={COLORES.textoSuave}
          />
        </Campo>

        <Campo etiqueta="Descripción">
          <TextInput
            style={[estilos.input, estilos.multilinea]}
            value={borrador.descripcion}
            onChangeText={(descripcion) => actualizarBorrador({ descripcion })}
            placeholder="Contanos qué pasa"
            placeholderTextColor={COLORES.textoSuave}
            multiline
          />
        </Campo>

        {/* Siempre editable: es la alternativa al QR si no hay cámara. */}
        <Campo etiqueta="Aula">
          <TextInput
            style={estilos.input}
            value={borrador.aula}
            onChangeText={(aula) => actualizarBorrador({ aula })}
            placeholder="Escribila o escaneá el QR de la puerta"
            placeholderTextColor={COLORES.textoSuave}
            autoCapitalize="characters"
          />
        </Campo>
        <Boton
          texto="Escanear QR del aula"
          variante="secundario"
          onPress={() => irConPermiso('camara', camara.estado, '/reporte/escanear')}
        />

        <SelectorCategoria valor={borrador.categoria} onCambiar={(categoria) => actualizarBorrador({ categoria })} />

        <View style={estilos.adjuntos}>
          <Text style={estilos.etiqueta}>Foto</Text>
          {borrador.fotoUri ? (
            <Image source={{ uri: borrador.fotoUri }} style={estilos.miniatura} accessibilityLabel="Foto adjunta" />
          ) : (
            <Text style={estilos.suave}>Sin foto</Text>
          )}
          <Boton
            texto={borrador.fotoUri ? 'Cambiar foto' : 'Adjuntar foto'}
            variante="secundario"
            onPress={() => router.push('/reporte/foto')}
          />
        </View>

        <View style={estilos.adjuntos}>
          <Text style={estilos.etiqueta}>Ubicación</Text>
          <Text style={estilos.suave}>
            {borrador.ubicacion ? describirUbicacion(borrador.ubicacion) : 'Sin ubicación'}
          </Text>
          <Boton
            texto="Marcar ubicación"
            variante="secundario"
            onPress={() => irConPermiso('ubicacion', ubicacion.estado, '/reporte/ubicacion')}
          />
        </View>

        {errores.length > 0 ? (
          <View style={estilos.errores} accessibilityLiveRegion="polite">
            {errores.map((e) => (
              <Text key={e} style={estilos.error}>
                • {e}
              </Text>
            ))}
          </View>
        ) : null}

        <Boton texto="Guardar reporte" onPress={guardar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: { gap: ESPACIO.l, padding: ESPACIO.l, paddingBottom: ESPACIO.xl * 2 },
  campo: { gap: ESPACIO.s },
  etiqueta: { fontSize: 15, fontWeight: '600', color: COLORES.texto },
  input: {
    minHeight: 48,
    paddingHorizontal: ESPACIO.m,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: COLORES.superficie,
    fontSize: 16,
    color: COLORES.texto,
  },
  multilinea: { minHeight: 96, paddingTop: ESPACIO.m, textAlignVertical: 'top' },
  adjuntos: { gap: ESPACIO.s, padding: ESPACIO.l, borderRadius: 12, backgroundColor: COLORES.superficie },
  miniatura: { width: '100%', height: 160, borderRadius: 8 },
  suave: { fontSize: 14, color: COLORES.textoSuave },
  errores: { gap: ESPACIO.xs, padding: ESPACIO.m, borderRadius: 10, backgroundColor: COLORES.peligroSuave },
  error: { fontSize: 14, color: COLORES.peligro },
});
