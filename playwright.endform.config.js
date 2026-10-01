const path = require('path');
const original = require('./tests/ui-testing/playwright.config.js');

const suiteDir = path.join(__dirname, 'tests/ui-testing');

module.exports = {
  ...original,
  projects: original.projects.map(project => ({
    ...project,
    ...(['Reports', 'RUM', 'Alerts'].includes(process.env.ENDFORM_TEST_GROUP) && { fullyParallel: false }),
  })),
  testDir: path.resolve(suiteDir, original.testDir),
  outputDir: path.resolve(suiteDir, original.outputDir),
  globalSetup: path.resolve(suiteDir, original.globalSetup),
  globalTeardown: path.resolve(suiteDir, original.globalTeardown),
  reporter: original.reporter.map(([name, options]) => [
    name.startsWith('.') ? path.resolve(suiteDir, name) : name,
    options && {
      ...options,
      ...(options.outputDir && { outputDir: path.resolve(suiteDir, options.outputDir) }),
      ...(options.outputFolder && { outputFolder: path.resolve(suiteDir, options.outputFolder) }),
      ...(options.outputFile && { outputFile: path.resolve(suiteDir, options.outputFile) }),
    },
  ]),
};
