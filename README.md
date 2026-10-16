# Mantenimiento IPF

App para que alumnos y docentes del **Instituto Politécnico Formosa** reporten desperfectos del edificio (una luz quemada, una canilla que pierde, un proyector roto) y reciban un aviso cuando se resuelven.

Trabajo Práctico N° 3 "Permisos móviles", Taller Complementario React Native II. Hecha con **Expo SDK 57**, **Expo Router** y **TypeScript**.

La app usa la **cámara** (leer el QR del aula y sacar fotos), la **ubicación en primer plano** y las **notificaciones locales**. Para elegir una foto de la galería usa el selector del sistema, **sin permiso de galería**. Ningún permiso se pide al abrir la app: cada uno se pide al tocar su función, después de una pantalla previa. Si se deniega, siempre hay una alternativa y el reporte se puede guardar igual.

---

## Cómo correrla

```bash
npm install
```

| Para… | Comando |
|---|---|
| Probar en **Expo Go** (lógica, estados, alternativas, notificación local) | `npm run start:go` |
| Abrir en la **development build** (textos de propósito y permisos reales) | `npm start` |
| Compilar la development build de Android en la nube (EAS) | `eas build --profile development --platform android` |
| Compilar un APK de prueba sin dev client | `eas build --profile preview --platform android` |
| Ver los archivos nativos que se generan | `npm run prebuild` (regenera `android/`; no se sube a git) |
| Chequeos | `npm run typecheck`, `npm run lint`, `npm run doctor`, `npm test` |

