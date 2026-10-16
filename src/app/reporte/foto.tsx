import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AvisoBloqueado } from '@/components/AvisoBloqueado';
import { Boton } from '@/components/Boton';
import { COLORES, ESPACIO } from '@/components/tema';
import { usePermiso } from '@/hooks/usePermiso';
import { useAlmacen } from '@/lib/almacen';

const OPCIONES: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, quality: 0.8 };

// "/reporte/foto" → adjuntar una foto del desperfecto.
export default function Foto() {
  const { borrador, actualizarBorrador } = useAlmacen();
  const camara = usePermiso('camara');
  const [uri, setUri] = useState<string | undefined>(borrador.fotoUri);
  const [mostrarBloqueo, setMostrarBloqueo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al volver de la pantalla previa (modal) AppState no cambia: re-consultamos al enfocar.
  const consultarCamara = camara.consultar;
  useFocusEffect(
    useCallback(() => {
      consultarCamara();
    }, [consultarCamara]),
  );

  // Elegir de la galería NO pide permiso: launchImageLibraryAsync abre el selector del
  // sistema (Photo Picker en Android, PHPicker en iOS), que corre fuera de la app.
  // La persona elige y la app recibe solo esa foto, nunca la galería entera. Por eso
  // app.json tiene photosPermission: false y bloquea READ_MEDIA_IMAGES.
  async function elegirDeGaleria() {
    setError(null);
    const resultado = await ImagePicker.launchImageLibraryAsync(OPCIONES);
    if (!resultado.canceled) setUri(resultado.assets[0].uri);
  }

  // Sacar una foto SÍ usa la cámara: necesita permiso.
  async function sacarFoto() {
    setError(null);
    if (camara.estado === 'preguntable') {
      // Primero la pantalla previa; si concede, dismissTo vuelve a esta pantalla.
      router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'camara', siguiente: '/reporte/foto' } });
      return;
    }
    if (camara.estado === 'bloqueado') {
      setMostrarBloqueo(true);
      return;
    }
    // Solo con el permiso concedido: en Android, launchCameraAsync pide el permiso por su
    // cuenta si falta, y eso saltearía la pantalla previa.
    try {
      const resultado = await ImagePicker.launchCameraAsync(OPCIONES);
      if (!resultado.canceled) setUri(resultado.assets[0].uri);
    } catch {
      // P. ej. Android 9 o anterior: ahí la cámara del selector exige WRITE_EXTERNAL_STORAGE,
      // que bloqueamos por mínimo privilegio.
      setError('No pudimos abrir la cámara. Podés elegir la foto de la galería.');
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <View style={estilos.vista}>
        {uri ? (
          <Image source={{ uri }} style={estilos.imagen} accessibilityLabel="Vista previa de la foto" />
        ) : (
          <Text style={estilos.suave}>Todavía no elegiste una foto</Text>
        )}
      </View>

      <Boton texto="Elegir de la galería" variante="secundario" onPress={elegirDeGaleria} />
      <Text style={estilos.nota}>No necesita permiso: solo vemos la foto que elegís.</Text>

      <Boton
        texto="Sacar foto"
        variante="secundario"
        onPress={sacarFoto}
        deshabilitado={camara.estado === 'cargando'}
      />
      {camara.estado === 'bloqueado' && mostrarBloqueo ? (
        <AvisoBloqueado recurso="camara" alternativa="Mientras tanto, la galería sigue disponible." />
      ) : null}

      {error ? <Text style={estilos.error}>{error}</Text> : null}

      {uri ? (
        <View style={estilos.acciones}>
          <Boton
            texto="Usar esta foto"
            onPress={() => {
              actualizarBorrador({ fotoUri: uri });
              router.back();
            }}
          />
          {borrador.fotoUri ? (
            <Boton
              texto="Quitar la foto del reporte"
              variante="secundario"
              onPress={() => {
                actualizarBorrador({ fotoUri: undefined });
                router.back();
              }}
            />
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: ESPACIO.m, padding: ESPACIO.l },
  vista: {
    height: 240,
    borderRadius: 12,
    backgroundColor: COLORES.superficie,
    borderWidth: 1,
    borderColor: COLORES.borde,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagen: { width: '100%', height: '100%' },
  suave: { fontSize: 15, color: COLORES.textoSuave },
  nota: { fontSize: 13, color: COLORES.textoSuave, textAlign: 'center', marginTop: -ESPACIO.xs },
  error: { fontSize: 14, color: COLORES.peligro, textAlign: 'center' },
  acciones: { gap: ESPACIO.s, marginTop: ESPACIO.m },
});
