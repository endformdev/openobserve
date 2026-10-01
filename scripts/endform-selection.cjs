const path = require('node:path');
const serialFiles = new Set(require('../tests/ui-testing/ci-matrix/endform-serial-files.json'));
const manifest = require('../tests/ui-testing/ci-matrix/ci_matrix.json');

const suiteDir = path.resolve(__dirname, '../tests/ui-testing/playwright-tests');
const sharedGroups = new Set(['RUM-Token', 'SLO', 'SLO-Measurement', 'Dashboards-Isolated']);
const fileGroups = new Set(['Reports', 'RUM', 'Alerts']);

function selection() {
  const groups = process.env.ENDFORM_SELECTION_JSON
    ? JSON.parse(process.env.ENDFORM_SELECTION_JSON).include
    : manifest;
  const phase = process.env.ENDFORM_PHASE || 'main';
  return groups.flatMap(group => {
    const groupPhase = group.quick_mode_enabled === 'true'
      ? 'quick'
      : sharedGroups.has(group.testfolder) ? 'shared' : 'main';
    if (groupPhase !== phase) return [];
    return group.run_files.map(file => {
      const filename = path.resolve(suiteDir, group.actual_folder, file);
      const fileMode = phase === 'shared' || fileGroups.has(group.testfolder)
        || serialFiles.has(`${group.actual_folder}/${file}`);
      return { filename, fileMode, group: group.testfolder };
    });
  });
}

module.exports = { selection };
