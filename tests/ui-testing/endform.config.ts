import { resolve } from 'node:path';
import { defineEndformConfig } from 'endform';

export default defineEndformConfig({
  // Worker-hosted RUM fixture servers must keep their own loopback ports.
  proxyNetworkPorts: [5080, 8025, ...(process.env.ENDFORM_TEST_GROUP === 'Alerts' ? [9000] : [])],
  concurrentTestLimits: [{
    scope: 'within-suite-run',
    limit: Number(process.env.ENDFORM_TEST_CONCURRENCY || 5),
  }],
  additionalFiles: [
    '../test-data/70_fields.json',
    '../test-data/append.csv',
    '../test-data/dashboard1-import.json',
    '../test-data/dashboard2-import.json',
    '../test-data/dashboardAzure.json',
    '../test-data/dashboardV3-import.json',
    '../test-data/dashboards-import.json',
    '../test-data/enrichment_info.csv',
    '../test-data/invalid-alert.json',
    '../test-data/line.json',
    '../test-data/match_all.json',
    '../test-data/pictorial.json',
    '../test-data/pipelineRealTime.json',
    '../test-data/pipelineScheduled.json',
    '../test-data/protocols.csv',
    '../test-data/regex_patterns_import.json',
    '../test-data/sdr_test_data.json',
    'playwright-tests/utils/auth/user.json',
    'utils/td150.json',
    'utils/webhookDestinationImport.json',
    'utils/webhookTemplateImport.json',
    'fixtures/rum/cdn-sample/*.html',
    'fixtures/rum/cdn-sample/*.js',
    'fixtures/rum/cdn-sample/*.css',
    'fixtures/rum/npm-app/package.json',
    'fixtures/rum/npm-app/package-lock.json',
    'fixtures/rum/npm-app/src/main.js',
    ...(process.env.ENDFORM_TEST_GROUP === 'RUM' ? [
      'fixtures/rum/npm-app/dist/bundle.js',
      'fixtures/rum/npm-app/node_modules/@openobserve/browser-rum/package.json',
    ] : []),
    'fixtures/sourcemaps/dist/main.e2efix01.js',
    'fixtures/sourcemaps/dist/main.e2efix01.js.map',
    'fixtures/sourcemaps/manifest.json',
  ].map(file => resolve(__dirname, file)),
});
