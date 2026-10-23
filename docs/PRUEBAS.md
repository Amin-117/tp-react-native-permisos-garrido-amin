# Pruebas — Mantenimiento IPF

## 1. Chequeos automáticos

| Chequeo                                        | Comando                                                                 | Resultado (22/10/2026)                                                                                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipos                                          | `npm run typecheck`                                                     | ✅ sin errores                                                                                                                                                                                          |
| Lint                                           | `npm run lint`                                                          | ✅ sin errores                                                                                                                                                                                          |
| Expo Doctor                                    | `npm run doctor`                                                        | ⚠️ 18/21: las otras 3 no llegan a correr (`npm explain` falla en esta PC con expo-doctor 1.21.5 y npm 10.9.2); ninguna reporta un problema del proyecto                                                                                                                                                                                |
| `interpretar()` y lector de QR                 | `npm test`                                                              | ✅ 11/11 y 9/9 (Node 22.16)                                                                                                                                                                                |
| Sin `expo-permissions`                         | buscar `expo-permissions` en `src` y `package.json`                     | ✅ no aparece                                                                                                                                                                                           |
| Ningún `request…()` en un render o `useEffect` | buscar `request.*PermissionsAsync`, `pedir(` y `pedirPermiso(` en `src` | ✅ solo en `continuar()` de `src/app/permisos/[recurso].tsx` y `src/app/reporte/escanear.tsx`, que se llaman desde el botón "Continuar"                                                                 |
| Manifiesto                                     | `npm run prebuild` y revisar `android/app/src/main/AndroidManifest.xml` | ✅ `RECORD_AUDIO`, `READ_MEDIA_IMAGES`, `ACCESS_BACKGROUND_LOCATION` y `SYSTEM_ALERT_WINDOW` aparecen solo con `tools:node="remove"`                                                                    |
| Info.plist                                     | `npx expo config --type introspect`                                     | ✅ solo `NSCameraUsageDescription` y `NSLocationWhenInUseUsageDescription` con nuestro texto, más `NSLocalNetworkUsageDescription` (dev client). Sin micrófono, fotos, "Siempre" ni `UIBackgroundModes` |

El detalle de cada permiso está en [AUDITORIA_MANIFIESTO.md](AUDITORIA_MANIFIESTO.md). Después del prebuild se puede borrar `android/` (está en `.gitignore` y se regenera).

## 2. Dónde probar qué

|                                                     | Expo Go (`npm run start:go`)                                                          | Development build (`npm start`)          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| Lógica de estados, pantallas previas, alternativas  | ✅                                                                                    | ✅                                       |
| Bandeja de avisos (`/avisos`)                       | ✅                                                                                    | ✅                                       |
| Notificación local (permiso, canal, banner)         | ❌ Android: figura "No disponible en este entorno" (Expo Go no trae el módulo nativo) | ✅                                       |
| **Nuestro texto de propósito** en el diálogo de iOS | ❌ (se ve el de Expo Go)                                                              | ✅                                       |
| `blockedPermissions` y el manifiesto real           | ❌ (es el manifiesto de Expo Go)                                                      | ✅                                       |
| Los permisos son de…                                | Expo Go (`host.exp.exponent`)                                                         | nuestra app (`ar.edu.ipf.mantenimiento`) |

## 3. Cómo poner cada permiso en el estado que quiero

En los comandos, `<paquete>` es `host.exp.exponent` (Expo Go) o `ar.edu.ipf.mantenimiento` (development build).

**Android**

| Quiero…                          | Cómo                                                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sin decidir (`undetermined`)     | `adb shell pm revoke <paquete> android.permission.CAMERA` y después `adb shell pm clear-permission-flags <paquete> android.permission.CAMERA user-set user-fixed` |
| Denegado con `canAskAgain: true` | Desde "sin decidir": "Continuar" y en el diálogo "No permitir" **una vez**                                                                                        |
| Bloqueado (`canAskAgain: false`) | "No permitir" **dos veces** (Android 11+), o "No permitir" desde Ajustes                                                                                          |
| Ubicación aproximada             | En el diálogo, elegir "Aproximada", o en Ajustes › Ubicación desactivar "Usar ubicación precisa"                                                                  |

Permisos para los otros recursos: `android.permission.ACCESS_FINE_LOCATION` y `android.permission.ACCESS_COARSE_LOCATION` (revocar los dos), y `android.permission.POST_NOTIFICATIONS` (Android 13+).

**iOS (simulador)**: `xcrun simctl privacy booted reset camera <bundleId>` (también `location`, `notifications`). En iOS un solo "No permitir" deja el permiso bloqueado.

