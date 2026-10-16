// Lógica pura del QR de la puerta del aula (sin módulos nativos, se prueba con
// scripts/probar-qr.mjs). Acepta "IPF-AULA:<código>" o el código en texto plano.

const CODIGO = /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,19}$/; // 1 a 20 caracteres, sin URLs ni texto largo
const PREFIJO = /^IPF-AULA:\s*/i;

// Devuelve el código del aula normalizado (mayúsculas, sin espacios de más) o null si no sirve.
export function leerCodigoAula(datos: string): string | null {
  const texto = datos.trim().replace(PREFIJO, '').trim();
  if (!CODIGO.test(texto)) return null;
  return texto.toUpperCase().replace(/\s+/g, ' ');
}
