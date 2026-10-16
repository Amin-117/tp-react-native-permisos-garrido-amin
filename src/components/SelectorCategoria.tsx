import { ETIQUETA_CATEGORIA } from '@/lib/etiquetas';
import { CATEGORIAS, type Categoria } from '@/lib/tipos';
import { GrupoChips } from './GrupoChips';

export function SelectorCategoria({
  valor,
  onCambiar,
}: {
  valor: Categoria | null;
  onCambiar: (c: Categoria) => void;
}) {
  return (
    <GrupoChips
      titulo="Categoría"
      opciones={CATEGORIAS}
      etiquetas={ETIQUETA_CATEGORIA}
      valor={valor}
      onCambiar={onCambiar}
    />
  );
}