## 4. Pruebas manuales por función

Marcar ✅ / ❌ y anotar el dispositivo y la versión de Android/iOS.

### 4.1 Arranque

- [✅ ] La app abre sin mostrar **ningún** diálogo de permisos.
- [✅ ] Inicio vacío muestra "Todavía no hiciste reportes".

### 4.2 Escáner (`/reporte/escanear`)

| Estado              | Qué hacer                        | Esperado                                                             | ✅/❌ |
| ------------------- | -------------------------------- | -------------------------------------------------------------------- | ----- |
| Cargando            | Entrar                           | Indicador de carga un instante                                       | ✅    |
| Concedido           | Escanear un QR `IPF-AULA:B12`    | Vuelve al formulario con "B12" en Aula                               | ✅    |
| Concedido           | Escanear un QR con una URL       | "Ese QR no es el de un aula" + "Volver a intentar"                   | ✅    |
| Preguntable         | Entrar con la cámara sin decidir | Pantalla previa con un solo botón "Continuar" + campo "a mano" abajo | ✅    |
| Bloqueado           | Entrar con la cámara bloqueada   | Pasos en Ajustes + "Abrir Ajustes" + campo "a mano"                  | ✅    |
| Bloqueado → Ajustes | Habilitar en Ajustes y volver    | Pasa sola a la cámara (`useRevisarAlVolver`)                         | ✅    |

### 4.3 Foto (`/reporte/foto`)

- [ ✅] "Elegir de la galería" con la cámara en **cualquier** estado: no aparece ningún diálogo de permiso.
- [✅ ] "Sacar foto" concedido: abre `CameraView`, saca la foto y vuelve con vista previa.
- [✅ ] "Sacar foto" sin decidir: modal → permitir → vuelve a **una sola** pantalla de Foto.
- [✅ ] "Sacar foto" bloqueado: aviso + "La galería sigue disponible".

### 4.4 Ubicación (`/reporte/ubicacion`)

- [ ✅] Precisa: muestra coordenadas con 4 decimales.
- [✅ ] Aproximada: muestra "Ubicación aproximada" **sin** números.
- [✅ ] GPS apagado: error + "Reintentar".
- [✅ ] Bloqueado o denegado: elegir un sector y que el formulario muestre "Sector: …".
- [✅ ] En ningún momento aparece un pedido de ubicación "Siempre" / en segundo plano.

### 4.5 Guardar sin permisos

- [✅ ] Con cámara, ubicación y notificaciones denegadas: crear un reporte con aula a mano, foto de galería y sector. Se guarda y aparece en Inicio.
- [✅ ] Cerrar y reabrir la app: el reporte sigue ahí.

### 4.6 Notificaciones y avisos FUNCIONA TODO✅✅✅

Las notificaciones se prueban **solo en la development build** (`npm start`). En Expo Go Android, solo las tres primeras filas:

| Caso                                                             | Esperado                                                                                                                        | ✅/❌ |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Expo Go Android: abrir la app                                    | Arranca sin el error de `ExpoTopicSubscriptionModule`                                                                           |       |
| Expo Go Android: `/permisos` y `/ajustes-app`                    | Notificaciones "No disponible en este entorno"; interruptor apagado y deshabilitado, con la explicación de la development build |       |
| Expo Go Android: Simular resolución                              | Sin notificación; a los 10 s "Resuelto" + aviso en `/avisos`                                                                    |       |
| Interruptor, sin decidir → Permitir                              | Queda encendido                                                                                                                 |       |
| Interruptor, sin decidir → No permitir o cerrar el modal         | Apagado + "Igual vas a ver los avisos en la pestaña Avisos"                                                                     |       |
| Interruptor, bloqueado                                           | Queda apagado + pasos de Ajustes                                                                                                |       |
| Apagar el interruptor                                            | La pestaña Permisos sigue mostrando "Concedido"                                                                                 |       |
| Simular resolución con el interruptor encendido y la app abierta | Banner a los ~10 s, estado "Resuelto", aviso en la bandeja                                                                      |       |
| Ídem con la app en segundo plano y tocar la notificación         | Abre el detalle del reporte                                                                                                     |       |
| Simular resolución sin permiso                                   | Sin notificación; a los 10 s "Resuelto" + aviso en la bandeja                                                                   |       |
| Simular y cerrar la app antes de los 10 s                        | Al reabrir: "Resuelto" + aviso                                                                                                  |       |
| `…/--/reporte/abc`                                               | "No encontramos ese reporte"                                                                                                    |       |

