# Guía para la defensa oral (G6)

Cada pregunta con el archivo y la línea que la responde. Las líneas corresponden al commit de la Fase 7; si cambia el código, buscá el texto citado.

---

## 1. ¿Qué código decide entre "Continuar" y "Abrir Ajustes"? ¿Qué campo lo decide?

**El campo es `canAskAgain`.** Con `granted: false`:
- si `canAskAgain` es `true`, el diálogo todavía puede aparecer → **"Continuar"**;
- si es `false`, `request…()` ya no muestra nada → **"Abrir Ajustes"**.

| Dónde | Qué mostrar |
|---|---|
| [src/lib/interpretar.ts:61](../src/lib/interpretar.ts#L61) | `if (respuesta.canAskAgain) return { estado: 'preguntable' … }` |
| [src/lib/interpretar.ts:66](../src/lib/interpretar.ts#L66) | si no → `{ estado: 'bloqueado' }` |
| [src/components/PantallaPrevia.tsx:26](../src/components/PantallaPrevia.tsx#L26) | `bloqueado` → `<AvisoBloqueado>` |
| [src/components/PantallaPrevia.tsx:51](../src/components/PantallaPrevia.tsx#L51) | `preguntable` → botón "Continuar" |
| [src/components/AvisoBloqueado.tsx:38](../src/components/AvisoBloqueado.tsx#L38) | botón "Abrir Ajustes" → `Linking.openSettings()` |
| [src/app/reporte/escanear.tsx:50](../src/app/reporte/escanear.tsx#L50) | en el escáner, la misma decisión leída a mano: `permiso.canAskAgain ? <PantallaPrevia> : <AvisoBloqueado>` |

Para mostrar que funciona: `npm run test:interpretar` (casos 6a, 6b y 7 de [scripts/probar-interpretar.mjs](../scripts/probar-interpretar.mjs)).

**Dónde se pide de verdad:** solo al tocar "Continuar".
- [src/app/permisos/[recurso].tsx:44](../src/app/permisos/[recurso].tsx#L44): `await pedir()`.
- En el escáner, `pedirPermiso()` dentro de `continuar()`.

En ningún `useEffect` ni render se llama a `request…()`.

---

## 2. Revocá la cámara desde Ajustes con la app abierta y volvé. ¿Qué hace Android? ¿Cómo se entera tu código?

**Android mata el proceso de la app** al revocar un permiso. Al volver, la app arranca de nuevo, y el código se entera porque **consulta** el permiso (nunca lo guarda):

| Dónde | Qué mostrar |
|---|---|
| [src/hooks/useRevisarAlVolver.ts:13](../src/hooks/useRevisarAlVolver.ts#L13) | Receta 5: `anterior.current !== 'active' && nuevo === 'active'` → re-consultar |
| [src/hooks/useRevisarAlVolver.ts:16](../src/hooks/useRevisarAlVolver.ts#L16) | limpieza: `sub.remove()` |
| [src/hooks/usePermiso.ts:52](../src/hooks/usePermiso.ts#L52) | al montar (incluido el arranque después de que Android mató el proceso), solo **consulta** |
| [src/hooks/usePermiso.ts:66](../src/hooks/usePermiso.ts#L66) | `useRevisarAlVolver(consultar)`: si el proceso no murió (por ejemplo, al **habilitar** en Ajustes), se entera al volver al primer plano |
| [src/hooks/usePermiso.ts:30](../src/hooks/usePermiso.ts#L30) | `consultar` con `useCallback`, para no re-suscribirse a `AppState` en cada render |
| [src/app/reporte/escanear.tsx:30](../src/app/reporte/escanear.tsx#L30) | en el escáner: `useRevisarAlVolver(consultarPermiso)` con el hook de `expo-camera` |
| [src/lib/almacen.tsx](../src/lib/almacen.tsx) (comentario del principio) | el estado de los permisos **no** se guarda en el almacén ni en AsyncStorage |

**Detalle extra.** Al cerrar el modal `/permisos/[recurso]` la app no sale del primer plano, así que `AppState` no avisa. Por eso el panel y `/reporte/nuevo` también re-consultan al enfocarse: [src/app/(tabs)/permisos.tsx:23](../src/app/(tabs)/permisos.tsx#L23) (`useFocusEffect`).

---

## 3. ¿Por qué no pedís permiso para elegir una foto, pero sí para sacarla?

**Elegir:** `launchImageLibraryAsync` abre el **selector del sistema**, que corre fuera de mi app. La persona elige y mi app recibe solo esa foto, nunca la galería. No hay nada que proteger, así que no hay permiso.
- [src/app/reporte/foto.tsx:30](../src/app/reporte/foto.tsx#L30): el comentario que lo explica.
- [src/app/reporte/foto.tsx:36](../src/app/reporte/foto.tsx#L36): la llamada.
- En `app.json`, `photosPermission: false` ([app.json:69](../app.json#L69)) y `READ_MEDIA_IMAGES` en `blockedPermissions` ([app.json:22](../app.json#L22)).

**Sacar:** uso la **cámara** desde mi app, que es un recurso sensible, así que hace falta permiso.
- [src/app/reporte/foto.tsx:44](../src/app/reporte/foto.tsx#L44): el comentario.
- [src/app/reporte/foto.tsx:50](../src/app/reporte/foto.tsx#L50) (preguntable → pantalla previa) y [:55](../src/app/reporte/foto.tsx#L55) (bloqueado → aviso).
- [src/app/reporte/foto.tsx:148](../src/app/reporte/foto.tsx#L148): `takePictureAsync`.

**Por qué `CameraView` y no `launchCameraAsync`:** lo verifiqué en el código de `expo-image-picker`. En Android, `launchCameraAsync` **pide el permiso por su cuenta** si falta (se saltearía la pantalla previa) y en Android 7–9 exige además `WRITE_EXTERNAL_STORAGE`, que bloqueé. `takePictureAsync` guarda en la caché de la app, sin permisos de almacenamiento.

### Ejemplo: "el permiso es del sistema, no de la librería"

Como `expo-image-picker` ya no usa la cámara, parecía lógico ponerle `cameraPermission: false`. Lo probé con `npx expo prebuild --clean`:

```xml
<uses-permission android:name="android.permission.CAMERA" tools:node="remove"/>
```

El plugin de image-picker **bloqueó `CAMERA` para toda la app**, y el escáner y la foto de `expo-camera` se quedaban sin cámara. En iOS, `false` también borra `NSCameraUsageDescription`, la misma clave que usa `expo-camera`.

**Conclusión:** el permiso lo tiene la **app**, ante el sistema. No lo tiene cada librería por separado. Si dos librerías usan la cámara, comparten el mismo permiso y la misma clave. Por eso el plugin de image-picker va **sin** esa opción ([app.json, bloque `expo-image-picker`](../app.json#L67)), y lo documenté en [docs/AUDITORIA_MANIFIESTO.md](AUDITORIA_MANIFIESTO.md).

---

## 4. ¿Qué cambia si la persona elige ubicación aproximada? ¿Y si la deniega?

**Aproximada:**
- `interpretar()` lo marca como **parcial** (`android.accuracy === 'coarse'` o `ios.accuracy === 'reduced'`): [src/lib/interpretar.ts:52](../src/lib/interpretar.ts#L52).
- La posición se guarda con `aproximada: parcial`: [src/app/reporte/ubicacion.tsx:41](../src/app/reporte/ubicacion.tsx#L41).
- Si es aproximada, **no se muestran coordenadas**, solo "Ubicación aproximada": [src/lib/etiquetas.ts:37](../src/lib/etiquetas.ts#L37). Si es precisa, coordenadas con 4 decimales ([:38](../src/lib/etiquetas.ts#L38)).
- La app sigue funcionando; además ofrece elegir el sector.

**Denegada o bloqueada:**
- No hay GPS, pero el **selector de sector** está siempre visible.
- El reporte se guarda con `{ tipo: 'sector', sector }`. `validarBorrador()` acepta aula **o** sector, así que el reporte se guarda igual.

**Siempre solo primer plano:** nunca se llama a `requestBackgroundPermissionsAsync` ([src/app/reporte/ubicacion.tsx:17](../src/app/reporte/ubicacion.tsx#L17)). En `app.json`, `isAndroidBackgroundLocationEnabled: false` y `ACCESS_BACKGROUND_LOCATION` en `blockedPermissions`.

---

## 5. ¿Por qué tus textos de propósito no aparecían en Expo Go?

**Expo Go es otra app, ya compilada, con su propio `Info.plist` y su propio manifiesto.** Mis textos están en `app.json` ([app.json:50](../app.json#L50) cámara, [app.json:58](../app.json#L58) ubicación) y se escriben en el `Info.plist` recién al compilar **mi** app (prebuild o EAS Build). En Expo Go:
- se ven los textos de Expo Go;
- los permisos que doy son **de Expo Go** (por eso los `adb` de prueba usan `host.exp.exponent`);
- `blockedPermissions` no tiene efecto.

En el código lo tengo en cuenta: `pasosAjustes()` dice "Expo Go" en el camino de Ajustes cuando corre ahí ([src/lib/permisos.ts:76](../src/lib/permisos.ts#L76)).

Para ver mis textos hace falta una **development build** (`eas build --profile development --platform android`). En Android igual no se ven en el diálogo: Android no muestra texto propio, solo iOS.

---

## 6. Si mañana agregás la nota de voz, ¿alcanza con una actualización OTA?

**No.** Una OTA (EAS Update) solo cambia el JavaScript y los assets. La nota de voz necesita cambios **nativos**:
- instalar `expo-audio` (código nativo nuevo);
- sacar `android.permission.RECORD_AUDIO` de `blockedPermissions` y que el manifiesto lo declare;
- agregar `NSMicrophoneUsageDescription` en el `Info.plist` (plugin de `expo-audio` con `microphonePermission`), y cambiar `microphonePermission: false` en los plugins de `expo-camera` / `expo-image-picker`.

El manifiesto y el `Info.plist` van dentro del binario instalado: **hace falta una build nueva** (y pasar por la tienda). Si mandara por OTA un JS que pide el micrófono, en Android se denegaría en el acto (no está declarado) y en iOS la app crashearía (falta el texto).

---

## Preguntas que también pueden salir

| Pregunta | Dónde |
|---|---|
| ¿Dónde se crea el canal "reportes" y por qué antes de pedir? | [src/lib/permisos.ts:61](../src/lib/permisos.ts#L61) (`crearCanalReportes()` antes de `requestPermissionsAsync`) y [:33](../src/lib/permisos.ts#L33) |
| ¿Cómo aparece el aviso si las notificaciones están denegadas? | `setTimeout` siempre en `programarResolucion`: [src/lib/almacen.tsx:189](../src/lib/almacen.tsx#L189). La notificación es un extra: [src/app/reporte/[id].tsx:56](../src/app/reporte/[id].tsx#L56) |
| ¿Por qué el estado provisional de iOS no se ve como "concedido" mirando `granted`? | [src/lib/interpretar.ts:35](../src/lib/interpretar.ts#L35): en SDK 57, provisional devuelve `granted: false`; hay que mirar `ios.status` |
| ¿Cómo evitás que un link externo te mande a cualquier pantalla después del permiso? | Lista cerrada de destinos: [src/lib/navegacion.ts:9](../src/lib/navegacion.ts#L9) |
| ¿Por qué el escáner usa `useCameraPermissions` y no `usePermiso`? | Lo pide la consigna; comentario en [src/app/reporte/escanear.tsx:17](../src/app/reporte/escanear.tsx#L17) |
| ¿Qué pasa si concede desde la pantalla previa? | `router.dismissTo(siguiente)`: [src/app/permisos/[recurso].tsx:48](../src/app/permisos/[recurso].tsx#L48). Si no concede, `router.back()` ([:50](../src/app/permisos/[recurso].tsx#L50)) y la pantalla de origen muestra la alternativa |
