import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { Cargando } from '@/components/Cargando';
import { TarjetaReporte } from '@/components/TarjetaReporte';
import { COLORES, ESPACIO } from '@/components/tema';
import { useAlmacen } from '@/lib/almacen';

// "/" → lista de reportes propios. No usa ningún permiso.
export default function Reportes() {
  const { cargado, reportes } = useAlmacen();

  if (!cargado) return <Cargando texto="Cargando reportes…" />;

  return (
    <View style={estilos.pantalla}>
      <FlatList
        data={reportes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={estilos.lista}
        renderItem={({ item }) => (
          <TarjetaReporte
            reporte={item}
            onPress={() => router.push({ pathname: '/reporte/[id]', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={estilos.vacio}>
            <Text style={estilos.vacioIcono}>🛠️</Text>
            <Text style={estilos.vacioTitulo}>Todavía no hiciste reportes</Text>
            <Text style={estilos.vacioTexto}>
              ¿Viste una luz quemada, una canilla que pierde o un proyector roto? Tocá &quot;Nuevo reporte&quot; y
              avisanos.
            </Text>
          </View>
        }
      />
      <View style={estilos.pie}>
        <Boton texto="Nuevo reporte" onPress={() => router.push('/reporte/nuevo')} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  lista: { gap: ESPACIO.m, padding: ESPACIO.l, flexGrow: 1 },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ESPACIO.s, padding: ESPACIO.xl },
  vacioIcono: { fontSize: 48 },
  vacioTitulo: { fontSize: 18, fontWeight: '700', color: COLORES.texto },
  vacioTexto: { fontSize: 15, color: COLORES.textoSuave, textAlign: 'center', lineHeight: 21 },
  pie: { padding: ESPACIO.l, borderTopWidth: 1, borderTopColor: COLORES.borde, backgroundColor: COLORES.superficie },
});
