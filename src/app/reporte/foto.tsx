import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AvisoBloqueado } from '@/components/AvisoBloqueado';
import { Boton } from '@/components/Boton';
import { COLORES, ESPACIO } from '@/components/tema';
import { usePermiso } from '@/hooks/usePermiso';
import { useAlmacen } from '@/lib/almacen';

// "/reporte/foto" → adjuntar una foto del desperfecto.
export default function Foto() {
  const { borrador, actualizarBorrador } = useAlmacen();
  const camara = usePermiso('camara');
  const [uri, setUri] = useState<string | undefined>(borrador.fotoUri);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
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
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!resultado.canceled) setUri(resultado.assets[0].uri);
  }

  // Sacar una foto SÍ usa la cámara: necesita permiso. Usamos CameraView de expo-camera
  // (el mismo permiso que el escáner) y no launchCameraAsync de image-picker, porque este
  // último pide el permiso por su cuenta si falta (salteando la pantalla previa) y en
  // Android 7–9 exige WRITE_EXTERNAL_STORAGE, que bloqueamos.
  function sacarFoto() {
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
    setCamaraAbierta(true);
  }

  // La vista de cámara solo se monta con el permiso concedido. Si se revoca desde Ajustes
  // con la cámara abierta, al volver usePermiso re-consulta y se cierra sola.
  if (camaraAbierta && camara.estado === 'concedido') {
    return (
      <Camara
        onFoto={(nueva) => {
          setUri(nueva);
          setCamaraAbierta(false);
        }}
        onError={() => {
          setCamaraAbierta(false);
          setError('No pudimos sacar la foto. Probá de nuevo o elegila de la galería.');
        }}
        onCancelar={() => setCamaraAbierta(false)}
      />
    );
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

function Camara({
  onFoto,
  onError,
  onCancelar,
}: {
  onFoto: (uri: string) => void;
  onError: () => void;
  onCancelar: () => void;
}) {
  const ref = useRef<CameraView>(null);
  const [lista, setLista] = useState(false); // takePictureAsync falla si la cámara no terminó de abrir
  const [sacando, setSacando] = useState(false);

  async function disparar() {
    if (!ref.current) return;
    setSacando(true);
    try {
      // La foto queda en la caché de la app: no hace falta ningún permiso de almacenamiento.
      const foto = await ref.current.takePictureAsync({ quality: 0.8 });
      onFoto(foto.uri);
    } catch {
      onError();
    } finally {
      setSacando(false);
    }
  }

  return (
    <View style={estilos.camaraContenedor}>
      <CameraView ref={ref} style={StyleSheet.absoluteFill} facing="back" mode="picture" onCameraReady={() => setLista(true)} />
      <View style={estilos.camaraPie}>
        <Boton texto="Sacar foto" onPress={disparar} ocupado={sacando} deshabilitado={!lista} />
        <Boton texto="Cancelar" variante="secundario" onPress={onCancelar} />
      </View>
    </View>
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
  camaraContenedor: { flex: 1, backgroundColor: '#000' },
  camaraPie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: ESPACIO.s,
    padding: ESPACIO.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});
