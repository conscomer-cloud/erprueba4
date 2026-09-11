import { Database } from '../server/db/database';
import { CommercialRLSService } from '../src/services/commercialRLSService';

async function main() {
  const db = new Database();

  const customers = db.getCustomers();
  const leads = db.getLeads();
  const opportunities = db.getOpportunities();
  const quotes = db.getQuotes();
  const orders = db.getOrders();
  const products = db.getProducts();

  console.log(`Loaded dataset:
    - Customers: ${customers.length}
    - Leads: ${leads.length}
    - Opportunities: ${opportunities.length}
    - Quotes: ${quotes.length}
    - Orders: ${orders.length}
    - Products: ${products.length}`);

  const report = CommercialRLSService.runCrossVendorCertification({
    customers,
    leads,
    opportunities,
    quotes,
    orders,
    products,
  });

  console.log(`\n================ CERTIFICATION SUMMARY ================`);
  console.log(`Total tests executed: ${report.totalTests}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Compliance Rate: ${report.complianceRatePct}%`);
  console.log(`Overall Success: ${report.success ? 'PASS' : 'FAIL'}`);

  console.log(`\n================ 31 MANDATORY TESTS ================`);
  report.mandatoryTests.forEach(t => {
    console.log(`[${t.status}] Test #${t.testId.toString().padStart(2, '0')} [${t.category}] ${t.description}`);
    console.log(`      ${t.details}`);
  });

  console.log(`\n================ 10 VENDORS AUDIT MATRIX ================`);
  report.results.forEach(v => {
    console.log(`[${v.status}] ${v.vendorCode} (${v.vendorName}): Custs=${v.assignedCustomers}, Quotes=${v.assignedQuotes}, Orders=${v.assignedOrders} | CrossReadBlock=${v.crossReadBlocked}, CrossWriteBlock=${v.crossWriteBlocked}, CostsStripped=${v.productCostsStripped}`);
  });
}

main().catch(console.error);
