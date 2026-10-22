# Guía para la defensa oral (G6)

Cada pregunta con el archivo y la línea que la responde. Las líneas corresponden al commit de la Fase 7; si cambia el código, buscá el texto citado.

---

## 1. ¿Qué código decide entre "Continuar" y "Abrir Ajustes"? ¿Qué campo lo decide?

**El campo es `canAskAgain`.** Con `granted: false`:
- si `canAskAgain` es `true`, el diálogo todavía puede aparecer → **"Continuar"**;
- si es `false`, `request…()` ya no muestra nada → **"Abrir Ajustes"**.

| Dónde | Qué mostrar |
|---|---|
| [src/lib/interpretar.ts:63](../src/lib/interpretar.ts#L63) | `if (respuesta.canAskAgain) return { estado: 'preguntable' … }` |
| [src/lib/interpretar.ts:68](../src/lib/interpretar.ts#L68) | si no → `{ estado: 'bloqueado' }` |
| [src/components/PantallaPrevia.tsx:27](../src/components/PantallaPrevia.tsx#L27) | `bloqueado` → `<AvisoBloqueado>` |
| [src/components/PantallaPrevia.tsx:64](../src/components/PantallaPrevia.tsx#L64) | `preguntable` → botón "Continuar" |
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
| [src/hooks/usePermiso.ts:53](../src/hooks/usePermiso.ts#L53) | al montar (incluido el arranque después de que Android mató el proceso), solo **consulta** |
| [src/hooks/usePermiso.ts:68](../src/hooks/usePermiso.ts#L68) | `useRevisarAlVolver(consultar)`: si el proceso no murió (por ejemplo, al **habilitar** en Ajustes), se entera al volver al primer plano |
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
- `interpretar()` lo marca como **parcial** (`android.accuracy === 'coarse'` o `ios.accuracy === 'reduced'`): [src/lib/interpretar.ts:54](../src/lib/interpretar.ts#L54).
- La posición se guarda con `aproximada: parcial`: [src/app/reporte/ubicacion.tsx:41](../src/app/reporte/ubicacion.tsx#L41).
- Si es aproximada, **no se muestran coordenadas**, solo "Ubicación aproximada": [src/lib/etiquetas.ts:42](../src/lib/etiquetas.ts#L42). Si es precisa, coordenadas con 4 decimales ([:43](../src/lib/etiquetas.ts#L43)).
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

En el código lo tengo en cuenta: `pasosAjustes()` dice "Expo Go" en el camino de Ajustes cuando corre ahí ([src/lib/permisos.ts:67](../src/lib/permisos.ts#L67)).

Para ver mis textos hace falta una **development build** (`eas build --profile development --platform android`). En Android igual no se ven en el diálogo: Android no muestra texto propio, solo iOS.

### Ejemplo: "la app nunca se bloquea", ni cuando falta un módulo nativo

En Expo Go Android (SDK 57) la app no arrancaba: `Cannot find native module 'ExpoTopicSubscriptionModule'`. El binario de Expo Go ya no trae los módulos nativos de `expo-notifications`, y como `_layout.tsx` lo importaba arriba de todo, el error al evaluar el archivo tumbaba el layout y Expo Router veía las rutas "sin default export".

**Arreglo:** un solo archivo usa `expo-notifications` y lo carga de forma perezosa:
- [src/lib/notificaciones.ts:17](../src/lib/notificaciones.ts#L17): en Expo Go Android **ni se intenta**: `isRunningInExpoGo()` → `null`. Se sabe que va a fallar, y el paquete además tira un `console.error` que en desarrollo abre la pantalla roja.
- [:21](../src/lib/notificaciones.ts#L21): en el resto, `require()` dentro de `try/catch` (un `import` arriba de todo falla antes de que se pueda atrapar).
- [src/hooks/usePermiso.ts:71](../src/hooks/usePermiso.ts#L71): sin módulo, el estado es `no_disponible` (si no, quedaría "Consultando…" para siempre). `/permisos` lo muestra así y el interruptor de `/ajustes-app` queda apagado y explica que funciona en la development build.

**Lo que sigue andando:** "Simular resolución" programa **siempre** el `setTimeout` ([src/lib/almacen.tsx:189](../src/lib/almacen.tsx#L189)), así que el reporte pasa a "Resuelto" y el aviso aparece en `/avisos`. La notificación del sistema es un extra ([src/app/reporte/[id].tsx:55](../src/app/reporte/[id].tsx#L55)): sin módulo, simplemente no se manda. Es la misma regla que con un permiso denegado: ninguna función depende de que algo nativo esté.

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
| ¿Dónde se crea el canal "reportes" y por qué antes de pedir? | [src/lib/notificaciones.ts:59](../src/lib/notificaciones.ts#L59) (`setNotificationChannelAsync` dentro de `pedirPermisoNotificaciones()`, antes de `requestPermissionsAsync` en [:65](../src/lib/notificaciones.ts#L65)) |
| ¿Cómo aparece el aviso si las notificaciones están denegadas? | `setTimeout` siempre en `programarResolucion`: [src/lib/almacen.tsx:189](../src/lib/almacen.tsx#L189). La notificación es un extra: [src/app/reporte/[id].tsx:55](../src/app/reporte/[id].tsx#L55) |
| ¿Por qué el estado provisional de iOS no se ve como "concedido" mirando `granted`? | [src/lib/interpretar.ts:37](../src/lib/interpretar.ts#L37): en SDK 57, provisional devuelve `granted: false`; hay que mirar `ios.status` |
| ¿Cómo evitás que un link externo te mande a cualquier pantalla después del permiso? | Lista cerrada de destinos: [src/lib/navegacion.ts:9](../src/lib/navegacion.ts#L9) |
| ¿Por qué el escáner usa `useCameraPermissions` y no `usePermiso`? | Lo pide la consigna; comentario en [src/app/reporte/escanear.tsx:17](../src/app/reporte/escanear.tsx#L17) |
| ¿Qué pasa si concede desde la pantalla previa? | `router.dismissTo(siguiente)`: [src/app/permisos/[recurso].tsx:48](../src/app/permisos/[recurso].tsx#L48). Si no concede, `router.back()` ([:50](../src/app/permisos/[recurso].tsx#L50)) y la pantalla de origen muestra la alternativa |
