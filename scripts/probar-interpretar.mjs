// Prueba rápida de interpretar() con los 7 casos de la tabla (más dos extra).
// Correr con: npm run test:interpretar
// Node 24 ejecuta el .ts directamente (borra los tipos); no hace falta tsx ni Jest.
import assert from 'node:assert/strict';

import { interpretar, IOS_NOTIF_EPHEMERAL, IOS_NOTIF_PROVISIONAL } from '../src/lib/interpretar.ts';
import { IosAuthorizationStatus } from '../node_modules/expo-notifications/build/NotificationPermissions.types.js';

// Respuesta base: lo que devuelve un get…/request…PermissionsAsync() sin matices.
const base = (status, granted, canAskAgain, extra = {}) => ({ status, granted, canAskAgain, expires: 'never', ...extra });

const casos = [
  ['1. null (primer render)', null, { estado: 'cargando', parcial: false }],
  [
    '2. notificaciones provisionales (iOS)',
    base('undetermined', false, true, { ios: { status: IosAuthorizationStatus.PROVISIONAL } }),
    { estado: 'concedido', parcial: true, detalle: 'provisional' },
  ],
  [
    '3. fotos limitadas',
    base('granted', true, true, { accessPrivileges: 'limited' }),
    { estado: 'concedido', parcial: true, detalle: 'acceso limitado' },
  ],
  [
    '4a. ubicación aproximada (Android)',
    base('granted', true, true, { android: { accuracy: 'coarse' } }),
    { estado: 'concedido', parcial: true, detalle: 'ubicación aproximada' },
  ],
  [
    '4b. ubicación aproximada (iOS)',
    base('granted', true, true, { ios: { scope: 'whenInUse', accuracy: 'reduced' } }),
    { estado: 'concedido', parcial: true, detalle: 'ubicación aproximada' },
  ],
  [
    '5. concedido sin matices (ubicación precisa)',
    base('granted', true, true, { android: { accuracy: 'fine' } }),
    { estado: 'concedido', parcial: false },
  ],
  ['6a. sin decidir', base('undetermined', false, true), { estado: 'preguntable', parcial: false }],
  ['6b. denegado una vez (Android)', base('denied', false, true), { estado: 'preguntable', parcial: false }],
  ['7. bloqueado', base('denied', false, false), { estado: 'bloqueado', parcial: false }],
  [
    'extra: notificaciones efímeras (App Clip)',
    base('undetermined', false, true, { ios: { status: IosAuthorizationStatus.EPHEMERAL } }),
    { estado: 'concedido', parcial: true, detalle: 'efímero (App Clip)' },
  ],
  [
    'extra: notificaciones autorizadas (iOS)',
    base('granted', true, true, { ios: { status: IosAuthorizationStatus.AUTHORIZED } }),
    { estado: 'concedido', parcial: false },
  ],
];

// Las constantes copiadas en interpretar.ts tienen que coincidir con el enum real.
assert.equal(IOS_NOTIF_PROVISIONAL, IosAuthorizationStatus.PROVISIONAL, 'IOS_NOTIF_PROVISIONAL desactualizado');
assert.equal(IOS_NOTIF_EPHEMERAL, IosAuthorizationStatus.EPHEMERAL, 'IOS_NOTIF_EPHEMERAL desactualizado');

let fallas = 0;
for (const [nombre, respuesta, esperado] of casos) {
  try {
    assert.deepEqual(interpretar(respuesta), esperado);
    console.log(`✔ ${nombre}`);
  } catch (e) {
    fallas++;
    console.log(`✖ ${nombre}\n  ${e.message.split('\n').join('\n  ')}`);
  }
}
console.log(`\n${casos.length - fallas}/${casos.length} casos OK`);
process.exit(fallas === 0 ? 0 : 1);
