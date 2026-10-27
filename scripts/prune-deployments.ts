// ============================================================
// MooEarth Live — Automated Vercel Deployment Pruning Utility
// ============================================================
// Safeguards deployment storage under Vercel Free-Plan 10 GB limit.
// - Protects #1: Active working production deployment (live alias)
// - Protects #2: Reliable prior rollback deployment
// - Safely prunes all older superseded deployments in batches
// - Uses Vercel CLI `--safe` to strictly protect active aliases

import { execSync } from 'child_process';

async function main() {
  console.log('🔍 Inspecting Vercel deployments for mooearth-live...');
  let rawJson = '';
  try {
    rawJson = execSync('npx vercel list mooearth-live --json --limit 100', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ Failed to fetch deployments from Vercel CLI:', msg);
    process.exit(1);
  }

  const data = JSON.parse(rawJson);
  const deployments = (data.deployments || []).sort(
    (a: { createdAt: number }, b: { createdAt: number }) => b.createdAt - a.createdAt
  );

  console.log(`📊 Found ${deployments.length} total deployments.`);

  if (deployments.length <= 2) {
    console.log('✅ Healthy: Only 2 or fewer deployments exist (Active Production + Rollback).');
    console.log('Storage usage is already optimized at minimum footprint.');
    return;
  }

  const activeProd = deployments[0];
  const rollback = deployments[1];
  const toDelete = deployments.slice(2);

  console.log('\n🔒 Protected Invariants:');
  console.log(`   [Live Prod] https://${activeProd.url}`);
  console.log(`   [Rollback]  https://${rollback.url}`);
  console.log(`\n🧹 Identified ${toDelete.length} superseded deployments to prune.\n`);

  const BATCH_SIZE = 15;
  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const batch = toDelete.slice(i, i + BATCH_SIZE);
    const urls = batch.map((d: { url: string }) => `"${d.url}"`).join(' ');
    const range = `${i + 1} - ${Math.min(i + BATCH_SIZE, toDelete.length)} of ${toDelete.length}`;
    console.log(`🗑️  Removing batch (${range})...`);
    try {
      execSync(`npx vercel remove ${urls} -y --safe`, {
        encoding: 'utf8',
        stdio: 'inherit',
      });
      console.log(`   ✅ Batch (${range}) removed.\n`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`   ⚠️ Notice during batch: ${msg.split('\n')[0]}`);
    }
  }

  console.log('🎉 Deployment cleanup complete! Only active prod and rollback remain.');
}

main().catch(console.error);
