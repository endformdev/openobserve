const fs = require('node:fs');
const path = require('node:path');

const suiteDir = path.resolve(__dirname, '../tests/ui-testing/playwright-tests');
const output = path.resolve(__dirname, '../tests/ui-testing/ci-matrix/endform-serial-groups.json');
const modes = new Set(['none', 'default', 'parallel', 'serial']);

module.exports = class {
  onBegin(config, suite) {
    const groups = {};
    function visit(current, parents = []) {
      if (!modes.has(current._parallelMode)) {
        throw new Error('This Playwright version does not expose the expected serial-group mode');
      }
      const titles = current.type === 'describe' ? [...parents, current.title] : parents;
      if (current._parallelMode === 'serial') {
        const file = path.relative(suiteDir, current.location.file).split(path.sep).join('/');
        groups[file] ||= [];
        if (!groups[file].some(group => JSON.stringify(group) === JSON.stringify(titles))) {
          groups[file].push(titles);
        }
      }
      for (const child of current.suites) visit(child, titles);
    }
    visit(suite);
    const ordered = Object.fromEntries(Object.keys(groups).sort().map(file => [
      file, groups[file].some(group => group.length === 0) ? [[]] : groups[file],
    ]));
    fs.writeFileSync(output, `${JSON.stringify(ordered, null, 2)}\n`);
  }
};
