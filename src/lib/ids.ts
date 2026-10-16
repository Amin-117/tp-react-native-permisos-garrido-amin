// Ids del tipo "lz3k9a2-x7f2qa": momento de creación + parte aleatoria, ambos en base 36.
// Alcanza para una app local; no hace falta un UUID.
const FORMATO_ID = /^[a-z0-9]{6,12}-[a-z0-9]{6}$/;

export function generarId(): string {
  const tiempo = Date.now().toString(36);
  const azar = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `${tiempo}-${azar}`;
}

// Sirve para validar el [id] de /reporte/[id], que puede llegar desde una URL
// (useLocalSearchParams devuelve string | string[] | undefined).
export function esIdValido(id: unknown): id is string {
  return typeof id === 'string' && FORMATO_ID.test(id);
}
