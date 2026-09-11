/**
 * @license
 * CONSCORE ERP IA - Corporate Governance Center View
 * FASE 13 - Políticas Corporativas, Comités, Minutas, Acuerdos y Delegaciones de Autoridad
 */

import React, { useState } from 'react';
import {
  FileText,
  Users,
  CheckSquare,
  Clock,
  Shield,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Building,
  UserCheck,
  Award,
} from 'lucide-react';
import {
  CorporatePolicy,
  CorporateCommittee,
  CommitteeAgreement,
} from '../../types/governanceRiskComplianceTypes';

interface CorporateGovernanceCenterViewProps {
  policies: CorporatePolicy[];
  committees: CorporateCommittee[];
  onAddPolicy?: (policy: CorporatePolicy) => void;
}

export const CorporateGovernanceCenterView: React.FC<CorporateGovernanceCenterViewProps> = ({
  policies,
  committees,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('TODAS');
  const [selectedPolicy, setSelectedPolicy] = useState<CorporatePolicy | null>(null);

  const filteredPolicies = policies.filter((p) => {
    const matchesSearch =
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedArea === 'TODAS' || p.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  const areas = ['TODAS', ...new Set(policies.map((p) => p.area))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building className="h-6 w-6 text-blue-600" />
            Gobierno Corporativo & Marco Institucional
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Políticas corporativas vigentes, control de comités estatutarios y seguimiento de acuerdos directivos de CONSCORE.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-800">
            {policies.length} Políticas Vigentes
          </span>
          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800">
            {committees.length} Comités Directivos
          </span>
        </div>
      </div>

      {/* Comités Corporativos */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          Comités Estatutarios y Acuerdos de Sesión
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {committees.map((com) => (
            <div
              key={com.id}
              className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                      {com.code}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                      Sesión {com.frequency}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1.5">{com.name}</h4>
                </div>
              </div>

              <p className="text-xs text-slate-600">{com.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Presidente</span>
                  <b>{com.presidentName}</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Secretario de Actas</span>
                  <b>{com.secretaryName}</b>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Última Sesión: <b>{com.lastSessionDate}</b></span>
                  <span>Próxima: <b>{com.nextSessionDate}</b></span>
                </div>
              </div>

              {/* Acuerdos */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Acuerdos y Compromisos ({com.agreements.length})
                </span>
                {com.agreements.map((agr) => (
                  <div
                    key={agr.id}
                    className="rounded bg-white p-2.5 border border-slate-200 text-xs flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-slate-800 text-[11px]">
                        {agr.agreementNumber}:
                      </span>{' '}
                      <span className="text-slate-700">{agr.description}</span>
                      <div className="text-[10px] text-slate-400">
                        Responsable: <b>{agr.responsibleName}</b> · Límite: <b>{agr.targetDate}</b>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                        agr.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {agr.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Catálogo de Políticas Corporativas */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Directorio de Políticas y Procedimientos Corporativos
            </h3>
            <p className="text-xs text-slate-500">
              Documentos normativos de cumplimiento obligatorio aprobados por Dirección General.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar política..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
              />
            </div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map((pol) => (
            <div
              key={pol.id}
              onClick={() => setSelectedPolicy(pol)}
              className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50/50 p-4 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  {pol.code} v{pol.version}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {pol.status}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                {pol.name}
              </h4>

              <p className="text-[11px] text-slate-600 line-clamp-2">
                {pol.description}
              </p>

              <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[10px] text-slate-500">
                <div>Área: <b>{pol.area}</b></div>
                <div>Responsable: <b>{pol.ownerName}</b></div>
                <div>Aprobado por: <b>{pol.approverName}</b></div>
                <div>Vigencia: <b>{pol.effectiveDate} al {pol.expirationDate}</b></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Detalle de Política */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  {selectedPolicy.code} · Versión {selectedPolicy.version}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedPolicy.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Descripción y Propósito:</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                  {selectedPolicy.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Alcance</span>
                  <b>{selectedPolicy.scope}</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Frecuencia de Revisión</span>
                  <b>Cada {selectedPolicy.reviewFrequencyDays} días</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Propietario</span>
                  <b>{selectedPolicy.ownerName}</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Aprobado Por</span>
                  <b>{selectedPolicy.approverName}</b>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1.5">Controles Clave Obligatorios:</span>
                <ul className="space-y-1 pl-4 list-disc text-slate-600">
                  {selectedPolicy.keyControls.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100 flex justify-between">
                <span>Audit ID: {selectedPolicy.auditId}</span>
                <span>Documento Vault: {selectedPolicy.documentId || 'DOC-DEFAULT'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPolicy(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