### 4.7 Panel `/permisos` y volver de Ajustes

- [✅ ] Cada fila muestra estado, `Platform.OS` y `status` / `canAskAgain`; con ubicación aproximada, `accuracy: coarse` (Android) o `reduced` (iOS).
- [✅] "Pedir" aparece en estado preguntable (también `denied` con `canAskAgain: true`) y abre la pantalla previa.
- [✅ ] **Revocar la cámara desde Ajustes con la app abierta** y volver: Android mata el proceso de la app; al volver la app arranca de nuevo y el panel muestra el estado correcto. Sacar captura **antes y después**.

## 5. Versiones viejas de Android: no probado (sin dispositivo)

No hubo un dispositivo ni un emulador con Android 7 a 12, así que **ninguno de estos casos se probó**. Quedan como lo que habría que verificar.

### Android 7 a 9 (API 24–28)

- [ ] **No probado (sin dispositivo).** **"Sacar foto"**: funciona. Usa `CameraView` + `takePictureAsync` y guarda en la caché de la app, así que no necesita `WRITE_EXTERNAL_STORAGE` (bloqueado). Con `launchCameraAsync` habría fallado.
- [ ] **No probado (sin dispositivo).** **"Elegir de la galería"** funciona sin `READ_EXTERNAL_STORAGE` (bloqueado). Es lo más riesgoso de esta lista: anotar qué selector aparece.
- [ ] **No probado (sin dispositivo).** **Bloqueo**: en Android 6–10 el segundo diálogo tiene la casilla "No volver a preguntar". Marcarla debe llevar a "bloqueado" (`canAskAgain: false`).
- [ ] **No probado (sin dispositivo).** No existe la ubicación aproximada como opción del diálogo (aparece en Android 12).

### Android 10 a 12 (API 29–32)

- [ ] **No probado (sin dispositivo).** **Notificaciones**: antes de Android 13 no hay permiso en tiempo de ejecución. La fila Notificaciones debe decir "Concedido" sin haber visto ningún diálogo, y el interruptor se enciende directo.
- [ ] **No probado (sin dispositivo).** El canal "reportes" aparece en Ajustes › Apps › Mantenimiento IPF › Notificaciones después de activar el interruptor.
- [ ] **No probado (sin dispositivo).** **Galería sin `READ_EXTERNAL_STORAGE`**: el selector abre y devuelve la foto (en Android 11–12 puede ser el Photo Picker vía Google Play o el selector de documentos).
- [ ] **No probado (sin dispositivo).** **"Solo esta vez"** (Android 11+): conceder la cámara con "Solo esta vez", mandar la app a segundo plano un rato y volver. El permiso vuelve a "preguntable" y la app lo muestra bien.
- [ ] **No probado (sin dispositivo).** Android 12: el diálogo de ubicación ofrece "Precisa / Aproximada".

## 6. Development build en Android desde Windows

En esta PC no hay Java, Android SDK ni `adb`. El camino más simple es **EAS Build en la nube**, que no requiere instalar nada de Android:

1. Crear una cuenta gratis en expo.dev.
2. `npm install -g eas-cli` y `eas login`.
3. `eas build:configure` (crea `eas.json`; el perfil `development` ya viene con `developmentClient: true` y `distribution: internal`).
4. `eas build --profile development --platform android`. Compila en los servidores de Expo y al final muestra un QR o link para instalar el APK en el celular. En el plan gratuito puede quedar unos minutos en cola.
5. Con la app instalada: `npm start` en la PC y abrir el proyecto desde la app (no desde Expo Go).

**Red del instituto**: sin túnel (`--tunnel` usa ngrok, que está bloqueado), el celular y la PC tienen que estar en la misma red y verse entre sí. Si la Wi-Fi aísla los dispositivos, usar el hotspot del celular, o conectarlo por USB con `adb reverse tcp:8081 tcp:8081` (solo hace falta instalar "SDK Platform-Tools", sin Android Studio).

La build solo se rehace al cambiar algo nativo (`app.json`, plugins, paquetes nativos). Los cambios de JS se ven al instante.

## 7. Capturas para el README

- [ ] Escáner en sus 4 estados (cargando, cámara, pantalla previa, bloqueado)
- [ ] Ubicación concedida (precisa o aproximada) y denegada (selector de sector)
- [ ] Foto elegida desde el selector del sistema
- [ ] Notificación recibida
- [ ] Panel `/permisos` antes y después de volver de Ajustes
- [ ] **Diálogo del sistema con nuestro texto de propósito** (solo en development build; en iOS es donde se ve el texto)
