# Permisos Móviles

**Taller Complementario · React Native II**
*Tecnicatura Superior en Desarrollo de Software Multiplataforma*
*Instituto Politécnico Formosa · Expo SDK 57*

> 🎤 **Notas del docente:** Objetivo de la clase: que puedan pedir permisos en el momento justo, leer la respuesta del sistema y diseñar qué hace la app en cada caso, tanto en Android como en iOS.

---

## El recorrido de la clase

1. **Contexto:** Qué es un permiso, por qué existe y sus estados.
2. **Android:** Tipos, manifiesto, diálogo y cambios por versión.
3. **iOS:** Textos de propósito, acceso parcial y comparación.
4. **Expo:** La API, la respuesta, el simulador y app.json.
5. **Recetas:** Cámara, ubicación, notificaciones, fotos y Ajustes.
6. **Buenas prácticas:** Contexto, pantalla previa, alternativas y tiendas.
7. **Taller:** Errores comunes, práctica y cuestionario final.

> 🎤 **Notas del docente:** Duración sugerida: 2 módulos de 80 min. Primer módulo: Contexto, Android e iOS. Segundo módulo: Expo, recetas, buenas prácticas, taller y cuestionario.

---

## ¿Qué es un permiso?

Es la autorización que la persona usuaria le da a una app para usar un **recurso sensible** del dispositivo: la cámara, el micrófono, la ubicación, las fotos, los contactos o las notificaciones.

El flujo consta de tres partes:
1. **La app:** Declara qué recursos podría usar y, en el momento justo, pide acceso.
2. **El sistema operativo:** Muestra el diálogo oficial, guarda la decisión y la hace cumplir.
3. **La persona usuaria:** Acepta, rechaza o da acceso parcial. Puede cambiar de idea en Ajustes.

> 💡 **Una analogía:** Pensalo como el portero de un edificio. La app es una visita que quiere subir a un departamento (la cámara). No sube sola: el portero (el sistema operativo) llama al dueño (la persona usuaria), que decide si la deja pasar. Y el portero se acuerda de la respuesta.

> ⚠️ **Clave:** Tu código nunca dibuja el diálogo de permiso: lo muestra el sistema. Vos elegís **cuándo** pedirlo y **qué hacer** con la respuesta.

> 🎤 **Notas del docente:** Preguntar: ¿qué app les pidió un permiso hace poco? ¿Leyeron el mensaje o tocaron «Permitir» de memoria? ¿Alguna vez dijeron que no y la app dejó de funcionar?

---

## ¿Por qué existen los permisos?

Cada app vive en su propia **caja de arena** (sandbox): un espacio aislado donde solo ve sus archivos. Para salir de la caja y tocar algo sensible necesita una llave, y esa llave solo la puede dar la persona usuaria.

*   **Sin permiso**, una app puede mostrar pantallas, guardar sus propios datos y conectarse a internet.
*   **Con permiso**, puede sacar fotos, saber dónde estás, escucharte, leer tu agenda o mandarte avisos.

**Pilares:**
*   **Privacidad:** Dónde estás, tus fotos o tu voz no salen del dispositivo sin tu acuerdo.
*   **Seguridad:** Si una app maliciosa se cuela, el daño queda limitado a lo que se le permitió.
*   **Transparencia:** El sistema muestra qué app usa qué: indicadores de cámara, micrófono y ubicación.
*   **Control:** La decisión no es para siempre: se revisa y se revoca desde Ajustes.

> 💡 **Para quien desarrolla:** Un permiso es un pedido de confianza. Cuanto mejor expliques para qué lo usás, más chances tenés de que te lo den.

> 🎤 **Notas del docente:** Actividad rápida: que revisen en sus celulares qué apps tienen acceso a la ubicación. Android: Ajustes → Privacidad → Administrador de permisos. iOS: Ajustes → Privacidad y seguridad → Localización.

---

## Dos momentos: declarar y solicitar

Todo permiso pasa por dos etapas. **Si no lo declarás, no lo podés pedir; si no lo pedís, no lo tenés.**

