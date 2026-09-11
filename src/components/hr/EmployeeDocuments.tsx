import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { useAuth } from '../../context/AuthContext';
import { EmployeeDocument, DocumentType } from '../../types/erp';

export const EmployeeDocuments: React.FC = () => {
  const { employeeDocuments, employees, uploadEmployeeDocument } = useERP();
  const { can, user } = useAuth();
  const canManageHR = can('RH', 'EDITAR') || can('RH', 'CREAR') || user?.role === 'ADMINISTRADOR';

  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || '');
  const [docType, setDocType] = useState<DocumentType>('CONTRATO_LABORAL');
  const [docTitle, setDocTitle] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');

  const filteredDocuments = employeeDocuments.filter((doc) => {
    const matchesStatus = selectedStatus === 'ALL' || doc.status === selectedStatus;
    const matchesCategory = selectedCategory === 'ALL' || doc.type === selectedCategory;
    const matchesSearch =
      (doc.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.id || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !docTitle) return;

    uploadEmployeeDocument({
      employeeId: selectedEmployeeId,
      type: docType,
      title: docTitle,
      fileUrl: `/documents/expedientes/${selectedEmployeeId}-${docType.toLowerCase()}.pdf`,
      fileName: `${docTitle.replace(/\s+/g, '_')}.pdf`,
      expirationDate: expirationDate || undefined,
      notes,
    });

    setIsUploadModalOpen(false);
    setDocTitle('');
    setNotes('');
  };

  const expiringCount = employeeDocuments.filter((d) => d.status === 'POR_VENCER').length;
  const expiredCount = employeeDocuments.filter((d) => d.status === 'VENCIDO').length;
  const validCount = employeeDocuments.filter((d) => d.status === 'VIGENTE').length;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Documentos Vigentes
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{validCount}</span>
            <span className="text-xs text-emerald-600">expedientes al 100%</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Por Vencer (&lt; 30 Días)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{expiringCount}</span>
            <span className="text-xs text-amber-600">requieren renovación</span>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-red-800">
            Documentos Vencidos
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-700">{expiredCount}</span>
            <span className="text-xs text-red-600">alerta crítica de cumplimiento</span>
          </div>
        </div>
      </div>

      {/* Action Header & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Expediente Digital & Cumplimiento Normativo
            </h2>
            <p className="text-xs text-slate-500">
              Control de documentos legales, contratos, licencias de conducir, constancias DC-3 y exámenes médicos
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManageHR && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                Cargar Documento
              </button>
            )}
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por colaborador o título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Todos los Tipos de Documento</option>
              <option value="CONTRATO_LABORAL">Contratos Laborales</option>
              <option value="LICENCIA_CONDUCIR">Licencias de Chofer</option>
              <option value="EXAMEN_MEDICO">Exámenes Médicos</option>
              <option value="CURP_RFC_NSS">Constancias Fiscales / IMSS</option>
              <option value="CERTIFICACION_DC3">Constancias DC-3 STPS</option>
              <option value="IDENTIFICACION_OFICIAL">Identificaciones INE / Pasaporte</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Todos los Estados de Vigencia</option>
              <option value="VIGENTE">VIGENTE</option>
              <option value="POR_VENCER">POR VENCER (&lt; 30 días)</option>
              <option value="VENCIDO">VENCIDO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Colaborador</th>
                <th className="px-4 py-3">Tipo / Categoría</th>
                <th className="px-4 py-3">Fecha de Carga</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Archivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{doc.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{doc.id}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{doc.employeeName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{doc.employeeId}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 border border-slate-200">
                      {doc.type}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                    {doc.uploadedAt || '2026-01-10'}
                  </td>

                  <td className="px-4 py-3 font-mono text-[11px]">
                    {doc.expirationDate ? (
                      <span
                        className={
                          doc.status === 'VENCIDO'
                            ? 'font-bold text-red-600'
                            : doc.status === 'POR_VENCER'
                            ? 'font-bold text-amber-600'
                            : 'text-slate-700'
                        }
                      >
                        {doc.expirationDate}
                      </span>
                    ) : (
                      <span className="text-slate-400">Permanente</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                        doc.status === 'VIGENTE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'POR_VENCER'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => alert(`Visualizando expediente digital: ${doc.title} (${doc.fileName || 'documento.pdf'})`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Upload Document */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Cargar Documento a Expediente Digital
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador *</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.department || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Documento</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                >
                  <option value="CONTRATO_LABORAL">Contrato Laboral por Tiempo Indeterminado</option>
                  <option value="LICENCIA_CONDUCIR">Licencia de Chofer Tipo Federal/Estatal</option>
                  <option value="EXAMEN_MEDICO">Examen Médico de Aptitud Laboral</option>
                  <option value="CURP_RFC_NSS">Constancia de Situación Fiscal / IMSS</option>
                  <option value="CERTIFICACION_DC3">Constancia de Competencias Laborales DC-3</option>
                  <option value="IDENTIFICACION_OFICIAL">Credencial para Votar (INE) / Pasaporte</option>
                  <option value="COMPROBANTE_DOMICILIO">Comprobante de Domicilio Vigente</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título del Documento *</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ej. Licencia Chofer Tipo B Vigente"
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fecha de Expiración / Vigencia (Opcional)</label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas / Folio</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Folio de documento o comentarios de RH..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  Guardar en Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
