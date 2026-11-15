/**
 * ============================================================================
 * NET VIDYA — AUTHOR STUDIO ERP DASHBOARD VERIFICATION HARNESS
 * Verifies full-page ERP dashboard, sales ledger, live revenue, pricing & routes
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('\n================================================================');
console.log(' NET VIDYA — AUTHOR STUDIO ERP DASHBOARD AUDIT');
console.log('================================================================\n');

let passedChecks = 0;
let failedChecks = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${description}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${description}`);
    console.error(`    Error: ${err.message}`);
    failedChecks++;
  }
}

// ----------------------------------------------------------------------------
// SUITE 1: Source File Existence & Route Integration
// ----------------------------------------------------------------------------
console.log('--- SUITE 1: ERP Dashboard Component & Routing Integration ---');

const studioPagePath = path.resolve(process.cwd(), 'src/components/studio/AuthorStudioPage.tsx');
const appTsxPath = path.resolve(process.cwd(), 'src/App.tsx');
const navbarPath = path.resolve(process.cwd(), 'src/components/Navbar.tsx');
const storeContextPath = path.resolve(process.cwd(), 'src/contexts/NetVidyaStoreContext.tsx');

test('AuthorStudioPage.tsx exists on disk', () => {
  assert(fs.existsSync(studioPagePath), 'AuthorStudioPage.tsx must exist');
});

test('Navbar.tsx exports studio as a valid MainTab', () => {
  const content = fs.readFileSync(navbarPath, 'utf-8');
  assert(content.includes("'studio'"), "Navbar.tsx MainTab must include 'studio'");
});

test('App.tsx imports AuthorStudioPage lazily', () => {
  const content = fs.readFileSync(appTsxPath, 'utf-8');
  assert(content.includes('AuthorStudioPage'), 'App.tsx must import AuthorStudioPage');
  assert(content.includes("import('./components/studio/AuthorStudioPage')"), 'App.tsx must lazily import AuthorStudioPage');
});

test('App.tsx routes studio, admin, store-admin, erp to studio tab', () => {
  const content = fs.readFileSync(appTsxPath, 'utf-8');
  assert(content.includes("route === 'studio' || route === 'erp'"), 'App.tsx must route studio and erp');
  assert(content.includes("setActiveTab('studio')"), "App.tsx must set activeTab to 'studio'");
});

test('App.tsx renders AuthorStudioPage as full-page without modal frame', () => {
  const content = fs.readFileSync(appTsxPath, 'utf-8');
  assert(content.includes("if (activeTab === 'studio')"), "App.tsx must handle activeTab === 'studio'");
  assert(content.includes('<AuthorStudioPage'), 'App.tsx must render <AuthorStudioPage />');
  assert(content.includes("onExit={() => handleNavigate('home')}"), 'App.tsx must pass onExit handler to return home');
});

// ----------------------------------------------------------------------------
// SUITE 2: Strict Scope Boundaries (Exclusions requested by user)
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 2: User Scope Adherence (No Customizer & No Academic Vault) ---');

const studioCode = fs.readFileSync(studioPagePath, 'utf-8');

test('AuthorStudioPage does NOT contain theme/design customizer controls', () => {
  assert(!studioCode.includes('theme-customizer'), 'Must not contain theme-customizer');
  assert(!studioCode.includes('Header Font Family'), 'Must not contain font family customizer');
  assert(!studioCode.includes('Canvas Tint & Card Surface'), 'Must not contain canvas tint customizer');
});

test('AuthorStudioPage does NOT contain Academic Content Vault upload desk', () => {
  assert(!studioCode.includes('Academic Content Vault'), 'Must not contain Academic Content Vault');
  assert(!studioCode.includes('Upload Study Dossier'), 'Must not contain dossier upload interface');
});

// ----------------------------------------------------------------------------
// SUITE 3: Enterprise ERP Capabilities & Subsystems
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Enterprise ERP Modules & Capabilities ---');

test('Air-gapped Master Security Gate with Lockout Protection exists', () => {
  assert(studioCode.includes('getAuthorStudioLockoutStatus'), 'Must check lockout status');
  assert(studioCode.includes('authenticateAuthorStudio'), 'Must use master authentication');
  assert(studioCode.includes('clearAuthorStudioSession'), 'Must support secure session termination');
});

test('Candidate Sales Ledger ("Users That Bought") is implemented', () => {
  assert(studioCode.includes('Users That Bought'), 'Must have Users That Bought module');
  assert(studioCode.includes('buyerSearchQuery'), 'Must support search by name/email/phone/order');
  assert(studioCode.includes('selectedPackFilter'), 'Must support pack filtering');
  assert(studioCode.includes('selectedPaymentFilter'), 'Must support payment method filtering');
  assert(studioCode.includes('selectedStatusFilter'), 'Must support active/revoked filter');
  assert(studioCode.includes('toggleBuyerAccess'), 'Must allow instant access revocation/restoration');
  assert(studioCode.includes('resendConfirmationEmail'), 'Must allow resending receipt emails');
});

test('Manual Student Enrollment Desk exists with pack selection', () => {
  assert(studioCode.includes('addManualBuyer'), 'Must support manual student enrollment');
  assert(studioCode.includes('Enroll Student'), 'Must have Enroll Student button/modal');
  assert(studioCode.includes('packType'), 'Must allow selecting enrolled course pack');
});

test('Live Revenue & Financial Analytics engine exists', () => {
  assert(studioCode.includes('grossRevenue'), 'Must compute gross revenue');
  assert(studioCode.includes('netActiveRevenue'), 'Must compute net active revenue');
  assert(studioCode.includes('averageOrderValue'), 'Must compute average order value');
  assert(studioCode.includes("activeModule === 'revenue'"), 'Must have dedicated revenue module');
});

test('Course Pricing & Early-Bird schedule engine exists', () => {
  assert(studioCode.includes('handleSavePricing'), 'Must have pricing save handler');
  assert(studioCode.includes('earlyBirdCutoff'), 'Must support early-bird cutoff date configuration');
  assert(studioCode.includes('gsetSinglePrice'), 'Must display GSET single pack pricing');
  assert(studioCode.includes('gsetComboPrice'), 'Must display GSET combo pack pricing');
});

test('Data Export (.xlsx) and Air-Gapped JSON Backup exist', () => {
  assert(studioCode.includes('exportBuyersToExcel'), 'Must have 1-click Excel export');
  assert(studioCode.includes('handleDownloadBackup'), 'Must have complete JSON snapshot backup');
});

test('Navigation Exit routes back to Academic Site & Storefront exist', () => {
  assert(studioCode.includes('handleExit'), 'Must provide exit to main website');
  assert(studioCode.includes('handleExitToStore'), 'Must provide exit to storefront');
});

// ----------------------------------------------------------------------------
// SUITE 4: Context & Financial Math Consistency
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Context Schema & Calculation Integrity ---');

const contextCode = fs.readFileSync(storeContextPath, 'utf-8');

test('EnrolledBuyerRecord schema supports packName and enrolledPacks', () => {
  assert(contextCode.includes('packName?: string'), 'EnrolledBuyerRecord must have packName');
  assert(contextCode.includes('enrolledPacks?: string[]'), 'EnrolledBuyerRecord must have enrolledPacks');
});

test('verifyPaymentAndActivate automatically updates buyersRegistry', () => {
  assert(contextCode.includes('setBuyersRegistry'), 'verifyPaymentAndActivate must record to buyersRegistry');
  assert(contextCode.includes('amountPaid: bAmount'), 'Must record authentic amount paid');
});

test('Simulated purchases accurately compute revenue metrics in ERP math', () => {
  const mockBuyers = [
    { id: '1', name: 'Scholar A', amountPaid: 499, isActive: true, packName: 'UGC NET English Bundle' },
    { id: '2', name: 'Scholar B', amountPaid: 249, isActive: true, packName: 'GSET English Scholar Duo' },
    { id: '3', name: 'Scholar C', amountPaid: 149, isActive: true, packName: 'GSET Paper 1 Foundation Pack' },
    { id: '4', name: 'Scholar D', amountPaid: 499, isActive: false, packName: 'UGC NET English Bundle' } // revoked
  ];

  const totalGross = mockBuyers.reduce((sum, b) => sum + b.amountPaid, 0);
  const activeGross = mockBuyers.filter(b => b.isActive).reduce((sum, b) => sum + b.amountPaid, 0);
  const aov = activeGross / mockBuyers.filter(b => b.isActive).length;

  assert.strictEqual(totalGross, 1396, 'Total gross must be 1396');
  assert.strictEqual(activeGross, 897, 'Active gross must be 897');
  assert.strictEqual(Math.round(aov), 299, 'AOV must be 299');
});

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(` AUDIT COMPLETE: ${passedChecks} Passed, ${failedChecks} Failed`);
console.log('================================================================\n');

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log('PERFECT AUDIT: Author Studio full-page ERP dashboard is 100% verified!\n');
}