### 1. Declarar (al compilar)
Le avisás al sistema qué recursos podría usar tu app. Queda escrito dentro del paquete que se instala.
*   **Android:** una línea `<uses-permission>` en el `AndroidManifest.xml`.
*   **iOS:** un texto de propósito en el `Info.plist`.
*   **Expo:** los dos archivos se generan desde `app.json`.

### 2. Solicitar (al ejecutar)
Cuando la persona usa la función, tu código pide acceso y el sistema muestra el diálogo.
*   **Android:** solo para los permisos de tiempo de ejecución.
*   **iOS:** para cada recurso protegido.
*   **Expo:** `request…PermissionsAsync()` o el hook del módulo.

**El Flujo Completo:**
1. **app.json:** Plugins de cada módulo y textos de propósito.
2. **Compilación:** prebuild o EAS Build generan los archivos nativos.
3. **Instalación:** Android concede solo los permisos normales.
4. **Ejecución:** Tu código llama a `request…()`.
5. **Diálogo:** El sistema pregunta y devuelve la respuesta.

> 🎤 **Notas del docente:** En Expo casi nunca se toca el `AndroidManifest.xml` ni el `Info.plist` a mano: se regeneran en cada prebuild. La fuente de verdad es `app.json`. Ojo: los cambios en el `Info.plist` no viajan por actualizaciones OTA. Agregar un permiso nuevo exige una build nueva.

---

## Los estados de un permiso

*   **Sin decidir (`undetermined`):** Todavía no se preguntó (estado al instalar). Explicá el beneficio y pedí el permiso cuando se use la función.
*   **Concedido (`granted`):** La app puede usar el recurso. Usalo, pero volvé a consultar al volver de primer plano (puede revocarse en Ajustes).
*   **Denegado (`denied`, `canAskAgain: true`):** Rechazó una vez, pero el sistema puede volver a preguntar. Ofrecé alternativa y botón para reintentar. *(Solo Android)*
*   **Parcial (`granted` con limitaciones):** Acceso con límites (fotos seleccionadas, ubicación aproximada). Funcioná con lo que hay.
*   **Bloqueado (`denied`, `canAskAgain: false`):** El sistema ya no muestra el diálogo. Explicá cómo habilitarlo en Ajustes.

**Diferencia principal:**
*   **Android (11+):** da dos oportunidades (rechazo → denegado → bloqueado).
*   **iOS:** pregunta una sola vez (rechazo → bloqueado directo).

> 🎤 **Notas del docente:** Tocar la diferencia central: Android da dos oportunidades e iOS una sola. Los nombres en inglés son exactamente los que devuelve Expo.

---

## Android: tres tipos de permisos

Android clasifica cada permiso según el riesgo:

1.  **De instalación (normales):** Riesgo bajo, no exponen datos personales. Se conceden al instalar, sin diálogo.
    *   *Ejemplos:* `INTERNET`, `VIBRATE`, `ACCESS_NETWORK_STATE`, `USE_BIOMETRIC`.
2.  **En tiempo de ejecución (peligrosos):** Acceso a datos privados o sensores. Desde Android 6.0 se piden con un diálogo en uso.
    *   *Ejemplos:* `CAMERA`, `RECORD_AUDIO`, `ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS`, `READ_CONTACTS`.
3.  **Especiales:** Operaciones muy sensibles de sistema. No hay diálogo, se activan en Ajustes manualmente.
    *   *Ejemplos:* `SYSTEM_ALERT_WINDOW`, `SCHEDULE_EXACT_ALARM`, `MANAGE_EXTERNAL_STORAGE`.

> 💡 **Grupos de permisos:** La persona no ve nombres técnicos sino grupos: pedir `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION` juntos genera un solo diálogo de «Ubicación».

> 🎤 **Notas del docente:** Existe un cuarto tipo, los permisos de firma (signature), que en apps comunes no se usan. Todos llevan el prefijo `android.permission.`.

---

## Clasificador de Permisos (Demo)

