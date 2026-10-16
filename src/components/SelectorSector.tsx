import { ETIQUETA_SECTOR } from '@/lib/etiquetas';
import { SECTORES, type Sector } from '@/lib/tipos';
import { GrupoChips } from './GrupoChips';

// Alternativa a la ubicación: siempre disponible, con o sin permiso.
export function SelectorSector({ valor, onCambiar }: { valor: Sector | null; onCambiar: (s: Sector) => void }) {
  return (
    <GrupoChips
      titulo="Elegí el sector a mano"
      opciones={SECTORES}
      etiquetas={ETIQUETA_SECTOR}
      valor={valor}
      onCambiar={onCambiar}
    />
  );
}
