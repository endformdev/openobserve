const path = require('path');
const original = require('./tests/ui-testing/playwright.config.js');
const { selection } = require('./scripts/endform-selection.cjs');

const suiteDir = path.join(__dirname, 'tests/ui-testing');

module.exports = {
  ...original,
  projects: original.projects.flatMap(project =>
    ['tests', 'files', 'rum', 'slo', 'reports', 'alerts', 'preferences'].map(resource => ({
      ...project,
      name: `${project.name}-${resource}`,
      fullyParallel: resource === 'tests',
      testMatch: selection().filter(file => file.resource === resource).map(file =>
        new RegExp(`^${file.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)),
    }))),
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
