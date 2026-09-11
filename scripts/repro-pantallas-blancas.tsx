/**
 * Reproduce las pantallas en blanco reportadas en la bitácora de observaciones.
 *
 * Renderiza cada vista con los mismos datos que recibe dentro de la aplicación
 * y reporta la excepción exacta, en lugar de tener que ir tocando pestañas en
 * el navegador para ver un fondo blanco sin mensaje.
 *
 *   npx tsx scripts/repro-pantallas-blancas.tsx
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { initialGovernanceData } from '../src/services/governanceRiskComplianceInitialData';

import { ComplianceCenterView } from '../src/components/governance/ComplianceCenterView';
import { CorporateDocumentManagerView } from '../src/components/governance/CorporateDocumentManagerView';
import { ExecutiveAuditCenterView } from '../src/components/governance/ExecutiveAuditCenterView';
import { EnterpriseAlertEngineView } from '../src/components/governance/EnterpriseAlertEngineView';
import { AnomalyDetectionView } from '../src/components/governance/AnomalyDetectionView';
import { GovernanceExecutiveActionView } from '../src/components/governance/GovernanceExecutiveActionView';

const g: any = initialGovernanceData;

const casos: Array<{ obs: string; nombre: string; render: () => React.ReactElement }> = [
  {
    obs: '31',
    nombre: 'Compliance y Evidencias',
    render: () =>
      React.createElement(ComplianceCenterView as any, {
        obligations: g.obligations,
        evidenceList: g.evidenceList,
        actionPlans: g.actionPlans,
      }),
  },
  {
    obs: '32',
    nombre: 'Bóveda documental',
    render: () => React.createElement(CorporateDocumentManagerView as any, { documents: g.documents }),
  },
  {
    obs: '33',
    nombre: 'Auditoría transversal',
    render: () =>
      React.createElement(ExecutiveAuditCenterView as any, {
        auditLogs: [],
        sampleTraces: g.sampleTraces,
      }),
  },
  {
    obs: '34',
    nombre: 'Motor de alertas',
    render: () =>
      React.createElement(EnterpriseAlertEngineView as any, {
        alerts: g.alerts,
        onAcknowledgeAlert: () => {},
        onResolveAlert: () => {},
      }),
  },
  {
    obs: '35',
    nombre: 'Anomalías estadísticas',
    render: () => React.createElement(AnomalyDetectionView as any, { anomalies: g.anomalies }),
  },
  {
    obs: '36',
    nombre: 'Acciones priorizadas',
    render: () =>
      React.createElement(GovernanceExecutiveActionView as any, {
        actions: g.executiveActions,
        onCompleteAction: () => {},
      }),
  },
];

let fallos = 0;

for (const caso of casos) {
  process.stdout.write(`Obs ${caso.obs} — ${caso.nombre}: `);
  try {
    const html = renderToString(caso.render());
    console.log(`renderiza (${html.length} caracteres)`);
  } catch (err: any) {
    fallos++;
    console.log('FALLA');
    console.log(`   ${err?.message}`);
    const linea = String(err?.stack || '')
      .split('\n')
      .find((l: string) => l.includes('/src/'));
    if (linea) console.log(`   ${linea.trim()}`);
    console.log();
  }
}

console.log(`\n${fallos} de ${casos.length} vistas fallan al renderizar.`);
