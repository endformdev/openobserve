const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { request } = require('@playwright/test');
const { performGlobalIngestion } = require('./playwright-tests/utils/global-setup.js');
const { ingestTraces } = require('./playwright-tests/utils/trace-ingestion.js');
const { ingestRumErrors } = require('./playwright-tests/utils/rum-error-ingestion.js');

async function globalSetup() {
  if (process.env.ENDFORM_TEST_GROUP === 'RUM') {
    const fixtureDir = path.join(__dirname, 'fixtures/rum/npm-app');
    execFileSync('npm', ['ci'], { cwd: fixtureDir, stdio: 'inherit', timeout: 300000 });
    execFileSync('npm', ['run', 'build'], { cwd: fixtureDir, stdio: 'inherit', timeout: 120000 });
  }

  const baseURL = process.env.ZO_BASE_URL;
  const email = process.env.ZO_ROOT_USER_EMAIL;
  const password = process.env.ZO_ROOT_USER_PASSWORD;
  if (!baseURL || !email || !password) {
    throw new Error('ZO_BASE_URL, ZO_ROOT_USER_EMAIL and ZO_ROOT_USER_PASSWORD are required');
  }

  const context = await request.newContext();
  try {
    const response = await context.post(`${baseURL}/auth/login`, {
      data: { name: email, password },
    });
    if (!response.ok()) {
      throw new Error(`Global authentication failed with HTTP ${response.status()}`);
    }
    const login = await response.json();
    if (login.status !== true) {
      throw new Error('Global authentication was rejected');
    }

    const now = Math.floor(Date.now() / 1000);
    const userInfo = {
      given_name: email,
      auth_time: now,
      name: email,
      exp: now + 30 * 24 * 60 * 60,
      family_name: '',
      email,
      role: login.role,
    };
    const state = await context.storageState();
    state.origins = [{
      origin: new URL(baseURL).origin,
      localStorage: [
        { name: 'userInfo', value: Buffer.from(JSON.stringify(userInfo)).toString('base64') },
        { name: 'currentuser', value: JSON.stringify(JSON.stringify(userInfo)) },
      ],
    }];
    const authFile = path.join(__dirname, 'playwright-tests/utils/auth/user.json');
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    fs.writeFileSync(authFile, JSON.stringify(state), { mode: 0o600 });

    const cleanupOnly = process.argv.some(arg => /cleanup\.spec\.(js|ts)$/.test(arg));
    if (!cleanupOnly && process.env.SKIP_INGESTION !== 'true') {
      const page = { request: context };
      await performGlobalIngestion(page);
      await ingestTraces(page, 20);
      await ingestRumErrors(page, 3);
    }
  } finally {
    await context.dispose();
  }
}

module.exports = globalSetup;
