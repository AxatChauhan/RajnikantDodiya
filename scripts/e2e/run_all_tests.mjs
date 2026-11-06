/**
 * NET Vidya English Student Store • Master E2E Test Runner
 * Executes Tiers 1–4 sequentially and produces consolidated scorecard.
 * 
 * Usage:
 *   node scripts/e2e/run_all_tests.mjs
 */

import { performance } from 'perf_hooks';
import { runTier1Tests } from './tier1_feature_tests.mjs';
import { runTier2Tests } from './tier2_boundary_tests.mjs';
import { runTier3Tests } from './tier3_cross_feature_tests.mjs';
import { runTier4Tests } from './tier4_realworld_scenarios.mjs';
import { printConsolidatedScorecard, discoveredImplementationBugs } from './test_helpers.mjs';

async function main() {
  const startTime = performance.now();

  console.log('================================================================================');
  console.log('         NET VIDYA ENGLISH STUDENT STORE: MASTER E2E TEST RUNNER         ');
  console.log('================================================================================');
  console.log(`Execution Mode : ES Modules (Node.js ${process.version})`);
  console.log(`Target Host    : ${process.env.TEST_BASE_URL || 'Local Project & Contract Simulator'}`);
  console.log(`Timestamp      : ${new Date().toISOString()}`);
  console.log('--------------------------------------------------------------------------------\n');

  try {
    // Tier 1: Feature Coverage (Features 1–27)
    await runTier1Tests();

    // Tier 2: Boundary & Corner Cases (Features 1–27)
    await runTier2Tests();

    // Tier 3: Cross-Feature Interactions & Pairwise Combinations
    await runTier3Tests();

    // Tier 4: Real-World Scenarios & Adversarial Security Suite
    await runTier4Tests();

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`\nAll tiers completed in ${duration}s.`);

    // Display Escalate Bugs section if any defect was detected during testing
    if (discoveredImplementationBugs.length > 0) {
      console.log('\n--------------------------------------------------------------------------------');
      console.log('                 DISCOVERED IMPLEMENTATION DEFECTS TO ESCALATE                  ');
      console.log('--------------------------------------------------------------------------------');
      discoveredImplementationBugs.forEach((bug, idx) => {
        console.log(`[DEFECT ${idx + 1}] ID: ${bug.id} | Severity: ${bug.severity}`);
        console.log(`  File: ${bug.file}`);
        console.log(`  Detail: ${bug.description}\n`);
      });
      console.log('--------------------------------------------------------------------------------\n');
    }

    const allPassed = printConsolidatedScorecard();
    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('\nFATAL EXCEPTION DURING TEST RUN:', err);
    process.exit(1);
  }
}

main();