*Detalle de permisos de Android y su clasificación:*
*   `INTERNET`: **Normal** (No expone datos personales).
*   `CAMERA`: **Tiempo de ejecución** (Puede capturar imágenes de la persona).
*   `VIBRATE`: **Normal** (Riesgo mínimo para privacidad).
*   `ACCESS_FINE_LOCATION`: **Tiempo de ejecución** (Revela dónde está la persona).
*   `POST_NOTIFICATIONS`: **Tiempo de ejecución** (Desde Android 13).
*   `SYSTEM_ALERT_WINDOW`: **Especial** (Podría tapar o imitar otras apps).
*   `SCHEDULE_EXACT_ALARM`: **Especial** (Afecta la batería de todo el sistema).
*   `READ_MEDIA_IMAGES`: **Tiempo de ejecución** (Fotos de la galería).
*   `MANAGE_EXTERNAL_STORAGE`: **Especial** (Acceso total al almacenamiento).
*   `REQUEST_INSTALL_PACKAGES`: **Especial** (Instalar otras apps).
*   `USE_BIOMETRIC`: **Normal** (La app nunca ve la huella, solo recibe sí/no).

---

## El manifiesto de Android

**En nativo (`AndroidManifest.xml`):**
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
  <!-- Normal -->
  <uses-permission android:name="android.permission.INTERNET" />
  <!-- Tiempo de ejecución -->
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <!-- Quitado a propósito -->
  <uses-permission android:name="android.permission.RECORD_AUDIO" tools:node="remove" />
