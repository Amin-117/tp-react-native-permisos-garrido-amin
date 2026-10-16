// Colores de la app. Son fijos (tema claro) para que el contraste no dependa del sistema.
export const COLORES = {
  primario: '#1E5AA8', // el mismo color de las notificaciones (app.json)
  primarioSuave: '#E3ECF8',
  fondo: '#F5F7FA',
  superficie: '#FFFFFF',
  texto: '#1A1F2B',
  textoSuave: '#5B6475',
  borde: '#D5DBE5',
  peligro: '#B3261E',
  peligroSuave: '#FBE9E7',
  advertencia: '#8A5A00',
  advertenciaSuave: '#FFF4D6',
  exito: '#1B6E3A',
  exitoSuave: '#E3F4E8',
} as const;

export const ESPACIO = { xs: 4, s: 8, m: 12, l: 16, xl: 24 } as const;
