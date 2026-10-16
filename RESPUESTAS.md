# Respuestas — Partes A a F

> **Borrador para revisar y reescribir con mis palabras.**
> Las respuestas salen de la presentación de clase ([docs/permisos_moviles.md](docs/permisos_moviles.md)) y de lo que comprobé en el código de Expo SDK 57 instalado en `node_modules`.
> Lo marcado con **⚠️ verificar** no está en la presentación ni en el código: lo busqué en la documentación oficial (fuentes al final) y conviene confirmarlo antes de entregar.

---

## Parte A. ¿Qué es un permiso y por qué existe?

### A1. Conceptos

**a)** Un permiso es la autorización que la persona le da a una app para usar un recurso sensible del teléfono: cámara, micrófono, ubicación, fotos, contactos o notificaciones.
- **La app** declara qué podría usar y pide acceso en el momento justo.
- **El sistema operativo** muestra el diálogo oficial, guarda la decisión y la hace cumplir.
- **La persona** acepta, rechaza o da acceso parcial, y puede cambiar de idea en Ajustes.

**b)** La caja de arena (sandbox) es el espacio aislado donde vive cada app: solo ve sus propios archivos. Para salir de la caja y tocar algo sensible necesita una "llave", que es el permiso, y esa llave solo la da la persona. Sin ningún permiso una app puede mostrar pantallas, guardar sus propios datos y conectarse a internet.

**c)**
| Razón | Ejemplo |
|---|---|
| Privacidad | Mis fotos o mi ubicación no salen del teléfono sin que yo acepte |
| Seguridad | Si se instala una app maliciosa, solo puede dañar lo que se le permitió |
| Transparencia | El punto verde/naranja que muestra que la cámara o el micrófono están en uso |
| Control | Puedo revocar la ubicación de una app desde Ajustes cuando quiera |

**d)** La **visita** es la app, el **portero** es el sistema operativo y el **dueño** del departamento es la persona usuaria. Que "el portero se acuerda de la respuesta" significa que el sistema guarda la decisión: no vuelve a preguntar cada vez, y si la persona dijo que no (en iOS una vez, en Android dos) ya no deja ni preguntar. Solo se cambia desde Ajustes.

### A2. Declarar y solicitar

| | Declarar (al compilar) | Solicitar (al ejecutar) |
|---|---|---|
| **¿Qué se hace?** | Avisar al sistema qué recursos podría usar la app. Queda dentro del paquete instalado | Cuando la persona usa la función, el código pide acceso y el sistema muestra el diálogo |
| **Android / iOS** | Android: `<uses-permission>` en `AndroidManifest.xml`. iOS: texto de propósito en `Info.plist` | Android: solo para permisos de tiempo de ejecución. iOS: para cada recurso protegido |
| **Expo** | En `app.json`: los plugins de cada módulo (y `android.permissions` / `android.blockedPermissions`). Los archivos nativos se generan en el prebuild | `request…PermissionsAsync()` o el hook del módulo (por ejemplo `useCameraPermissions`) |
| **¿Qué pasa si se omite?** | Android deniega en el acto, sin diálogo. iOS: la app crashea al acceder y App Store rechaza la build | No tengo el permiso: la función no anda (salvo los permisos normales de Android, que se conceden al instalar) |

### A3. Verdadero o falso

- **a) F.** El diálogo lo dibuja el sistema operativo, no mi app. Yo elijo cuándo pedirlo y qué hacer con la respuesta.
- **b) V.**
- **c) F.** Los cambios en `Info.plist` (o en el manifiesto) son nativos y no viajan por OTA: hace falta una build nueva.
- **d) F.** Si el permiso no está en el manifiesto, Android lo deniega en el acto, sin mostrar diálogo.
- **e) F.** `expo-permissions` es viejo. En SDK 57 cada módulo trae sus propias funciones y hooks (por ejemplo `Location.requestForegroundPermissionsAsync`, `useCameraPermissions`).
- **f) V.** Las notificaciones de iOS no llevan texto de propósito: se piden directo con `requestPermissionsAsync`.
- **g) V.** `status` vale `'granted'` y el matiz está en `accessPrivileges: 'limited'`.
- **h) F.** Reinstalar borra también los datos de la app y es lento. Lo confiable es resetear el permiso: en Android con `adb shell pm revoke` + `pm clear-permission-flags … user-set user-fixed`, y en el simulador de iOS con `xcrun simctl privacy booted reset <servicio> <bundleId>`.

### A4. Los estados de un permiso

**a)**
```
Android 11+:  sin decidir ──"No permitir"──▶ denegado ──"No permitir"──▶ bloqueado
                    │                          │
                    └──"Permitir"──▶ concedido ◀┘          (bloqueado → solo Ajustes)

iOS:          sin decidir ──"No permitir"──▶ bloqueado   (solo Ajustes)
                    └──"Permitir"──▶ concedido
```
La diferencia central es que **Android da dos oportunidades e iOS una sola**. En las dos plataformas, desde Ajustes se puede pasar a concedido (o revocar) en cualquier momento.

