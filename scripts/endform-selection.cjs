const path = require('node:path');
const serialGroups = require('../tests/ui-testing/ci-matrix/endform-serial-groups.json');
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
    return group.run_files.flatMap(file => {
      const filename = path.resolve(suiteDir, group.actual_folder, file);
      const resource = group.testfolder === 'Dashboards-Isolated' ? 'preferences'
        : ['RUM', 'SLO', 'Reports', 'Alerts'].includes(group.actual_folder)
          ? group.actual_folder.toLowerCase() : 'tests';
      if (resource !== 'tests' || fileGroups.has(group.testfolder)) {
        return [{ filename, fileMode: true, resource, group: group.testfolder }];
      }
      const titles = serialGroups[`${group.actual_folder}/${file}`];
      const parallel = { filename, fileMode: false, resource: 'tests', group: group.testfolder };
      if (!titles) return [parallel];
      const serial = { filename, fileMode: true, resource: 'files', serialTitles: titles, group: group.testfolder };
      return titles.some(title => title.length === 0) ? [serial] : [parallel, serial];
    });
  });
}

module.exports = { selection };
