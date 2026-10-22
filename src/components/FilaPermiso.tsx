import { router } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { PermissionResponse } from 'expo';

import { ETIQUETA_ESTADO_PERMISO, TEXTO_NO_DISPONIBLE } from '@/lib/etiquetas';
import type { EstadoPermiso } from '@/lib/interpretar';
import { RECURSOS, type Recurso } from '@/lib/permisos';
import { Boton } from './Boton';
import { COLORES, ESPACIO } from './tema';

interface Props {
  recurso: Recurso;
  estado: EstadoPermiso;
  parcial: boolean;
  detalle?: string;
  respuesta: PermissionResponse | null;
  onAbrirAjustes: () => void;
}

const COLOR_ESTADO: Record<EstadoPermiso, string> = {
  cargando: COLORES.textoSuave,
  concedido: COLORES.exito,
  preguntable: COLORES.advertencia,
  bloqueado: COLORES.peligro,
  no_disponible: COLORES.textoSuave,
};

// Los campos crudos que dan el matiz, para mostrarlos tal cual en el panel.
function matices(respuesta: PermissionResponse | null): string[] {
  if (!respuesta) return [];
  const r = respuesta as PermissionResponse & {
    accessPrivileges?: string;
    android?: { accuracy?: string };
    ios?: { accuracy?: string; status?: number };
  };
  const lista = [`status: ${r.status}`, `canAskAgain: ${String(r.canAskAgain)}`];
  if (r.android?.accuracy) lista.push(`android.accuracy: ${r.android.accuracy}`);
  if (r.ios?.accuracy) lista.push(`ios.accuracy: ${r.ios.accuracy}`);
  if (r.ios?.status !== undefined) lista.push(`ios.status: ${r.ios.status}`);
  if (r.accessPrivileges) lista.push(`accessPrivileges: ${r.accessPrivileges}`);
  return lista;
}

export function FilaPermiso({ recurso, estado, parcial, detalle, respuesta, onAbrirAjustes }: Props) {
  const { titulo, icono } = RECURSOS[recurso];
  return (
    <View style={estilos.fila}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>
          {icono} {titulo}
        </Text>
        <Text style={[estilos.estado, { color: COLOR_ESTADO[estado] }]}>
          {ETIQUETA_ESTADO_PERMISO[estado]}
          {parcial ? ' (parcial)' : ''}
        </Text>
      </View>
      {detalle ? <Text style={estilos.detalle}>Matiz: {detalle}</Text> : null}
      {estado === 'no_disponible' ? <Text style={estilos.detalle}>{TEXTO_NO_DISPONIBLE}</Text> : null}
      <Text style={estilos.tecnico}>
        {Platform.OS} · {matices(respuesta).join(' · ')}
      </Text>
      {/* "preguntable" incluye undetermined y denied con canAskAgain true. "Pedir" NO llama a
          pedir(): abre la pantalla previa, y el pedido sale de su botón "Continuar". */}
      {estado === 'preguntable' ? (
        <Boton
          texto="Pedir"
          variante="secundario"
          onPress={() => router.push({ pathname: '/permisos/[recurso]', params: { recurso } })}
        />
      ) : null}
      {estado === 'bloqueado' || parcial ? (
        <Boton texto="Abrir Ajustes" variante="secundario" onPress={onAbrirAjustes} />
      ) : null}
    </View>
  );
}

// Fila fija: elegir fotos usa el selector del sistema, que no necesita permiso.
export function FilaFotos() {
  return (
    <View style={estilos.fila}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>🖼️ Fotos</Text>
        <Text style={[estilos.estado, { color: COLORES.exito }]}>No requiere permiso</Text>
      </View>
      <Text style={estilos.detalle}>
        Usamos el selector del sistema: solo vemos la foto que elegís, no tu galería.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    gap: ESPACIO.s,
    padding: ESPACIO.l,
    borderRadius: 12,
    backgroundColor: COLORES.superficie,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: ESPACIO.s },
  titulo: { fontSize: 16, fontWeight: '600', color: COLORES.texto },
  estado: { fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  detalle: { fontSize: 14, color: COLORES.texto },
  tecnico: { fontSize: 12, color: COLORES.textoSuave, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
});
