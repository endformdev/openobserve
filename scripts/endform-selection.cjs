const path = require('node:path');
const serialFiles = new Set(require('../tests/ui-testing/ci-matrix/endform-serial-files.json'));
const manifest = require('../tests/ui-testing/ci-matrix/ci_matrix.json');

const suiteDir = path.resolve(__dirname, '../tests/ui-testing/playwright-tests');
const fileGroups = new Set(['Reports', 'RUM', 'Alerts']);

function selection() {
  const groups = process.env.ENDFORM_SELECTION_JSON
    ? JSON.parse(process.env.ENDFORM_SELECTION_JSON).include
    : manifest;
  const phase = process.env.ENDFORM_PHASE || 'main';
  return groups.flatMap(group => {
    const groupPhase = group.quick_mode_enabled === 'true'
      ? 'quick'
      : 'main';
    if (groupPhase !== phase) return [];
    return group.run_files.map(file => {
      const filename = path.resolve(suiteDir, group.actual_folder, file);
      const fileMode = ['RUM', 'SLO'].includes(group.actual_folder) || fileGroups.has(group.testfolder)
        || serialFiles.has(`${group.actual_folder}/${file}`);
      const resource = group.testfolder === 'Dashboards-Isolated' ? 'preferences'
        : ['RUM', 'SLO', 'Reports', 'Alerts'].includes(group.actual_folder)
          ? group.actual_folder.toLowerCase() : fileMode ? 'files' : 'tests';
      return { filename, fileMode, resource, group: group.testfolder };
    });
  });
}

module.exports = { selection };
