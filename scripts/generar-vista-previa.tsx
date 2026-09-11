/**
 * Genera una vista previa estática de la aplicación.
 *
 * No es una captura de la app corriendo: no hay navegador en este entorno.
 * Lo que hace es renderizar los componentes reales del proyecto con
 * renderToString e inyectar el CSS que produjo `vite build`. El marcado y los
 * colores son los mismos que verá el navegador; lo que no hay es JavaScript,
 * así que nada responde al clic y los efectos de montaje no corren.
 *
 *   npx tsx scripts/generar-vista-previa.tsx
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';

import { initialGovernanceData } from '../src/services/governanceRiskComplianceInitialData';
import { ComplianceCenterView } from '../src/components/governance/ComplianceCenterView';
import { CorporateDocumentManagerView } from '../src/components/governance/CorporateDocumentManagerView';
import { ExecutiveAuditCenterView } from '../src/components/governance/ExecutiveAuditCenterView';
import { EnterpriseAlertEngineView } from '../src/components/governance/EnterpriseAlertEngineView';
import { AnomalyDetectionView } from '../src/components/governance/AnomalyDetectionView';
import { GovernanceExecutiveActionView } from '../src/components/governance/GovernanceExecutiveActionView';

const g: any = initialGovernanceData;
const noop = () => {};

const vistas: Array<{ obs: string; titulo: string; el: React.ReactElement }> = [
  {
    obs: '31',
    titulo: 'Compliance y Evidencias',
    el: React.createElement(ComplianceCenterView as any, {
      obligations: g.obligations,
      evidenceList: g.evidenceList,
      actionPlans: g.actionPlans,
    }),
  },
  {
    obs: '32',
    titulo: 'Bóveda documental',
    el: React.createElement(CorporateDocumentManagerView as any, { documents: g.documents }),
  },
  {
    obs: '33',
    titulo: 'Auditoría transversal',
    el: React.createElement(ExecutiveAuditCenterView as any, {
      auditLogs: [],
      sampleTraces: g.sampleTraces,
    }),
  },
  {
    obs: '34',
    titulo: 'Motor de alertas',
    el: React.createElement(EnterpriseAlertEngineView as any, {
      alerts: g.alerts,
      onAcknowledgeAlert: noop,
      onResolveAlert: noop,
    }),
  },
  {
    obs: '35',
    titulo: 'Anomalías estadísticas',
    el: React.createElement(AnomalyDetectionView as any, { anomalies: g.anomalies }),
  },
  {
    obs: '36',
    titulo: 'Acciones priorizadas',
    el: React.createElement(GovernanceExecutiveActionView as any, {
      actions: g.executiveActions,
      onCompleteAction: noop,
    }),
  },
];

// CSS producido por el build, con la paleta ya aplicada
const cssFile = fs
  .readdirSync(path.join(process.cwd(), 'dist/assets'))
  .find((f) => f.startsWith('index-') && f.endsWith('.css'));
if (!cssFile) {
  console.error('No hay CSS compilado. Corre primero: npx vite build');
  process.exit(1);
}
const css = fs.readFileSync(path.join(process.cwd(), 'dist/assets', cssFile), 'utf-8');

const secciones = vistas
  .map((v) => {
    let cuerpo: string;
    try {
      cuerpo = renderToString(v.el);
    } catch (err: any) {
      cuerpo = `<div class="p-6 bg-red-50 border border-red-200 rounded text-red-900 text-sm">
        Falla al renderizar: ${String(err?.message || err)}
      </div>`;
    }
    return `
    <section style="margin-bottom:48px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <span style="font-size:11px;font-weight:700;letter-spacing:.06em;background:#05406a;color:#fff;padding:4px 10px;border-radius:6px">OBS ${v.obs}</span>
        <h2 style="font-size:17px;font-weight:700;color:#0f172a;margin:0">${v.titulo}</h2>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:14px;padding:20px;background:#fff">${cuerpo}</div>
    </section>`;
  })
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CONSCORE ERP — vista previa estática</title>
<style>${css}</style>
<style>
  body { background:#f1f5f9; margin:0; font-family: ui-sans-serif, system-ui, sans-serif; }
  .envoltura { max-width: 1180px; margin: 0 auto; padding: 28px 20px 60px; }
</style>
</head>
<body>
<div class="envoltura">

  <header style="background:#03253b;border-radius:14px;padding:20px 22px;margin-bottom:14px;display:flex;align-items:center;gap:14px">
    <div style="width:40px;height:40px;border-radius:9px;background:#e4a734;color:#03253b;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:19px">C</div>
    <div>
      <div style="color:#fff;font-size:17px;font-weight:700;line-height:1.2">CONSCORE ERP IA</div>
      <div style="color:#a4c6de;font-size:12px">Gobierno Corporativo, Riesgos y Cumplimiento</div>
    </div>
    <div style="margin-left:auto;display:flex;gap:8px">
      <span style="background:#065994;color:#fff;font-size:11px;font-weight:700;padding:7px 13px;border-radius:7px">Nueva revisión</span>
      <span style="background:#e4a734;color:#4a2f00;font-size:11px;font-weight:700;padding:7px 13px;border-radius:7px">Autorizar</span>
    </div>
  </header>

  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:11px;padding:13px 16px;margin-bottom:30px">
    <div style="font-size:13px;font-weight:700;color:#7c2d12;margin-bottom:3px">Vista previa estática — VALIDACIÓN MANUAL: PENDIENTE</div>
    <div style="font-size:12px;color:#9a3412;line-height:1.6">
      Renderizada desde los componentes reales del proyecto con el CSS del build.
      El marcado y los colores son los del navegador, pero no hay JavaScript:
      nada responde al clic, los filtros y modales no operan, y los efectos de
      montaje no se ejecutan. Esto no sustituye la prueba en la app desplegada.
    </div>
  </div>

${secciones}

</div>
</body>
</html>`;

const salida = path.join(process.cwd(), 'vista-previa-gobierno.html');
fs.writeFileSync(salida, html, 'utf-8');
console.log(`Vista previa generada: ${salida} (${(html.length / 1024).toFixed(0)} KB)`);
