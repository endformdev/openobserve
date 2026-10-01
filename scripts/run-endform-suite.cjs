const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { selection } = require('./endform-selection.cjs');

const root = path.resolve(__dirname, '..');
const blobDir = path.join(root, 'tests/ui-testing/blob-report');
const archiveDir = path.join(root, 'tests/ui-testing/endform-blob-reports');
const pidFile = path.join(root, 'openobserve.pid');

async function restartQuickServer() {
  const pid = Number(fs.readFileSync(pidFile, 'utf8'));
  process.kill(pid, 'SIGTERM');
  for (let i = 0; i < 120; i++) {
    try { process.kill(pid, 0); }
    catch { break; }
    if (i === 119) throw new Error('OpenObserve did not stop before the quick-mode phase');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  const log = fs.openSync(path.join(root, 'o2-quick.log'), 'a');
  const child = spawn('./release-ci-binary/openobserve', [], {
    cwd: root,
    env: {
      ...process.env,
      ZO_QUICK_MODE_ENABLED: 'true',
      ZO_DATA_DIR: './data/quick/',
      ZO_INGEST_ALLOWED_UPTO: '5',
      ZO_SLO_BACKFILL_CHUNK_SECS: '86400',
    },
    detached: true,
    stdio: ['ignore', log, log],
  });
  child.unref();
  fs.closeSync(log);
  fs.writeFileSync(pidFile, String(child.pid));
  for (let i = 0; i < 120; i++) {
    try {
      const response = await fetch(`${process.env.ZO_BASE_URL}/web/login`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Quick-mode OpenObserve failed to start');
}

async function main() {
  fs.mkdirSync(archiveDir, { recursive: true });
  let failed = false;
  console.log(`TEST_STAGE_STARTED_AT=${new Date().toISOString()}`);
  try {
    for (const phase of ['main', 'quick']) {
      process.env.ENDFORM_PHASE = phase;
      const files = selection();
      if (files.length === 0) continue;
      if (phase === 'quick') await restartQuickServer();
      console.log(`ENDFORM_PHASE_STARTED phase=${phase} files=${files.length} at=${new Date().toISOString()}`);
      const result = spawnSync('npx', [
        'endform@latest', 'test', '--organization-id', '2G1ZCj7X',
        '--config=playwright.endform.config.js',
      ], {
        cwd: root,
        env: {
          ...process.env,
          PLAYWRIGHT_BLOB_OUTPUT_NAME: `report-${phase}.zip`,
        },
        stdio: 'inherit',
      });
      for (const file of fs.existsSync(blobDir) ? fs.readdirSync(blobDir) : []) {
        if (file.endsWith('.zip')) fs.copyFileSync(path.join(blobDir, file), path.join(archiveDir, file));
      }
      console.log(`ENDFORM_PHASE_FINISHED phase=${phase} exit=${result.status} at=${new Date().toISOString()}`);
      failed ||= result.status !== 0;
    }
  } finally {
    console.log(`TEST_STAGE_FINISHED_AT=${new Date().toISOString()}`);
  }
  process.exitCode = failed ? 1 : 0;
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
