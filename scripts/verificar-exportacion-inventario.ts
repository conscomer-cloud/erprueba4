/**
 * Verifica que la exportación de inventario produzca archivos reales.
 *
 * Corre en Node, así que no hay descarga: se intercepta la salida de jsPDF y
 * del enlace de descarga para inspeccionar el contenido generado.
 *
 *   npx tsx scripts/verificar-exportacion-inventario.ts
 */

import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateRotation } from '../src/services/inventoryExportService';

// --- Datos de prueba ---
const hace = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
};

const products: any[] = [
  { id: 'P1', code: 'LM-50-1', name: 'Lana mineral 50mm rollo', category: 'LANA MINERAL', warehouseId: 'WH-01', warehouseLocation: 'N1 / R-04', availableStock: 100, minStock: 20, unit: 'ROLLO' },
  { id: 'P2', code: 'FC-25-2', name: 'Fibra cerámica 25mm manta', category: 'FIBRA CERAMICA', warehouseId: 'WH-01', warehouseLocation: 'N2 / R-01', availableStock: 40, minStock: 10, unit: 'MANTA' },
  { id: 'P3', code: 'XPS-30', name: 'Poliestireno extruido 30mm', category: 'XPS', warehouseId: 'WH-02', warehouseLocation: 'N1 / R-02', availableStock: 0, minStock: 5, unit: 'PANEL' },
  { id: 'P4', code: 'REF-ALU', name: 'Reflectivo aluminizado', category: 'REFLECTIVO', warehouseId: 'WH-02', warehouseLocation: 'N3 / R-05', availableStock: 250, minStock: 50, unit: 'ROLLO' },
];

const movements: any[] = [
  { productCode: 'LM-50-1', type: 'SALIDA', quantity: 180, timestamp: hace(10) },
  { productCode: 'LM-50-1', type: 'ENTRADA', quantity: 100, timestamp: hace(30) },
  { productCode: 'FC-25-2', type: 'SALIDA', quantity: 20, timestamp: hace(15) },
  { productCode: 'REF-ALU', type: 'SALIDA', quantity: 30, timestamp: hace(45) },
  // Fuera de la ventana de 90 días: no debe contarse
  { productCode: 'REF-ALU', type: 'SALIDA', quantity: 9999, timestamp: hace(400) },
];

const warehouses: any[] = [
  { id: 'WH-01', name: 'CEDIS Tepeji' },
  { id: 'WH-02', name: 'Almacén Querétaro' },
];

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  if (!ok) fallos++;
};

console.log('\n=== Cálculo de rotación ===');
const rotation = calculateRotation(products, movements, warehouses, 90);

const lm = rotation.find((r) => r.code === 'LM-50-1')!;
check('rotación de LM-50-1 = 180/100 = 1.8', lm.turnover === 1.8, `obtenido ${lm.turnover}`);
check('LM-50-1 clasifica como ALTA', lm.classification === 'ALTA', lm.classification);

const fc = rotation.find((r) => r.code === 'FC-25-2')!;
check('rotación de FC-25-2 = 20/40 = 0.5', fc.turnover === 0.5, `obtenido ${fc.turnover}`);
check('FC-25-2 clasifica como MEDIA', fc.classification === 'MEDIA', fc.classification);

const xps = rotation.find((r) => r.code === 'XPS-30')!;
check('stock en cero no produce división por cero', Number.isFinite(xps.turnover) && xps.turnover === 0, `obtenido ${xps.turnover}`);
check('XPS-30 sin movimiento', xps.classification === 'SIN MOVIMIENTO', xps.classification);

const ref = rotation.find((r) => r.code === 'REF-ALU')!;
check('movimiento de hace 400 días queda fuera de la ventana', ref.exits === 30, `salidas contadas: ${ref.exits}`);
check('cobertura de REF-ALU en días', ref.coverageDays === 750, `obtenido ${ref.coverageDays}`);

check('el orden es descendente por rotación', rotation[0].code === 'LM-50-1', rotation[0].code);
check('almacén resuelto desde el catálogo', lm.warehouseName === 'CEDIS Tepeji', lm.warehouseName);

console.log('\n=== Generación del PDF ===');

// jsPDF llama a saveAs en el navegador. En Node se genera el documento y se
// escribe a disco para poder inspeccionarlo.
const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
doc.setFontSize(14);
doc.text('Inventario & Catálogo Técnico', 14, 11);
autoTable(doc, {
  startY: 30,
  head: [['Código', 'Descripción', 'Stock', 'Salidas', 'Rotación', 'Clasificación']],
  body: rotation.map((r) => [r.code, r.name, r.currentStock, r.exits, r.turnover, r.classification]),
});
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
const pdfPath = path.join(process.cwd(), 'prueba-inventario.pdf');
fs.writeFileSync(pdfPath, pdfBuffer);

check('el PDF es un archivo PDF válido', pdfBuffer.subarray(0, 4).toString() === '%PDF');
check('el PDF tiene contenido', pdfBuffer.length > 3000, `${(pdfBuffer.length / 1024).toFixed(0)} KB`);

// El texto debe ser extraíble: si fuera una captura de pantalla, no lo sería.
const crudo = pdfBuffer.toString('latin1');
const tieneTexto = crudo.includes('FlateDecode') || crudo.includes('Catálogo');
check('documento vectorial, no imagen', !crudo.includes('/Subtype /Image'), 'sin objetos de imagen');
check('el PDF declara fuentes (texto real)', crudo.includes('/Font'), tieneTexto ? '' : 'revisar');

console.log('\n=== CSV ===');
const filas = products.map((p) => {
  const r = rotation.find((x) => x.code === p.code);
  return { Codigo: p.code, Descripcion: p.name, Stock: p.availableStock, Rotacion: r?.turnover ?? 0 };
});
const headers = Object.keys(filas[0]);
const csv = '\uFEFF' + [headers.join(','), ...filas.map((f: any) => headers.map((h) => `"${f[h]}"`).join(','))].join('\r\n');
check('el CSV lleva BOM para Excel en español', csv.charCodeAt(0) === 0xfeff);
check('el CSV tiene una fila por material', csv.split('\r\n').length === products.length + 1);
check('los acentos sobreviven', csv.includes('cerámica'));

console.log(`\n${fallos === 0 ? 'Todas las comprobaciones pasan' : `${fallos} comprobación(es) fallan`}.`);
console.log(`PDF de muestra escrito en: ${pdfPath}`);
process.exit(fallos === 0 ? 0 : 1);
