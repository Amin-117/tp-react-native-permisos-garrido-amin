// Prueba rápida de leerCodigoAula(). Correr con: npm run test:qr
import assert from 'node:assert/strict';

import { leerCodigoAula } from '../src/lib/qr.ts';

const casos = [
  ['IPF-AULA:B12', 'B12'],
  ['ipf-aula: lab 3 ', 'LAB 3'],
  ['  204  ', '204'],
  ['Aula   7', 'AULA 7'],
  ['IPF-AULA:', null],
  ['', null],
  ['https://ejemplo.com/phishing', null],
  ['un texto larguísimo que no es un aula', null],
  ['-B12', null],
];

let fallas = 0;
for (const [entrada, esperado] of casos) {
  try {
    assert.equal(leerCodigoAula(entrada), esperado);
    console.log(`✔ ${JSON.stringify(entrada)} → ${JSON.stringify(esperado)}`);
  } catch (e) {
    fallas++;
    console.log(`✖ ${JSON.stringify(entrada)}: ${e.message}`);
  }
}
console.log(`\n${casos.length - fallas}/${casos.length} casos OK`);
process.exit(fallas === 0 ? 0 : 1);