</manifest>
```

> ⚠️ **Importante:** Si tu código pide un permiso que no está en el manifiesto, Android lo deniega en el acto, sin diálogo.

**En Expo (`app.json`):**
En Expo no se edita a mano. Los plugins de módulos (`expo-camera`, etc.) agregan solos lo que necesitan.
```json
{
  "expo": {
    "android": {
      "permissions": [
        "android.permission.SCHEDULE_EXACT_ALARM"
      ],
      "blockedPermissions": [
        "android.permission.RECORD_AUDIO"
      ]
    }
  }
}
```

---

## Así pregunta Android

El sistema dibuja el diálogo, que contiene:
1. **Título armado por el sistema:** Vos no ponés el texto de la alerta. La explicación la tenés que dar en tu UI *antes* de pedir.
2. **Precisa o aproximada (Android 12+):** La persona puede darte solo una zona (unos 3km²). Tu app debe funcionar con ambas.
3. **Mientras la app está en uso:** Se mantiene, pero solo en primer plano.
4. **Solo esta vez (Android 11+):** Se revoca poco después de salir de la app (solo para ubicación, cámara y micrófono).
5. **No permitir:** Si se toca 2 veces, Android bloquea el diálogo (Android 11+).

---

## Android, versión por versión

*   **Android 6.0 (2015):** Nacen los permisos en tiempo de ejecución.
*   **Android 10 (2019):** Ubicación en segundo plano pasa a ser un permiso aparte. Opción de "Solo mientras se usa la app".
*   **Android 11 (2020):** "Solo esta vez" para cámara/ubicación/micrófono. Dos rechazos bloquean. Reinicio automático de permisos si la app no se usa.
*   **Android 12 (2021):** Ubicación aproximada o precisa en el diálogo.
*   **Android 13 (2022):** Notificaciones requieren permiso explícito (`POST_NOTIFICATIONS`). Permisos multimedia por tipo de archivo. Selector de fotos del sistema.
*   **Android 14 (2023):** Acceso parcial a fotos (Seleccionar fotos).
*   **Android 16 (2025):** Target SDK mínimo requerido por Google Play desde agosto de 2026.
*   **Android 17 (2026):** Nuevo permiso para red local y selector de contactos nativo sin necesidad de permiso `READ_CONTACTS`.

---

## iOS: sin texto, no hay permiso

En iOS no hay lista de permisos en el manifiesto, cada recurso exige un **texto de propósito** en el `Info.plist`. Ese texto aparece *dentro* del diálogo.

*   **Si falta el texto:** El acceso falla y la app suele crashear (ej. cámara/fotos). App Store rechaza la build (`ITMS-90683`).
*   **Aparece una sola vez:** Después, solo se cambia en Ajustes.
*   **Textos revisados:** Apple rechaza apps con descripciones vagas o engañosas.

| Recurso | Clave en Info.plist |
| :--- | :--- |
| Cámara | `NSCameraUsageDescription` |
| Micrófono | `NSMicrophoneUsageDescription` |
| Ubicación en uso | `NSLocationWhenInUseUsageDescription` |
| Ubicación siempre | `NSLocationAlwaysAndWhenInUseUsageDescription` |
| Fotos (leer) | `NSPhotoLibraryUsageDescription` |
| Fotos (solo guardar) | `NSPhotoLibraryAddUsageDescription` |
| Rastreo (ATT) | `NSUserTrackingUsageDescription` |

---

## Así pregunta iOS

El diálogo en iOS contiene:
1. **Título:** "Permitir que [App] use tu ubicación?" (Armado por el sistema).
2. **Texto de propósito:** Lo escribís vos en `app.json`. Tu única oportunidad de convencer dentro de la alerta.
3. **Precisa (iOS 14+):** Un interruptor sobre el mapa para dar ubicación aproximada.
4. **Permitir una vez (iOS 13+):** Vale para esa sesión. Al cerrar, vuelve a "sin decidir".
5. **Permitir al usar la app:** Mientras esté en primer plano.
6. **No permitir:** Queda bloqueado para siempre (solo reversible en Ajustes).

> 💡 **Cómo escribir un buen texto de propósito:**
> Describe con claridad el uso y el beneficio concreto (Ej: "Usamos tu ubicación para mostrarte las farmacias de turno más cercanas"). Evitá textos genéricos ("Para una mejor experiencia") o muy técnicos ("Se utiliza CoreLocation...").

---

## iOS: acceso parcial y gradual

En iOS rara vez es todo o nada. Tu app debe funcionar con menos datos.
*   **Fotos limitadas (iOS 14):** Solo ves fotos elegidas (`accessPrivileges: 'limited'`).
*   **Ubicación aproximada (iOS 14):** Recibís una zona (`accuracy: 'reduced'`).
*   **Ubicación escalonada (iOS 13):** Primero se pide en uso. El paso a "Siempre" es un segundo diálogo.
*   **Notificaciones provisionales (iOS 12):** Llegan en silencio sin diálogo previo.
*   **Contactos limitados (iOS 18):** Acceso solo a contactos seleccionados.

> ⚠️ **App Tracking Transparency (ATT):** Desde iOS 14.5, rastrear a la persona entre apps de otras empresas requiere permiso (`expo-tracking-transparency`).

---

## iOS, versión por versión

*   **iOS 10 (2016):** Textos de propósito obligatorios.
*   **iOS 11 (2017):** Si se pide "Siempre", el diálogo ofrece también "Al usar la app".
*   **iOS 12 (2018):** Notificaciones provisionales.
*   **iOS 13 (2019):** "Permitir una vez" para ubicación.
*   **iOS 14 (2020):** Fotos limitadas, ubicación aproximada, permiso de red local.
*   **iOS 14.5 (2021):** App Tracking Transparency (ATT).
*   **iOS 17/18 (2023+):** Acceso parcial a calendario y contactos limitados.

---

## Android vs iOS, lado a lado

| Característica | Android | iOS |
| :--- | :--- | :--- |
| **Dónde se declara** | `<uses-permission>` | Texto en `Info.plist` |
| **Texto en el diálogo** | Del sistema | Lo escribís vos |
| **Oportunidades** | Dos rechazos y se bloquea (11+) | Una sola |
| **"Solo esta vez"** | Ubicación, cámara, micrófono | Solo ubicación |
| **Falta de declaración** | Denegado silenciosamente | Falla/Crash, rechazo en Tienda |
| **Revocación** | En Ajustes, o automático por desuso | Ajustes |

---

## Expo: una API, dos plataformas

Todos los módulos usan el mismo formato (por ejemplo, con `expo-location`):
```tsx
import * as Location from 'expo-location';

// 1. Consultar: no muestra nada, solo informa
const actual = await Location.getForegroundPermissionsAsync();

// 2. Pedir: muestra el diálogo si todavía se puede
const respuesta = await Location.requestForegroundPermissionsAsync();

