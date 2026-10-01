const path = require('path');
const original = require('./tests/ui-testing/playwright.config.js');
const { selection } = require('./scripts/endform-selection.cjs');

const suiteDir = path.join(__dirname, 'tests/ui-testing');

module.exports = {
  ...original,
  projects: original.projects.flatMap(project => [false, true].map(fileMode => ({
    ...project,
    name: `${project.name}-${fileMode ? 'files' : 'tests'}`,
    fullyParallel: !fileMode,
    testMatch: selection().filter(file => file.fileMode === fileMode).map(file =>
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