**b)**
| Estado | `status` | `canAskAgain` | ¿Puede aparecer el diálogo? |
|---|---|---|---|
| Sin decidir | `undetermined` | `true` | Sí |
| Concedido | `granted` | `true` | No hace falta |
| Denegado (se puede volver a pedir) | `denied` | `true` | Sí (solo Android) |
| Bloqueado | `denied` | `false` | No: hay que ir a Ajustes |

---

## Parte B. Android: tipos de permisos y manifiesto

### B1. Clasificá los permisos

| Permiso | Tipo | ¿Cómo se obtiene? |
|---|---|---|
| `INTERNET` | De instalación (normal) | Solo, al instalar |
| `CAMERA` | Tiempo de ejecución | Diálogo, al usar la función |
| `VIBRATE` | De instalación | Solo, al instalar |
| `SYSTEM_ALERT_WINDOW` | Especial | La persona lo activa a mano en Ajustes |
| `POST_NOTIFICATIONS` | Tiempo de ejecución (Android 13+) | Diálogo |
| `ACCESS_NETWORK_STATE` | De instalación | Solo, al instalar |
| `READ_CONTACTS` | Tiempo de ejecución | Diálogo |
| `SCHEDULE_EXACT_ALARM` | Especial | En Ajustes ("Alarmas y recordatorios") |
| `RECORD_AUDIO` | Tiempo de ejecución | Diálogo |
| `MANAGE_EXTERNAL_STORAGE` | Especial | En Ajustes ("Acceso a todos los archivos") |

### B2. Grupos y nombres

**a)** Un grupo junta permisos parecidos para que la persona vea una sola pregunta en lenguaje simple ("Ubicación") en vez de nombres técnicos. Si pido `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION` juntos, la persona ve **un solo diálogo**.

**b)** El prefijo es `android.permission.`. El de cámara es `android.permission.CAMERA`.

**c)** Los de firma (signature) solo se conceden a apps firmadas con el mismo certificado que la app o el sistema que los define. Una app común no tiene esa firma, por eso no se usan.

### B3. Leé el manifiesto

