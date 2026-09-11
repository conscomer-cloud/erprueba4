import { ProductReturnService } from '../services/productReturnService';

console.log('Iniciando Certificación E2E de Devoluciones (Observación 15)...\n');

const suiteResult = ProductReturnService.runObservacion15Certification();

console.log(suiteResult.structuredReport);

console.log('\n--- RESUMEN DE EJECUCIÓN ---');
console.log(`Total pruebas: ${suiteResult.totalTests}`);
console.log(`Aprobadas: ${suiteResult.passedTests}`);
console.log(`Fallidas: ${suiteResult.failedTests}`);
console.log(`Fallas Críticas: ${suiteResult.criticalFails}`);
console.log(`Resultado Global: ${suiteResult.passed ? 'COMPLETADO A ESPERA DE REVISIÓN' : 'POR CORREGIR'}`);

if (!suiteResult.passed) {
  process.exit(1);
} else {
  process.exit(0);
}
