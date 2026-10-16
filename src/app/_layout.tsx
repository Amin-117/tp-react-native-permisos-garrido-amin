import { Stack } from "expo-router";

import { ProveedorAlmacen } from "@/lib/almacen";

export default function RootLayout() {
  return (
    <ProveedorAlmacen>
      <Stack />
    </ProveedorAlmacen>
  );
}