// 3. Hook: lo mismo, en un componente
const [permiso, pedirPermiso, consultarPermiso] = Location.useForegroundPermissions();
```

---

## La respuesta: `PermissionResponse`

```tsx
{
  status: 'granted' | 'denied' | 'undetermined',
  granted: boolean,     // atajo para status === 'granted'
  canAskAgain: boolean, // ¿se puede mostrar el diálogo?
  expires: 'never',
}
```

**Reglas de acción:**
*   `permiso === null`: Aún consultando -> Mostrar spinner.
*   `granted`: -> Usar la función.
*   `undetermined`: -> Explicar beneficio y ofrecer botón para pedir.
*   `denied` + `canAskAgain: true`: -> Mostrar alternativa y botón para reintentar.
*   `denied` + `canAskAgain: false`: -> Explicar y mandar a Ajustes (`Linking.openSettings()`).

---

## Expo Go vs Development Build

**Expo Go:**
* Es una app pre-compilada. Tus textos de `app.json` no se aplican (ves los de Expo).
* Sirve para probar lógica de botones, rechazos y estados.
* Faltan funciones nativas puras (ej. Push notifications en Android SDK 53+).

**Development Build:**
* Es tu propia app compilada con tu `app.json`.
* Muestra tus textos y permisos reales. Obligatoria para validar permisos antes de publicar.
```bash
# Ver manifiesto generado
$ npx expo prebuild --clean
# Compilar e instalar
$ npx expo run:android
```

---

## Receta 1: La cámara

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Linking } from 'react-native';

export default function Escanear() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const abrirAjustes = () => Linking.openSettings();

  if (!permiso) return <Cargando />; // 1. consultando

  if (permiso.granted) {             // 2. concedido
    return <CameraView style={{ flex: 1 }} facing="back" />;
  }

  if (permiso.canAskAgain) {         // 3. preguntable
    return (
      <Explicacion texto="Usamos la cámara para leer tu QR.">
        <Button title="Continuar" onPress={pedirPermiso} />
      </Explicacion>
    );
  }

  return (                           // 4. bloqueado (Ajustes)
    <Explicacion texto="Cámara desactivada.">
      <Button title="Abrir Ajustes" onPress={abrirAjustes} />
    </Explicacion>
  );
}
```

> 💡 **Mínimo privilegio:** En `app.json`, si no grabas video con sonido, establece `"microphonePermission": false` y `"recordAudioAndroid": false` en el plugin de `expo-camera`.

---

## Receta 2: La ubicación

```tsx
import * as Location from 'expo-location';

export async function obtenerUbicacion() {
  const permiso = await Location.requestForegroundPermissionsAsync();
  if (!permiso.granted) return null; // App sigue vía búsqueda manual

  const aproximada =
    permiso.android?.accuracy === 'coarse' ||
    permiso.ios?.accuracy === 'reduced';

  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { ...coords, aproximada };
}
```
> ⚠️ **Segundo plano:** Solo pidas ubicación en segundo plano (`requestBackgroundPermissionsAsync`) **después** de obtener la de primer plano, y solo si tu app realmente lo exige (ej. seguimiento de pedidos continuos). Google Play es muy estricto con esto.

---

## Receta 3: Notificaciones

```tsx
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function pedirNotificaciones() {
  // Android: crear canal primero
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('recordatorios', {
      name: 'Recordatorios',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  if (!actual.canAskAgain) return false;

  const respuesta = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return respuesta.granted;
}
```

---

## Receta 4: Fotos sin pedir permiso

**El mejor permiso es el que no tenés que pedir.** Usá el selector nativo del sistema para que el usuario elija una foto, y la app recibe solo ese archivo sin permisos adicionales.

```tsx
import * as ImagePicker from 'expo-image-picker';

const resultado = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: true,
  quality: 0.8,
});

if (!resultado.canceled) {
  setFoto(resultado.assets[0].uri);
}
```

> Solo pedí la librería completa con `expo-media-library` si estás armando una galería o editor de fotos complejo.

---

## Receta 5: Volver de Ajustes

