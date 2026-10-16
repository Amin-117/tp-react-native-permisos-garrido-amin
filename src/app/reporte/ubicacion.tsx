import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AvisoBloqueado } from '@/components/AvisoBloqueado';
import { Boton } from '@/components/Boton';
import { SelectorSector } from '@/components/SelectorSector';
import { COLORES, ESPACIO } from '@/components/tema';
import { usePermiso } from '@/hooks/usePermiso';
import { useAlmacen } from '@/lib/almacen';
import { describirUbicacion } from '@/lib/etiquetas';
import type { UbicacionReporte } from '@/lib/tipos';

type Gps = Extract<UbicacionReporte, { tipo: 'gps' }>;

// "/reporte/ubicacion" → dónde está el problema. Solo ubicación en PRIMER PLANO:
// nunca se llama a requestBackgroundPermissionsAsync. Sin permiso (o si el GPS falla)
// se elige el sector a mano; ese selector está siempre disponible.
export default function Ubicacion() {
  const { borrador, actualizarBorrador } = useAlmacen();
  const { estado, parcial, consultar } = usePermiso('ubicacion');
  const [posicion, setPosicion] = useState<Gps | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      consultar();
    }, [consultar]),
  );

  // Con permiso concedido, buscamos la posición (no es un pedido de permiso: ya está dado).
  useEffect(() => {
    if (estado !== 'concedido') return;
    let activo = true;
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then(({ coords }) => {
        // Receta 2: aproximada si android.accuracy === 'coarse' o ios.accuracy === 'reduced'
        // (interpretar() lo marca como parcial). Se guarda junto con la posición.
        if (activo) setPosicion({ tipo: 'gps', latitud: coords.latitude, longitud: coords.longitude, aproximada: parcial });
      })
      .catch(() => {
        if (activo) setError('No pudimos obtener tu ubicación (¿está activado el GPS?). Elegí el sector a mano.');
      });
    return () => {
      activo = false;
    };
  }, [estado, parcial, intento]);

  function guardar(ubicacion: UbicacionReporte) {
    actualizarBorrador({ ubicacion });
    router.back();
  }

  const sectorElegido = borrador.ubicacion?.tipo === 'sector' ? borrador.ubicacion.sector : null;

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>Tu ubicación actual</Text>
        <BloqueGps
          estado={estado}
          posicion={posicion}
          error={error}
          onReintentar={() => {
            setError(null);
            setIntento((n) => n + 1);
          }}
          onUsar={guardar}
        />
      </View>

      <View style={estilos.tarjeta}>
        <SelectorSector valor={sectorElegido} onCambiar={(sector) => guardar({ tipo: 'sector', sector })} />
      </View>
    </ScrollView>
  );
}

function BloqueGps({
  estado,
  posicion,
  error,
  onReintentar,
  onUsar,
}: {
  estado: ReturnType<typeof usePermiso>['estado'];
  posicion: Gps | null;
  error: string | null;
  onReintentar: () => void;
  onUsar: (u: UbicacionReporte) => void;
}) {
  if (estado === 'cargando') return <ActivityIndicator color={COLORES.primario} />;

  if (estado === 'preguntable') {
    return (
      <>
        <Text style={estilos.texto}>Para marcar el lugar con el GPS necesitamos tu ubicación mientras usás la app.</Text>
        <Boton
          texto="Usar mi ubicación"
          variante="secundario"
          onPress={() =>
            router.push({ pathname: '/permisos/[recurso]', params: { recurso: 'ubicacion', siguiente: '/reporte/ubicacion' } })
          }
        />
      </>
    );
  }

  if (estado === 'bloqueado') return <AvisoBloqueado recurso="ubicacion" alternativa="Mientras tanto, elegí el sector abajo." />;

  // concedido
  if (error) {
    return (
      <>
        <Text style={estilos.error}>{error}</Text>
        <Boton texto="Reintentar" variante="secundario" onPress={onReintentar} />
      </>
    );
  }
  if (!posicion) {
    return (
      <View style={estilos.fila}>
        <ActivityIndicator color={COLORES.primario} />
        <Text style={estilos.texto}>Buscando tu ubicación…</Text>
      </View>
    );
  }
  return (
    <>
      {/* Aproximada: describirUbicacion() no muestra coordenadas, solo "Ubicación aproximada". */}
      <Text style={estilos.ubicacion}>{describirUbicacion(posicion)}</Text>
      {posicion.aproximada ? (
        <Text style={estilos.nota}>
          Elegiste ubicación aproximada: alcanza para saber la zona. Si preferís, elegí el sector abajo.
        </Text>
      ) : null}
      <Boton texto="Usar esta ubicación" onPress={() => onUsar(posicion)} />
    </>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: ESPACIO.l, padding: ESPACIO.l },
  tarjeta: { gap: ESPACIO.m, padding: ESPACIO.l, borderRadius: 12, backgroundColor: COLORES.superficie },
  titulo: { fontSize: 16, fontWeight: '700', color: COLORES.texto },
  texto: { fontSize: 15, color: COLORES.texto, lineHeight: 21 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: ESPACIO.s },
  ubicacion: { fontSize: 18, fontWeight: '600', color: COLORES.texto },
  nota: { fontSize: 14, color: COLORES.textoSuave },
  error: { fontSize: 14, color: COLORES.peligro },
});
