/**
 * Catálogo de códigos postales de México, para autocompletar dirección.
 *
 * Datos de SEPOMEX (Servicio Postal Mexicano), tomados del repositorio
 * https://github.com/d3249/mexico_zipcodes, que a su vez los toma del portal
 * oficial de Correos de México. Corte: marzo de 2019. SEPOMEX no publica una
 * API pública, así que el catálogo se compiló una sola vez a un JSON compacto
 * (server/data/zipcodes-mx.json) en vez de depender de un tercero en cada
 * consulta.
 *
 * El catálogo vive solo en el servidor: son 5 MB que no tiene sentido enviar
 * al navegador. El cliente pide un código postal y recibe únicamente el
 * resultado de esa consulta.
 */

import fs from 'fs';
import path from 'path';

interface ZipCatalog {
  version: string;
  /** Nombre del estado, indexado por posición. */
  estados: string[];
  /** [índice de estado, nombre del municipio], indexado por posición. */
  municipios: [number, string][];
  /** CP -> [índice de municipio, ciudad, [[asentamiento, tipo], ...]] */
  cps: Record<string, [number, string, [string, string][]]>;
}

export interface ZipLookupResult {
  zipCode: string;
  state: string;
  municipality: string;
  city: string;
  settlements: { name: string; type: string }[];
}

let catalog: ZipCatalog | null = null;

function loadCatalog(): ZipCatalog {
  if (catalog) return catalog;

  // En desarrollo el archivo vive en server/data. En producción, dist/server.cjs
  // corre desde la raíz del proyecto, pero el JSON solo existe si el build lo
  // copió a dist/server/data (ver el script "build" de package.json): esbuild
  // empaqueta el código, no los archivos que se leen por ruta en tiempo de
  // ejecución. Se prueban ambas rutas para que el servicio funcione en los
  // dos modos sin depender de dónde se ejecute el proceso.
  const candidatos = [
    path.join(process.cwd(), 'dist', 'server', 'data', 'zipcodes-mx.json'),
    path.join(process.cwd(), 'server', 'data', 'zipcodes-mx.json'),
  ];
  const filePath = candidatos.find((p) => fs.existsSync(p));
  if (!filePath) {
    throw new Error(
      'No se encontró zipcodes-mx.json. En producción, confirma que "npm run build" copió ' +
      'server/data/zipcodes-mx.json a dist/server/data/.'
    );
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  catalog = JSON.parse(raw);
  return catalog!;
}

export function isZipCatalogAvailable(): boolean {
  try {
    loadCatalog();
    return true;
  } catch {
    return false;
  }
}

/** Consulta un código postal exacto. Devuelve null si no existe en el catálogo. */
export function lookupZipCode(zipCode: string): ZipLookupResult | null {
  const cp = String(zipCode || '').trim();
  if (!/^\d{5}$/.test(cp)) return null;

  const cat = loadCatalog();
  const entry = cat.cps[cp];
  if (!entry) return null;

  const [municipalityIdx, city, settlements] = entry;
  const [stateIdx, municipality] = cat.municipios[municipalityIdx];
  const state = cat.estados[stateIdx];

  return {
    zipCode: cp,
    state,
    municipality,
    city: city || municipality,
    settlements: settlements.map(([name, type]) => ({ name, type })),
  };
}
