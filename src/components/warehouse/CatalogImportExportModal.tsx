import React, { useRef, useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCode,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { downloadInventoryExcelBackup } from '../../services/inventoryBackupService';

interface CatalogImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CatalogImportExportModal: React.FC<CatalogImportExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    products,
    warehouses,
    importCatalogFromExcelRows,
    importCatalogFromJSON,
    logAudit,
  } = useERP();
  const { currentUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [importStatus, setImportStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);

  if (!isOpen) return null;

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: false });

      // Find first sheet with a "codigo" column
      let foundRows: any[] | null = null;
      for (const sheetName of workbook.SheetNames) {
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        if (
          json.length > 0 &&
          Object.keys(json[0] as object).some((k) =>
            k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('codigo')
          )
        ) {
          foundRows = json;
          break;
        }
      }

      if (!foundRows || foundRows.length === 0) {
        setImportStatus({
          text: 'No se encontró ninguna hoja con la columna obligatoria "Código" o "Codigo".',
          ok: false,
        });
        setIsProcessing(false);
        return;
      }

      const res = importCatalogFromExcelRows(foundRows);
      if (res.success) {
        setImportStatus({
          text: `✅ ${res.importedCount} materiales y ubicaciones importados exitosamente desde ${file.name}.`,
          ok: true,
        });
      } else {
        setImportStatus({ text: `❌ ${res.error}`, ok: false });
      }
    } catch (err: any) {
      setImportStatus({ text: `❌ Error al procesar archivo Excel: ${err.message}`, ok: false });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleJSONRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = importCatalogFromJSON(json);
      if (res.success) {
        setImportStatus({
          text: '✅ Respaldo JSON restaurado exitosamente en el sistema en tiempo real.',
          ok: true,
        });
      } else {
        setImportStatus({ text: `❌ ${res.error}`, ok: false });
      }
    } catch (err: any) {
      setImportStatus({ text: `❌ Archivo JSON no válido: ${err.message}`, ok: false });
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Codigo': 'PRE-1080',
        'Titulo': 'Preformado de Lana Mineral 2" x 1.5"',
        'Unidad de Medida': 'TRAMO',
        'Categoria 1': 'Aislamiento Térmico',
        'Nave': 'N1',
        'Rack': 'R-01',
        'Pasillo': 'P-02',
        'Nivel': 'Niv-03',
        'Costo': 285.50,
        'Precio': 420.00,
        'Stock Inicial': 100,
      },
      {
        'Codigo': 'CUB-2050',
        'Titulo': 'Cubre Manguera de Silicón Alta Temperatura',
        'Unidad de Medida': 'METRO',
        'Categoria 1': 'Protección Térmica',
        'Nave': 'N1',
        'Rack': 'R-04',
        'Pasillo': 'P-01',
        'Nivel': 'Niv-02',
        'Costo': 95.00,
        'Precio': 165.00,
        'Stock Inicial': 500,
      },
      {
        'Codigo': 'ESP-9010',
        'Titulo': 'Espuma Elastomérica Aislante 1/2"',
        'Unidad de Medida': 'TRAMO',
        'Categoria 1': 'Espumas y Sellos',
        'Nave': 'N2',
        'Rack': 'R-02',
        'Pasillo': 'P-03',
        'Nivel': 'Niv-01',
        'Costo': 110.00,
        'Precio': 180.00,
        'Stock Inicial': 250,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Catalogo_Almacen');
    XLSX.writeFile(workbook, 'Plantilla_Catalogo_Ubicaciones_CONSCORE.xlsx');
  };

  const handleDownloadBackupExcel = async () => {
    if (isGeneratingBackup) return;

    setIsGeneratingBackup(true);
    setImportStatus({
      text: '⏳ Generando archivo Excel...',
      ok: true,
    });

    try {
      const res = await downloadInventoryExcelBackup({
        products,
        warehouses,
        currentUser: {
          id: currentUser?.id || 'USR-ANON',
          name: currentUser?.name || 'Operador de Inventario',
          role: currentUser?.role || 'ALMACEN',
        },
        scopeWarehouseId: 'TODOS',
        scopeWarehouseName: 'Todos los Almacenes y CEDIS',
        onAuditLog: (entry) => {
          if (logAudit) {
            logAudit(
              entry.action,
              entry.module,
              entry.entityType,
              entry.entityId,
              undefined,
              JSON.stringify(entry.details)
            );
          }
        },
      });

      if (res.success) {
        setImportStatus({
          text: `✅ Respaldo generado y descargado exitosamente: ${res.filename} (${res.totalRows} ubicaciones registradas, ${res.totalUnits} piezas físicas). Formato: Excel .xlsx.`,
          ok: true,
        });
      } else {
        setImportStatus({
          text: `❌ ${res.error || 'No fue posible generar el respaldo de inventario.'}`,
          ok: false,
        });
      }
    } catch (err: any) {
      console.error('[CatalogImportExportModal] Error en respaldo Excel:', err);
      setImportStatus({
        text: `❌ No fue posible generar el respaldo de inventario: ${err?.message || 'Error técnico interno'}`,
        ok: false,
      });
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900">Importación, Respaldos y Excel</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {importStatus && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium ${
              importStatus.ok
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {importStatus.text}
          </div>
        )}

        <div className="space-y-4">
          {/* Section 1: Excel Import */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-blue-600" />
                Cargar Catálogo y Ubicaciones (Excel)
              </h4>
              <button
                onClick={handleDownloadTemplate}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Descargar Plantilla
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Soporta archivos .xlsx, .xls o .csv con columnas de Código, Título, Nave, Rack, Pasillo y Nivel.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
            >
              {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isProcessing ? 'Procesando archivo...' : 'Seleccionar Archivo Excel'}
            </button>
          </div>

          {/* Section 2: Respaldo Oficial de Inventario en Excel (.xlsx) — Observación 20 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Respaldo Oficial de Inventario (Excel .xlsx)
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                .XLSX REAL
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Genera y descarga un libro de Excel (.xlsx) oficial con todos los materiales, ubicaciones físicas multialmacén, disponibilidad calculada, stocks mínimos y resumen ejecutivo de auditoría.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="btn-descargar-respaldo-inventario"
                aria-label="Descargar respaldo"
                onClick={handleDownloadBackupExcel}
                disabled={isGeneratingBackup}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                {isGeneratingBackup ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Generando archivo Excel...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="h-4 w-4 text-white" />
                    <span>Descargar respaldo</span>
                  </>
                )}
              </button>

              <input
                type="file"
                ref={jsonInputRef}
                accept=".json"
                onChange={handleJSONRestore}
                className="hidden"
              />

              <button
                onClick={() => jsonInputRef.current?.click()}
                className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                title="Restaura un archivo técnico de inventario previamente estructurado"
              >
                <ArrowUpFromLine className="h-4 w-4 text-slate-500" />
                <span>Restaurar Catálogo</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
