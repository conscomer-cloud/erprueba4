/**
 * Verifica el catálogo de códigos postales SEPOMEX.
 *
 *   npx tsx scripts/verificar-zipcodes.ts
 */

import { lookupZipCode, isZipCatalogAvailable } from '../server/services/zipCodeService';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!ok) fallos++;
};

console.log('\n=== Disponibilidad ===');
check('el catálogo carga sin excepción', isZipCatalogAvailable());

console.log('\n=== Casos conocidos ===');
const cdmx = lookupZipCode('01030');
check('CP 01030 existe', cdmx !== null);
check('CP 01030 es Ciudad de México', cdmx?.state === 'Ciudad de México', cdmx?.state);
check('CP 01030 municipio Álvaro Obregón', cdmx?.municipality === 'Álvaro Obregón', cdmx?.municipality);
check('CP 01030 tiene 2 asentamientos (Florida y Axotla)', cdmx?.settlements.length === 2,
  cdmx?.settlements.map((s) => s.name).join(', '));

const tepeji = lookupZipCode('42852');
check('CP 42852 (Tepeji del Río) existe', tepeji !== null);
check('CP 42852 es Hidalgo', tepeji?.state === 'Hidalgo', tepeji?.state);
check('CP 42852 municipio Tepeji del Río de Ocampo', tepeji?.municipality === 'Tepeji del Río de Ocampo');

console.log('\n=== Casos límite ===');
check('CP inexistente devuelve null, no revienta', lookupZipCode('00000') === null);
check('CP con letras devuelve null', lookupZipCode('abcde') === null);
check('CP corto devuelve null', lookupZipCode('123') === null);
check('CP largo devuelve null', lookupZipCode('1234567') === null);
check('cadena vacía devuelve null', lookupZipCode('') === null);
check('con espacios se recorta antes de validar', lookupZipCode(' 01030 ') !== null);

console.log('\n=== Formato de la respuesta ===');
if (cdmx) {
  check('zipCode se devuelve tal cual se pidió', cdmx.zipCode === '01030');
  check('cada asentamiento trae nombre y tipo', cdmx.settlements.every((s) => s.name && s.type));
  check('city no queda vacío (usa municipio si no hay ciudad propia)', !!cdmx.city);
}

console.log(`\n${fallos === 0 ? 'Todas las comprobaciones pasan' : `${fallos} comprobación(es) fallan`}.`);
process.exit(fallos === 0 ? 0 : 1);