**a)** `INTERNET` se concede solo al instalar. `CAMERA`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS` y `READ_EXTERNAL_STORAGE` (hasta Android 12) hay que pedirlos además en tiempo de ejecución. `RECORD_AUDIO` está quitado.

**b)** `maxSdkVersion="32"` significa que el permiso solo se declara hasta Android 12L (API 32). Desde Android 13 lo reemplazan los permisos por tipo de archivo: `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` y `READ_MEDIA_AUDIO`.

**c)** `tools:node="remove"` saca ese permiso del manifiesto final cuando se fusionan los manifiestos de todas las librerías. Así no entra aunque una librería lo declare. Lo genera:
```json
{ "expo": { "android": { "blockedPermissions": ["android.permission.RECORD_AUDIO"] } } }
```

**d)** En `expo.android.permissions`:
```json
{ "expo": { "android": { "permissions": ["android.permission.SCHEDULE_EXACT_ALARM"] } } }
```

**e)** Porque en Expo los archivos nativos se regeneran en cada `npx expo prebuild` (CNG): lo que edite a mano se pierde. La fuente de verdad es `app.json`. **`blockedPermissions` no funciona en Expo Go**, porque Expo Go es una app ya compilada con su propio manifiesto.

### B4. Así pregunta Android

**a)** No. El texto del diálogo lo arma el sistema. Lo que hago es explicar el beneficio en mi propia pantalla **antes** de pedir (la pantalla previa).

**b)** "Mientras la app está en uso" se mantiene, pero solo vale con la app en primer plano. "Solo esta vez" se revoca poco después de salir de la app. Existe para ubicación, cámara y micrófono (Android 11+).

**c)** Queda bloqueado: el sistema ya no muestra el diálogo y `canAskAgain` pasa a `false`.

**d)** Anda bien: "puntos de reciclaje de tu barrio" o el clima de tu ciudad. No anda: navegación giro a giro, o en mi app saber en qué pasillo del instituto está el problema. Por eso, con ubicación aproximada mi app muestra "Ubicación aproximada" y ofrece elegir el sector.

**e)** Android mata el proceso de la app. Al volver, la app arranca de nuevo, y por eso hay que consultar el estado y no confiar en algo guardado.

### B5. Android, versión por versión

| Cambio | Versión (API) | Qué implica para el código |
|---|---|---|
| Nacen los permisos en tiempo de ejecución | Android 6.0 (API 23) | Hay que pedir con `request…()` y manejar el rechazo |
| La ubicación en segundo plano pasa a ser un permiso aparte | Android 10 (API 29) | Pedir primero la de primer plano y, solo si hace falta, después `requestBackgroundPermissionsAsync` |
| Dos rechazos equivalen a "no volver a preguntar" | Android 11 (API 30) | Mirar `canAskAgain`; si es `false`, mandar a Ajustes |
| Ubicación precisa o aproximada | Android 12 (API 31) | Leer `android.accuracy` (`'fine'`/`'coarse'`) y funcionar con las dos |
| Notificaciones como permiso (`POST_NOTIFICATIONS`) | Android 13 (API 33) | Crear el canal y pedir el permiso en contexto |
| Acceso parcial a fotos ("Seleccionar fotos") | Android 14 (API 34) | Leer `accessPrivileges: 'limited'`, o mejor usar el selector del sistema |
| Permiso de red local (`ACCESS_LOCAL_NETWORK`) | Android 17 (API 37) ⚠️ verificar | Para apps que apunten a API 37+, descubrir o conectarse a dispositivos de la red local pide permiso (grupo "Dispositivos cercanos") |

**Pregunta adicional.** El `targetSdkVersion` es la versión de Android para la que la app declara estar preparada: el sistema le aplica los cambios de comportamiento de esa versión.
- **Expo SDK 57** apunta a **API 36 (Android 16)**: lo vi en `node_modules/react-native/gradle/libs.versions.toml` (`targetSdk = "36"`, `minSdk = "24"`). ⚠️ verificar en el changelog de SDK 57.
- **Google Play**, desde el **31 de agosto de 2026**, exige que las apps nuevas y las actualizaciones (teléfonos y tablets) apunten a **Android 16 (API 36) o superior**. ⚠️ verificar ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/11926878)).

---

## Parte C. iOS: textos de propósito y acceso parcial

### C1. Claves del Info.plist

| Recurso | Clave |
|---|---|
| Cámara | `NSCameraUsageDescription` |
| Micrófono | `NSMicrophoneUsageDescription` |
| Ubicación en uso | `NSLocationWhenInUseUsageDescription` |
| Ubicación siempre | `NSLocationAlwaysAndWhenInUseUsageDescription` |
| Fotos (leer) | `NSPhotoLibraryUsageDescription` |
| Fotos (solo guardar) | `NSPhotoLibraryAddUsageDescription` |
| Contactos | `NSContactsUsageDescription` ⚠️ verificar |
| Face ID | `NSFaceIDUsageDescription` ⚠️ verificar |
| Rastreo entre apps (ATT) | `NSUserTrackingUsageDescription` |
| Notificaciones | No lleva clave |

### C2. Sin texto, no hay permiso

**a)** La app crashea al intentar usar la cámara ("This app has crashed because it attempted to access privacy-sensitive data without a usage description"). Al subir la build, App Store Connect la rechaza con **`ITMS-90683`** (falta el texto de propósito).

**b)** Una sola vez. Si dice que no, queda bloqueado: a la app solo le queda ofrecer una alternativa y un botón "Abrir Ajustes".

**c)** El sistema arma el título ("¿Permitir que [App] use tu ubicación?") y los botones. Yo escribo el texto de propósito, que es mi única oportunidad de convencer dentro del diálogo. En Expo se configura en las opciones del plugin en `app.json`; por ejemplo `cameraPermission` de `expo-camera` genera `NSCameraUsageDescription`.

**d)** Apple revisa qué APIs protegidas están en el binario, no solo las que mi código llama. Si una librería incluye código que usa una API protegida, la build necesita el texto aunque yo no la use. ⚠️ verificar. Se resuelve:
- configurando la librería para que no incluya esa parte (por ejemplo, en `expo-camera` con `microphonePermission: false`), o
- sacando la librería, o
- si de verdad se usa, agregando un texto de propósito real.

En mi app lo vi al revés con `expo-location`: si no ponía `locationAlwaysPermission: false`, el plugin agregaba solo el texto de "Siempre" aunque no lo uso.

### C3. Probador de textos de propósito

| Texto propuesto | ¿Aprobado? | Versión mejorada |
|---|---|---|
| "Necesitamos tu ubicación." | No: no dice para qué | "Usamos tu ubicación para mostrarte las farmacias de turno más cercanas." |
| "Para mejorar tu experiencia." | No: vago, no dice qué dato ni qué beneficio | "Usamos tu ubicación para ordenar los resultados según lo que tenés cerca." |
| "Usamos tu ubicación para mostrarte las farmacias de turno más cercanas." | **Sí**: dato + beneficio concreto | — |
| "La app no funciona sin ubicación." | No: presiona, no explica el beneficio (y la app debería funcionar igual) | "Usamos tu ubicación para mostrarte las farmacias de turno más cercanas. Si preferís, podés buscar por barrio." |
| "Ubicación requerida por el sistema." | No: falso y técnico | "Usamos tu ubicación para mostrarte las farmacias de turno más cercanas." |

### C4. Acceso parcial y gradual

| Caso | iOS | En Expo |
|---|---|---|
| Fotos limitadas | 14 | `accessPrivileges: 'limited'` (permisos de `expo-image-picker` / `expo-media-library`) |
| Ubicación aproximada | 14 | `ios.accuracy: 'reduced'` en la respuesta de `expo-location` |
| "Permitir una vez" (ubicación) | 13 | Mientras dura, se ve como `granted`. Al cerrar la app vuelve a "sin decidir" (`undetermined`), por eso hay que consultar en cada uso |
| De "al usar la app" a "Siempre" | 13 | Primero `requestForegroundPermissionsAsync()` y después, en un segundo diálogo, `requestBackgroundPermissionsAsync()` |
| Notificaciones provisionales | 12 | Se piden con `requestPermissionsAsync({ ios: { allowProvisional: true } })`. Se detectan con `ios.status === IosAuthorizationStatus.PROVISIONAL`. **Ojo:** en SDK 57 vi en el código nativo que en ese caso `granted` es `false` y `status` es `'undetermined'`, así que hay que mirar `ios.status` antes que `granted` (`src/lib/interpretar.ts`) |
| Rastreo entre apps (ATT) | 14.5 | `expo-tracking-transparency` (`requestTrackingPermissionsAsync`) ⚠️ verificar el nombre de la función |

**Pregunta adicional.** Expo SDK 57 requiere **iOS 16.4** como mínimo. Lo vi en la plantilla nativa del SDK (`platform :ios, … '16.4'` en el Podfile y `IPHONEOS_DEPLOYMENT_TARGET = 16.4`); React Native solo pide 15.1, pero Expo lo sube. ⚠️ verificar en el changelog de SDK 57. Consecuencia: todo lo de la tabla existe en cualquier iPhone donde corra mi app, así que no tengo que preguntar por la versión de iOS. Lo que sí tengo que manejar son los estados (limitado, aproximado, provisional).

### C5. Android vs iOS, lado a lado

| Característica | Android | iOS |
|---|---|---|
| ¿Dónde se declara? | `<uses-permission>` en el manifiesto | Texto de propósito en `Info.plist` |
| Texto en el diálogo | Lo arma el sistema | Lo escribo yo |
| Oportunidades para preguntar | Dos rechazos y se bloquea (11+) | Una sola |
| "Solo esta vez" / "Permitir una vez" | Ubicación, cámara y micrófono (11+) | Solo ubicación (13+) |
| Notificaciones | Permiso `POST_NOTIFICATIONS` desde Android 13; antes, activadas por defecto | Siempre se piden (o provisionales, sin diálogo) |
| Ubicación en segundo plano | Permiso aparte (`ACCESS_BACKGROUND_LOCATION`, Android 10+). Se pide después del de primer plano | Escalonada: "Siempre" es un segundo diálogo, más `UIBackgroundModes: location` |
| Si falta la declaración | Denegado en silencio, sin diálogo | Crash al acceder y rechazo en App Store (`ITMS-90683`) |

---

## Parte D. Expo: una API, dos plataformas

### D1. Módulos y funciones

| Necesidad | Módulo | Hook / función de permiso |
|---|---|---|
| Escanear un QR | `expo-camera` | `useCameraPermissions()` |
| Grabar video con sonido | `expo-camera` | `useCameraPermissions()` + `useMicrophonePermissions()` |
| Farmacias cercanas | `expo-location` | `requestForegroundPermissionsAsync()` |
| Seguir un envío en segundo plano | `expo-location` (+ `expo-task-manager` ⚠️ verificar) | `requestForegroundPermissionsAsync()` y después `requestBackgroundPermissionsAsync()` |
| Mostrar un recordatorio | `expo-notifications` | `requestPermissionsAsync()` |
| Grabar una nota de voz | `expo-audio` | `requestRecordingPermissionsAsync()` ⚠️ verificar |
| Galería propia dentro de la app | `expo-media-library` | `usePermissions()` / `requestPermissionsAsync()` ⚠️ verificar |
| Publicidad personalizada entre apps (iOS) | `expo-tracking-transparency` | `requestTrackingPermissionsAsync()` ⚠️ verificar |

**Pregunta adicional.** Si un tutorial usa `expo-permissions`, el tutorial es viejo: ese paquete se dejó de usar y hoy cada módulo trae sus propias funciones de permisos. No lo seguiría.

### D2. Consultar, pedir y el hook

**a)** `get…PermissionsAsync()` solo lee el estado y **nunca** muestra un diálogo. `request…PermissionsAsync()` puede mostrar el diálogo del sistema, si todavía se puede preguntar.

**b)** `[permiso, pedirPermiso, consultarPermiso]`:
- `permiso` es la respuesta actual.
- `pedirPermiso` es el `request`.
- `consultarPermiso` es el `get`.

En el primer render `permiso` vale `null`, porque todavía está consultando. Mientras tanto la pantalla tiene que mostrar un indicador de carga, nunca "denegado".

**c)** Si `canAskAgain` es `false`, `request…()` devuelve `denied` al instante, sin diálogo. Llamado en un bucle (por ejemplo en cada render), la pantalla se re-renderiza sin parar y queda "Pidiendo permiso…" para siempre. Por eso en mi app solo se pide desde el botón "Continuar".

### D3. Leé la respuesta

| Respuesta | Qué hace la app |
|---|---|
| `null` | Mostrar "cargando" |
| `{ status: 'granted', granted: true }` | Usar la función |
| `{ status: 'undetermined', canAskAgain: true }` | Pantalla previa con el beneficio y "Continuar" |
| `{ status: 'denied', canAskAgain: true }` | Mostrar la alternativa y un botón para volver a intentar (otra vez la pantalla previa) |
| `{ status: 'denied', canAskAgain: false }` | Explicar cómo habilitarlo y "Abrir Ajustes" (`Linking.openSettings()`), más la alternativa. No llamar a `request…()` |
| `{ status: 'granted', accessPrivileges: 'limited' }` | Funcionar con las fotos que eligió la persona |
| `{ status: 'granted', android: { accuracy: 'coarse' } }` | Funcionar con la ubicación aproximada: en mi app, mostrar "Ubicación aproximada" sin coordenadas |

**Pregunta adicional.** Los dos campos son **`granted`**, que responde "¿puedo usar el recurso ahora?", y **`canAskAgain`**, que responde "si no, ¿puedo mostrar el diálogo o tengo que mandar a Ajustes?".

### D4. Simulación del ciclo completo (Android 14)

| # | Acción | `status` | `canAskAgain` | ¿Diálogo? |
|---|---|---|---|---|
| 1 | `getForegroundPermissionsAsync()` | `undetermined` | `true` | No |
| 2 | `request…()` → "No permitir" | `denied` | `true` | Sí |
| 3 | `request…()` → "No permitir" | `denied` | `false` | Sí |
| 4 | `request…()` | `denied` | `false` | **No** |
| 5 | Habilita en Ajustes → vuelve → la app consulta | `granted` | `true` | No |
| 6 | Igual que el 5, pero sin volver a consultar | La app sigue mostrando "bloqueado" con la respuesta vieja | | |

**Pregunta adicional.**
- **iOS:** cambia en el **paso 2**. Con el primer "No permitir" ya queda `denied` con `canAskAgain: false`, y en el paso 3 ya no hay diálogo: iOS pregunta una sola vez.
- **"Permitir una vez":** si la persona lo elige y después cierra y reabre la app, el permiso vuelve a "sin decidir" y se puede preguntar de nuevo.

### D5. Configurar app.json

```json
{
  "expo": {
    "plugins": [
      ["expo-camera", {
        "cameraPermission": "Usamos tu cámara para leer el código QR del contenedor de reciclaje.",
        "microphonePermission": false,
        "recordAudioAndroid": false
      }],
      ["expo-location", {
        "locationWhenInUsePermission": "Usamos tu ubicación para mostrarte los puntos de reciclaje más cercanos.",
        "locationAlwaysAndWhenInUsePermission": false,
        "locationAlwaysPermission": false,
        "isIosBackgroundLocationEnabled": false,
        "isAndroidBackgroundLocationEnabled": false
      }]
    ],
    "android": {
      "blockedPermissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.SYSTEM_ALERT_WINDOW"
      ]
    }
  }
}
```

**Pregunta adicional.** Porque `CameraView` también puede grabar video con sonido, y por defecto el plugin (`recordAudioAndroid = true`, lo vi en el código del plugin) agrega `RECORD_AUDIO` "por si acaso". Si no grabo video, lo apago.

### D6. Expo Go no es tu app

**a)** Porque Expo Go es una app ya compilada, con su propio `Info.plist` y su propio manifiesto. Mi `app.json` no se aplica, así que en los diálogos se ven los textos de Expo Go. Además, los permisos que doy son de Expo Go, no de mi app.

**b)**
- **En Expo Go:** la lógica de los botones, los estados, los rechazos y las alternativas, las notificaciones locales y la ubicación en primer plano.
- **Solo en una development build:** mis textos de propósito, `blockedPermissions`, las notificaciones push en Android (Expo Go no las tiene desde SDK 53) y la ubicación en segundo plano.

**c)**
```bash
npx expo prebuild --clean                              # ver los archivos nativos generados
npx expo run:android                                   # compilar e instalar en local (necesita Android Studio)
eas build --profile development --platform android     # o compilar en la nube con EAS
```

**d)**
```bash
# Android
adb shell pm revoke <paquete> android.permission.CAMERA
adb shell pm clear-permission-flags <paquete> android.permission.CAMERA user-set user-fixed
# Simulador de iOS
xcrun simctl privacy booted reset camera <bundleId>
```

---

## Parte E. Recetas: leer y corregir código

### E1. Encontrá los errores (cámara)

Problemas:
1. **No contempla el primer render:** `permiso` es `null` al principio, así que `permiso.status` rompe la app.
2. **No contempla el bloqueado:** si `canAskAgain` es `false`, el botón llama a `pedirPermiso`, que no hace nada. La persona queda trabada, sin "Abrir Ajustes".
3. **El botón dice "Permitir":** debería decir "Continuar", porque quien permite o no es el diálogo del sistema que viene después.
4. **No re-consulta al volver de Ajustes:** si habilitan la cámara allá, la pantalla no se entera.
5. **El JSX está roto:** el `style` de `CameraView` y el `onPress="{pedirPermiso}"` como string.
6. **No hay alternativa:** no se puede escribir el aula a mano.

Versión corregida (es la de mi app, `src/app/reporte/escanear.tsx`, simplificada):
```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Linking } from 'react-native';
import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';