Si envías al usuario a Ajustes (`Linking.openSettings()`) y él cambia el permiso, **Expo no actualiza el estado automáticamente**. Debes re-consultar cuando la app vuelve al primer plano (AppState).

```tsx
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useRevisarAlVolver(revisar: () => void) {
  const anterior = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nuevo) => {
      const estabaAfuera = anterior.current !== 'active';
      if (estabaAfuera && nuevo === 'active') revisar();
      anterior.current = nuevo;
    });
    return () => sub.remove();
  }, [revisar]);
}

// Uso en componente:
// const [permiso, pedir, consultar] = useCameraPermissions();
// useRevisarAlVolver(consultar);
```

---

## Buenas Prácticas

### 1. Pedir en contexto, no al abrir
Conecta el pedido a una acción ("Escanear ticket" -> pide cámara). Una cascada de permisos al abrir entrena el "No permitir" automático.

### 2. La pantalla previa (Pre-prompt)
Antes del diálogo oficial, poné una pantalla propia que explique **el beneficio**:
* "Usamos la cámara para sumar tus puntos."
* Un solo botón "Continuar" que lance el pedido real.
* Un texto recordando que "Se puede revocar en Ajustes".

### 3. Degradación elegante (Si dicen que no)
Un rechazo **es una decisión**, no un bug. Diseñá alternativas:
* Ubicación rechazada -> Ingresar barrio manual.
* Cámara rechazada -> Tipear código.
* Micrófono rechazado -> Escribir texto.

### 4. Mínimo privilegio y Tiendas
* **Google Play:** Exige declaración en Consola para permisos como Ubicación en 2do plano, SMS o todos los archivos. Desde mayo 2025 exige usar Selectores de Fotos si tu app no es un editor visual.
* **Apple:** Exige textos detallados en el `Info.plist`. Rechaza apps que te fuercen/manipulen a dar permisos o que cierren puertas sin alternativas útiles (Guideline 5.1.1).

---

## Errores Comunes

1. **Crash por falta de texto en iOS:** `This app has crashed because it attempted to access privacy-sensitive data without a usage description.` Solución: agregalo en el plugin de `app.json`.
2. **Pedir en bucle:** Si `canAskAgain` es `false`, `requestPermissionsAsync` retorna instantáneamente. Evitá bucles y derivá a Ajustes.
3. **"En Expo Go anda, compilada no":** Tus permisos en `app.json` no afectan a Expo Go. Siempre compilá para probar.
4. **Segundo plano directo:** Sin primer plano otorgado, solicitar el segundo plano fallará.
5. **No consultar al volver de Ajustes:** La UI quedará mostrando estado "Bloqueado" aunque el usuario ya haya dado el permiso nativamente.

---

## Cuestionario / Repaso

**1. En iOS, si la app pide cámara pero falta `NSCameraUsageDescription`, ¿qué pasa?**
* **Respuesta:** La app se cierra (crash) en el momento del acceso. La build es rechazada en la App Store.

**2. Android 11+: si la persona toca "No permitir" dos veces, ¿qué pasa al llamar a `requestForegroundPermissionsAsync` de nuevo?**
* **Respuesta:** No se muestra el diálogo y retorna `canAskAgain: false` inmediatamente. Se asume bloqueo.

**3. ¿Cuál de estos es un permiso Normal en Android que se concede al instalar?**
* **Respuesta:** `INTERNET`. Los peligrosos (como cámara, ubicación, etc) requieren diálogo.

**4. Si obtienes `{ status: 'denied', canAskAgain: true }`, ¿cuál es el mejor flujo?**
* **Respuesta:** Mostrar tu UI alternativa, funcionando sin el recurso, pero dando un botón contextualizado ("Activar Ubicación") para que el usuario pueda gatillar el diálogo si cambia de opinión.

**5. ¿Qué te devuelve el hook `useCameraPermissions` de expo?**
* **Respuesta:** Un array: `[permiso, funcionPedirPermiso, funcionConsultarPermiso]`.

**6. ¿Cómo evitas el permiso de galería y mejoras la privacidad para subir fotos de perfil?**
* **Respuesta:** Usa el selector nativo con `ImagePicker.launchImageLibraryAsync()`.