- **Sin túnel:** la red del instituto bloquea ngrok, así que el celular y la PC tienen que estar en la misma red. Si la Wi-Fi aísla los dispositivos, usar el hotspot del celular o USB con `adb reverse tcp:8081 tcp:8081`.
- **Development build:** cómo compilarla desde Windows está en [docs/PRUEBAS.md](docs/PRUEBAS.md#6-development-build-en-android-desde-windows).

---

## Rutas (`src/app`)

```
src/app/
├── _layout.tsx              # Stack raíz + Provider del almacén + setNotificationHandler y listeners
├── +not-found.tsx
├── (tabs)/
│   ├── _layout.tsx          # Tabs: Reportes · Avisos · Permisos
│   ├── index.tsx            # /            → lista de reportes
│   ├── avisos.tsx           # /avisos      → bandeja de avisos (alternativa a las notificaciones)
│   └── permisos.tsx         # /permisos    → panel de permisos
├── permisos/
│   └── [recurso].tsx        # /permisos/camara|ubicacion|notificaciones  (presentation: "modal")
├── reporte/
│   ├── nuevo.tsx            # /reporte/nuevo
│   ├── escanear.tsx         # /reporte/escanear
│   ├── foto.tsx             # /reporte/foto
│   ├── ubicacion.tsx        # /reporte/ubicacion
│   └── [id].tsx             # /reporte/:id
└── ajustes-app.tsx          # /ajustes-app
```

`/reporte/nuevo` no cae en `[id]` porque Expo Router prioriza las rutas estáticas. Además, `[id]` valida el formato con `esIdValido()`.

**Resto del código**

| Carpeta | Qué hay |
|---|---|
| `src/components` | `PantallaPrevia`, `AvisoBloqueado`, `Cargando`, `FilaPermiso`, `TarjetaReporte`, `EtiquetaEstado`, selectores |
| `src/hooks` | `usePermiso` (hook unificado) y `useRevisarAlVolver` (AppState) |
| `src/lib` | `permisos.ts` (adaptador por recurso), `interpretar.ts` (respuesta → 4 estados, sin código nativo), `almacen.tsx` (reportes y avisos en AsyncStorage), `navegacion.ts`, `qr.ts`, `ids.ts` |
| `scripts` | Pruebas de `interpretar()` y del lector de QR (`npm test`) |
| `docs` | Consigna, presentación, [auditoría del manifiesto](docs/AUDITORIA_MANIFIESTO.md), [pruebas](docs/PRUEBAS.md) y [guía para la defensa](docs/DEFENSA.md) |

---

## Permisos

| Recurso | Módulo | Cuándo se pide | Alternativa si se deniega |
|---|---|---|---|
| Cámara (QR del aula) | `expo-camera` (`useCameraPermissions`) | Al tocar "Escanear QR del aula" en `/reporte/nuevo` → pantalla previa → "Continuar" | Escribir el código del aula a mano |
| Cámara (foto) | `expo-camera` (`CameraView` + `takePictureAsync`) | Al tocar "Sacar foto" en `/reporte/foto` → pantalla previa → "Continuar" | Elegir la foto de la galería (sin permiso) |
| Fotos de la galería | `expo-image-picker` (`launchImageLibraryAsync`) | **Nunca**: es el selector del sistema | No hace falta |
| Ubicación (primer plano) | `expo-location` | Al tocar "Marcar ubicación" → pantalla previa → "Continuar" | Elegir el sector a mano (patio, estacionamiento, pasillo, aula, otro) |
| Notificaciones | `expo-notifications` | Al activar "Avisarme cuando se resuelva mi reporte" en `/ajustes-app` → pantalla previa → "Continuar" (en Android crea antes el canal `reportes`) | Bandeja `/avisos` dentro de la app |

Si un permiso está **bloqueado** (`canAskAgain: false`), la app no vuelve a pedirlo: muestra el camino exacto en Ajustes para Android o iOS y el botón "Abrir Ajustes". Al volver de Ajustes, la app vuelve a consultar el estado (`AppState`).

### Bloque `plugins` de `app.json`, comentado

```jsonc
"plugins": [
  "expo-router",
  ["expo-splash-screen", { /* pantalla de carga de la plantilla */ }],

  ["expo-camera", {
    // Texto de NSCameraUsageDescription (iOS). Molde: "Usamos tu [dato] para [beneficio]".
    "cameraPermission": "Usamos tu cámara para leer el QR de la puerta del aula y sacar fotos del desperfecto que reportás.",
    // No grabamos video con sonido: sin NSMicrophoneUsageDescription en iOS…
    "microphonePermission": false,
    // …y sin RECORD_AUDIO en Android (expo-camera lo agrega por defecto para grabar video).
    "recordAudioAndroid": false
  }],

  ["expo-location", {
    // Texto de NSLocationWhenInUseUsageDescription: solo "mientras se usa la app".
    "locationWhenInUsePermission": "Usamos tu ubicación para marcar en qué parte del edificio está el problema que reportás.",
    // Sin estas tres en false, el plugin agrega textos genéricos para "Siempre" y
    // para el sensor de movimiento, aunque la app no los use.
    "locationAlwaysAndWhenInUsePermission": false,
    "locationAlwaysPermission": false,
    "motionUsagePermission": false,
    // Nada de segundo plano: ni UIBackgroundModes en iOS ni ACCESS_BACKGROUND_LOCATION en Android.
    "isIosBackgroundLocationEnabled": false,
    "isAndroidBackgroundLocationEnabled": false
  }],

  ["expo-image-picker", {
    // Usamos el selector del sistema: no hace falta NSPhotoLibraryUsageDescription.
    "photosPermission": false,
    // Sin micrófono: además, el plugin bloquea RECORD_AUDIO en Android.
    "microphonePermission": false
    // A propósito NO lleva "cameraPermission": con false, el plugin bloquearía CAMERA en
    // Android y dejaría sin cámara a expo-camera. Ver docs/AUDITORIA_MANIFIESTO.md.
  }],

  ["expo-notifications", {
    // Color del ícono de la notificación en Android (el mismo azul de la app).
    "color": "#1E5AA8"
  }]
]
```

### Por qué cada permiso de `blockedPermissions`

`android.blockedPermissions` agrega `tools:node="remove"` al manifiesto. Así el permiso no entra al APK aunque lo declare alguna librería o la plantilla.

| Permiso bloqueado | Quién lo agregaría | Por qué lo sacamos |
|---|---|---|
| `RECORD_AUDIO` | `expo-camera`, `expo-image-picker` | No grabamos audio ni video con sonido |
| `ACCESS_BACKGROUND_LOCATION` | `expo-location` (si se activa segundo plano) | Solo usamos la ubicación con la app abierta; Google Play exige justificar el segundo plano |
| `READ_MEDIA_IMAGES` | — (por si una librería lo suma) | Las fotos se eligen con el selector del sistema, que no necesita permiso. Google Play lo restringe a apps que necesitan toda la galería |
| `READ_MEDIA_VIDEO` | — | No usamos videos |
| `READ_MEDIA_VISUAL_USER_SELECTED` | — | Es el "acceso parcial" de Android 14: tampoco lo necesitamos con el selector |
| `READ_EXTERNAL_STORAGE` | plantilla, `expo-image-picker`, `expo-file-system` (hasta Android 12) | Mismo motivo: el selector no lo necesita |
| `WRITE_EXTERNAL_STORAGE` | plantilla, `expo-image-picker`, `expo-file-system` (hasta Android 12) | Las fotos que saca la app quedan en su caché, que no requiere permiso |
| `SYSTEM_ALERT_WINDOW` | plantilla de prebuild | Permiso especial para dibujar sobre otras apps: no lo usamos |

### Auditoría del manifiesto (desafío opcional)

Ver [docs/AUDITORIA_MANIFIESTO.md](docs/AUDITORIA_MANIFIESTO.md): cada permiso del `AndroidManifest.xml` generado con `npx expo prebuild --clean`, quién lo agrega y si se quitó, más las claves del `Info.plist`.

En resumen, quedan **activos** `CAMERA`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `INTERNET` y `VIBRATE`. Al compilar se suman `POST_NOTIFICATIONS` y `RECEIVE_BOOT_COMPLETED`, de `expo-notifications`. Todo lo de la tabla anterior aparece con `tools:node="remove"`.

### Desafíos opcionales

- [x] **Auditoría del manifiesto**: [docs/AUDITORIA_MANIFIESTO.md](docs/AUDITORIA_MANIFIESTO.md).
- [x] **Bloqueo por plataforma**: `pasosAjustes()` en [src/lib/permisos.ts](src/lib/permisos.ts) arma el camino exacto en Ajustes para Android y para iOS (y avisa si estás en Expo Go). Lo muestra [AvisoBloqueado](src/components/AvisoBloqueado.tsx).
- [ ] **Notificaciones provisionales (iOS)**: `interpretar()` ya detecta el estado provisional (`ios.status === 3`) y el panel lo muestra como "parcial", pero la app todavía no lo pide con `allowProvisional`.
- [ ] **Nota de voz** con `expo-audio`.

---

## Capturas

> Reemplazar cada 📷 por la imagen (`docs/capturas/…png`).

### Escáner en sus cuatro estados
| 1. Cargando | 2. Cámara (concedido) | 3. Pantalla previa (preguntable) | 4. Bloqueado |
|---|---|---|---|
| 📷 `escaner-cargando.png` | 📷 `escaner-camara.png` | 📷 `escaner-previa.png` | 📷 `escaner-bloqueado.png` |

### Ubicación
| Concedida (precisa o aproximada) | Denegada (sector a mano) |
|---|---|
| 📷 `ubicacion-concedida.png` | 📷 `ubicacion-denegada.png` |

### Foto desde el selector del sistema
📷 `foto-selector.png`

### Notificación recibida
📷 `notificacion.png`

### Panel de permisos antes y después de volver de Ajustes
| Antes (bloqueado) | Después (concedido) |
|---|---|
| 📷 `panel-antes.png` | 📷 `panel-despues.png` |

### Diálogo del sistema con el texto de propósito (development build)
📷 `dialogo-sistema.png`

> En Android el diálogo no muestra texto propio (lo arma el sistema). El texto de propósito se ve en el diálogo de **iOS**. Si no hay dispositivo iOS, acompañar la captura de Android con la salida de `npx expo config --type introspect` que muestra `NSCameraUsageDescription` y `NSLocationWhenInUseUsageDescription`.

---

## Documentación

- [RESPUESTAS.md](RESPUESTAS.md): Partes A a F.
- [docs/PRUEBAS.md](docs/PRUEBAS.md): chequeos automáticos y pruebas manuales.
- [docs/DEFENSA.md](docs/DEFENSA.md): preguntas de la defensa oral con el archivo y la línea que las responde.