export default function Escanear() {
  const [permiso, pedirPermiso, consultarPermiso] = useCameraPermissions();
  useRevisarAlVolver(consultarPermiso);

  if (!permiso) return <Cargando />;                                   // 1. cargando

  if (permiso.granted) {                                               // 2. concedido
    return <CameraView style={{ flex: 1 }} facing="back" />;
  }

  if (permiso.canAskAgain) {                                           // 3. preguntable
    return (
      <Explicacion texto="Usamos la cámara para leer el QR del aula.">
        <Button title="Continuar" onPress={pedirPermiso} />
        <AulaAMano />
      </Explicacion>
    );
  }

  return (                                                             // 4. bloqueado
    <Explicacion texto="La cámara está desactivada. Activala en Ajustes o escribí el aula a mano.">
      <Button title="Abrir Ajustes" onPress={() => Linking.openSettings()} />
      <AulaAMano />
    </Explicacion>
  );
}
```

### E2. El orden importa (ubicación)

**a)** Pide segundo plano antes que primer plano. Hay que pedir primero la ubicación en uso; sin ella, el pedido de segundo plano falla.
- **iOS:** "Siempre" es un segundo paso después de "al usar la app".
- **Android 11+:** el segundo plano no se concede desde el diálogo, sino que lleva a Ajustes ("Permitir todo el tiempo"). ⚠️ verificar

**b)**
```ts
export async function activarSeguimiento() {
  const enUso = await Location.requestForegroundPermissionsAsync();
  if (!enUso.granted) return false;

  const siempre = await Location.requestBackgroundPermissionsAsync();
  return siempre.granted;
}
```

**c)**
```ts
export async function obtenerUbicacion() {
  try {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) return null; // la app sigue con búsqueda manual

    const aproximada =
      permiso.android?.accuracy === 'coarse' || permiso.ios?.accuracy === 'reduced';

    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitud: coords.latitude, longitud: coords.longitude, aproximada };
  } catch {
    return null; // GPS apagado u otro error: no rompe la app
  }
}
```
(Esta función es para el ejercicio: se tiene que llamar desde un toque, después de la pantalla previa.)

**d)** No: alcanza con primer plano, porque la persona mira las farmacias con la app abierta. Si pidiera segundo plano, Google Play me exige una declaración en la Play Console justificando el uso. ⚠️ verificar los detalles (formulario y video de demostración).

### E3. Notificaciones mudas

**a)** Lo más probable es que no haya creado un **canal de notificaciones** antes de pedir: en Android 13+ el diálogo aparece recién cuando existe un canal ⚠️ verificar en la guía de notificaciones de Expo. Hay que llamar a `setNotificationChannelAsync` y después a `requestPermissionsAsync`. Así lo hace mi app en `pedir()` de notificaciones (`src/lib/permisos.ts`).

**b)** En Android 12 o anterior no es un permiso de tiempo de ejecución: las notificaciones vienen activadas, no hay diálogo y `getPermissionsAsync()` devuelve concedido. La persona igual las puede apagar en Ajustes.

**c)** Las **notificaciones provisionales** (iOS 12+): se piden con `allowProvisional: true` y llegan en silencio al Centro de notificaciones, sin diálogo. En código se detectan con `ios.status === Notifications.IosAuthorizationStatus.PROVISIONAL`. No sirve mirar `granted`: en SDK 57 vale `false` en ese caso (lo verifiqué en el código nativo de `expo-notifications`).

**d)** Cuando la persona hace algo que necesita el aviso.
- **Buen momento:** al activar "Avisarme cuando se resuelva mi reporte", o justo después de sacar un turno ("¿Te avisamos un día antes?").
- **Mal momento:** apenas se abre la app, antes de que la persona sepa para qué sirve.

### E4. Fotos sin pedir permiso

| Necesidad | Herramienta | Permiso |
|---|---|---|
| Elegir una foto de perfil | Selector del sistema (`ImagePicker.launchImageLibraryAsync`) | Ninguno |
| Sacar una foto en el momento | `expo-camera` (`CameraView` + `takePictureAsync`) o `ImagePicker.launchCameraAsync` | Cámara |
| Editor que muestra toda la galería | `expo-media-library` | Fotos completas (`READ_MEDIA_IMAGES` / acceso a la fototeca), con declaración en Google Play |
| Adjuntar la foto de un comprobante | Selector del sistema | Ninguno |

**Pregunta adicional.**
- **Por qué:** Google Play restringe `READ_MEDIA_IMAGES` y `READ_MEDIA_VIDEO` porque dan acceso a **todas** las fotos, y la mayoría de las apps solo necesita una. Solo las apps que necesitan acceso amplio como función principal (por ejemplo, una galería o un editor) pueden mantenerlos; el resto tiene que usar el selector.
- **Desde cuándo:** la declaración se pidió desde septiembre de 2024, el cumplimiento fue obligatorio desde el **22 de enero de 2025** y, con prórroga, hasta el **28 de mayo de 2025**. ⚠️ verificar ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/14115180)). La presentación dice "desde mayo 2025".
- **"El mejor permiso"** es el que no tenés que pedir.

### E5. Volver de Ajustes

```ts
const estabaAfuera = anterior.current !== 'active';
if (estabaAfuera && nuevo === 'active') revisar();
return () => sub.remove();
```

**a)** Porque el hook consulta el permiso al montar y no hay ningún evento que avise a JavaScript cuando la persona lo cambia en Ajustes. Hay que volver a consultar cuando la app vuelve al primer plano.

**b)** `consultarPermiso`, el tercer elemento de `useCameraPermissions()`. Así lo hago en `src/app/reporte/escanear.tsx`.

**c)** Porque la persona lo puede cambiar en cualquier momento desde Ajustes (y en Android, además, se revoca solo por desuso o con "Solo esta vez"). Un valor guardado "para siempre" queda viejo y la app mostraría un estado falso. La fuente de verdad es el sistema, así que se consulta.

---

## Parte F. Buenas prácticas y tiendas

### F1. Pedir en contexto

| App y permiso | ¿Cuándo pedirlo? | Alternativa si lo deniegan |
|---|---|---|
| Delivery - ubicación | Al tocar "Usar mi ubicación" para la dirección de entrega | Escribir la dirección o elegir en el mapa |
| Billetera virtual - cámara | Al tocar "Pagar con QR" | Ingresar el código o el alias a mano |
| Red social - contactos | Al tocar "Buscar amigos" | Buscar por nombre de usuario, o el selector de contactos del sistema |
| Mensajería - micrófono | Al mantener apretado "Grabar audio" | Escribir el mensaje |
| Turnos médicos - notificaciones | Después de sacar un turno ("¿Te avisamos un día antes?") | Ver los turnos en la app, o un recordatorio por mail |
| Editor de fotos - galería completa | Al abrir la galería dentro del editor | Elegir fotos sueltas con el selector del sistema |

**Pregunta adicional.** Porque la persona todavía no sabe para qué sirve cada cosa y le aparecen cuatro diálogos seguidos que no puede entender. Aprende a tocar "No permitir" sin leer, y en iOS eso ya deja el permiso bloqueado (en Android, al segundo rechazo).

### F2. La pantalla previa

**a)** El **beneficio en una frase** (con un ícono), **un solo botón "Continuar"** que lanza el pedido real, y la aclaración de que **se puede cambiar en Ajustes**.

**b)** Porque "Permitir" engaña: el que permite o no es el diálogo del sistema que viene después. "Continuar" dice la verdad: seguís hacia la pregunta.

**c)** Que la pantalla previa no puede dar una salida antes del diálogo ("Ahora no", "Cerrar"): la persona tiene que poder decidir en el diálogo del sistema. Apple considera manipulador poner botones que eviten o condicionen ese pedido. ⚠️ verificar el texto exacto de la pauta en las [App Review Guidelines, 5.1.1(iv)](https://developer.apple.com/app-store/review/guidelines/#5.1.1).

**d)** Si está bloqueado, no tiene sentido "Continuar" (no aparecería ningún diálogo). La pantalla explica que el permiso está desactivado, muestra el camino exacto en Ajustes y el botón pasa a ser **"Abrir Ajustes"**, además de la alternativa. En mi app lo hace `PantallaPrevia` con `AvisoBloqueado`.

### F3. Mínimo privilegio

**a)** **Aproximada.** "Puntos de reciclaje del barrio" no necesita saber en qué casa estoy; una zona alcanza.

**b)** **"En uso"**, si la carrera se inicia con la app abierta y sigue con un servicio en primer plano y su notificación visible (Android) o con el indicador de ubicación (iOS). "Siempre" haría falta solo si la app tuviera que arrancar a registrar sola, sin que la persona la abra. ⚠️ verificar el detalle de los servicios en primer plano de Android.

**c)** **Selector del sistema.** Para subir una foto del DNI necesito una sola foto, no toda la galería.

**d)** **Sin micrófono** (`microphonePermission: false`, `recordAudioAndroid: false`). Leer un QR no graba sonido. Es lo que hace mi app.

### F4. Tiendas

**a)**
- **Google Play:**
  - Declaración en la Play Console para permisos sensibles (ubicación en segundo plano, SMS, acceso a todos los archivos, fotos y videos), y usar el selector de fotos si la app no es una galería o un editor.
  - Cumplir el nivel de API objetivo (API 36 desde el 31/08/2026) y completar la sección de Seguridad de los datos ⚠️ verificar.
- **App Store:**
  - Textos de propósito claros y específicos en el `Info.plist` (si faltan: `ITMS-90683`).
  - No manipular ni forzar a dar permisos, y no cerrar la app si se deniegan (pauta 5.1.1). Además, pedir ATT para rastrear entre apps.

**b)** `PrivacyInfo.xcprivacy` es el **manifiesto de privacidad** de Apple: un archivo donde la app (y cada librería) declara qué datos recolecta, si rastrea, y para qué usa ciertas APIs "de motivo requerido" (como la fecha de modificación de archivos o `UserDefaults`). ⚠️ verificar. En Expo se configura en `app.json`, en `expo.ios.privacyManifests` (la clave existe en los tipos de configuración de SDK 57 que tengo instalados).

**c)**
- **Android 17** suma un **selector de contactos del sistema**: la persona comparte solo los contactos que elige, sin dar `READ_CONTACTS`. También suma el permiso de red local (`ACCESS_LOCAL_NETWORK`).
- **Google Play, desde el 27/01/2027:** las apps que apunten a Android 17 (API 37) o superior solo pueden pedir `READ_CONTACTS` si el selector no alcanza para su función principal, y tienen que justificarlo con una declaración en la Play Console. ⚠️ verificar ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/16909972), [Android Developers Blog](https://android-developers.googleblog.com/2026/04/giving-users-clearer-choice-and-everyone-a-safer-more-trusted-app-ecosystem.html)).

### F5. Errores comunes

**a)**
- **Causa:** falta el texto de propósito en el `Info.plist` para ese recurso.
- **Solución:** agregarlo en la opción del plugin en `app.json` (por ejemplo `cameraPermission`) y hacer una build nueva.

**b)**
- **Causa:** en Expo Go el permiso es de Expo Go. En la build cuenta el manifiesto de mi app, y si el permiso no está declarado (o quedó en `blockedPermissions`), Android lo deniega sin diálogo. Otra posibilidad: ya estaba bloqueado.
- **Solución:** revisar los plugins y `blockedPermissions` en `app.json`, mirar el manifiesto con `npx expo prebuild --clean` y recompilar.
- **Ejemplo:** me pasó al probar `cameraPermission: false` en `expo-image-picker`, que bloquea `CAMERA` también para `expo-camera`.

**c)**
- **Causa:** la app no volvió a consultar al volver de Ajustes y sigue mostrando la respuesta vieja.
- **Solución:** re-consultar con `AppState` (`useRevisarAlVolver`).

**d)**
- **Causa:** se llama a `request…()` en el render (o en un `useEffect` que se repite). Si está bloqueado devuelve `denied` al instante, se vuelve a renderizar y se vuelve a llamar.
- **Solución:** pedir solo como respuesta a un toque. Si `canAskAgain` es `false`, no pedir y mandar a Ajustes.

**e)**
- **Causa:** la app trata un rechazo como un error y bloquea todo.
- **Solución:** degradación elegante. Que se pueda usar sin notificaciones (ver los turnos en la app, una bandeja de avisos interna como `/avisos` en mi proyecto) y ofrecer activarlas en un momento con contexto.

---

## Fuentes de lo marcado con ⚠️

- Google Play, nivel de API objetivo: <https://support.google.com/googleplay/android-developer/answer/11926878>
- Google Play, política de fotos y videos: <https://support.google.com/googleplay/android-developer/answer/14115180> y <https://support.google.com/googleplay/android-developer/answer/15800983>
- Google Play, nueva política de contactos (vigente desde 27/01/2027): <https://support.google.com/googleplay/android-developer/answer/16909972>
- Android Developers Blog (abril 2026, políticas de contactos y ubicación): <https://android-developers.googleblog.com/2026/04/giving-users-clearer-choice-and-everyone-a-safer-more-trusted-app-ecosystem.html>
- Android 17, cambios de comportamiento (red local): <https://developer.android.com/about/versions/17/behavior-changes-17>
- Apple, App Review Guidelines 5.1.1: <https://developer.apple.com/app-store/review/guidelines/#5.1.1>
- Expo, permisos: <https://docs.expo.dev/guides/permissions/>
