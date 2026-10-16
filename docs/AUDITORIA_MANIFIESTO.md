# Auditoría de permisos generados

Generado con `npx expo prebuild --clean` (Expo SDK 57). La carpeta `android/` no se sube a git (CNG: se regenera desde `app.json`).

## Android — `android/app/src/main/AndroidManifest.xml`

| Permiso | Quién lo agrega | ¿Queda? |
|---|---|---|
| `CAMERA` | plugin `expo-camera` (y el manifiesto de la librería `expo-image-picker`) | Sí: escáner QR y "Sacar foto" (ambos con `CameraView` de `expo-camera`) |
| `ACCESS_COARSE_LOCATION` | plugin `expo-location` | Sí: ubicación en primer plano |
| `ACCESS_FINE_LOCATION` | plugin `expo-location` | Sí: la persona puede elegir "aproximada" igual |
| `INTERNET` | plantilla de prebuild | Sí: servidor de desarrollo (normal, se concede solo) |
| `VIBRATE` | plantilla de prebuild | Sí: normal, se concede solo |
| `RECORD_AUDIO` | `expo-camera` / `expo-image-picker` si no se desactiva | **Quitado** (`tools:node="remove"`) |
| `ACCESS_BACKGROUND_LOCATION` | `expo-location` si `isAndroidBackgroundLocationEnabled` | **Quitado** |
| `READ_EXTERNAL_STORAGE` (maxSdk 32) | plantilla, `expo-image-picker`, `expo-file-system` | **Quitado** |
| `WRITE_EXTERNAL_STORAGE` (maxSdk 32) | plantilla, `expo-image-picker`, `expo-file-system` | **Quitado** |
| `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` / `READ_MEDIA_VISUAL_USER_SELECTED` | ninguno hoy; bloqueados por si una librería los suma | **Quitados** |
| `SYSTEM_ALERT_WINDOW` | plantilla de prebuild (lo usa el menú de desarrollo) | **Quitado** |

Se suman recién al compilar (fusión de manifiestos de Gradle), desde el manifiesto de `expo-notifications`:

| Permiso | Quién | ¿Queda? |
|---|---|---|
| `POST_NOTIFICATIONS` | `expo-notifications` | Sí: se pide en tiempo de ejecución (Android 13+) |
| `RECEIVE_BOOT_COMPLETED` | `expo-notifications` | Sí: reprograma notificaciones al reiniciar (normal) |

> ⚠️ verificar: confirmar la lista final en el manifiesto fusionado de la development build
> (`android/app/build/intermediates/merged_manifests/debug/.../AndroidManifest.xml`).

## iOS — claves del `Info.plist`

Obtenidas con `npx expo config --type introspect` (en Windows no se puede generar `ios/`).

| Clave | Valor / origen |
|---|---|
| `NSCameraUsageDescription` | "Usamos tu cámara para leer el QR de la puerta del aula y sacar fotos del desperfecto que reportás." La define solo `expo-camera`. `expo-image-picker` ya no usa la cámara y su plugin va **sin** `cameraPermission`: sin la opción conserva el texto existente (ver nota abajo) |
| `NSLocationWhenInUseUsageDescription` | "Usamos tu ubicación para marcar en qué parte del edificio está el problema que reportás." |
| `NSLocalNetworkUsageDescription` | Lo agrega `expo-dev-client` para encontrar el servidor de desarrollo |
| `NSMicrophoneUsageDescription` | **Eliminada** (`microphonePermission: false`) |
| `NSPhotoLibraryUsageDescription` | **Eliminada** (`photosPermission: false`): el selector del sistema no la necesita |
| `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription` | **Eliminadas** (`false`); sin eso `expo-location` las agrega con un texto por defecto |
| `NSMotionUsageDescription` | **Eliminada** (`motionUsagePermission: false`); mismo motivo |
| `UIBackgroundModes: location` | No se agrega (`isIosBackgroundLocationEnabled: false`) |

## Nota: por qué `expo-image-picker` no lleva `cameraPermission: false`

"Sacar foto" usa `CameraView` + `takePictureAsync` de `expo-camera`, así que `expo-image-picker` solo abre el selector de la galería. Parecería lógico poner `cameraPermission: false` en su plugin, pero lo probamos con `npx expo prebuild --clean` y:

- en Android el plugin agrega `CAMERA` a los permisos bloqueados (`<uses-permission android:name="android.permission.CAMERA" tools:node="remove"/>`), lo que deja sin cámara también a `expo-camera` (escáner y foto);
- en iOS la opción `false` hace que el plugin borre `NSCameraUsageDescription`, la misma clave que necesita `expo-camera`. En nuestra prueba la clave sobrevivió solo porque `expo-camera` la vuelve a escribir después: depende del orden en que corren los plugins, así que es frágil.

Un permiso es del sistema, no de la librería: si dos librerías usan la cámara, comparten el mismo permiso. Por eso la opción se omite: sin ella, el plugin no bloquea nada y conserva el texto que ya escribió `expo-camera` (`permissions[clave] || infoPlist[clave] || textoPorDefecto` en `@expo/config-plugins`).

Ventaja de no usar `launchCameraAsync`: en Android ese método pide el permiso por su cuenta si falta (salteando la pantalla previa) y en Android 7–9 exige además `WRITE_EXTERNAL_STORAGE`, que está bloqueado. `takePictureAsync` guarda la foto en la caché de la app, sin permisos de almacenamiento.
