const fs = require('fs');
const path = require('path');

const mockVars = [
  'mockEmployees',
  'mockVouchers',
  'mockAppointments',
  'mockSystemLogs',
  'mockUserActivityLogs',
  'mockTransactions',
  'mockServices',
  'mockAISkinResults',
  'mockLabTests',
  'mockMedicalRecords',
  'mockPatients',
  'mockPat', // partial match found in search
  'mockPrescriptions',
  'MOCK_SERVICES',
  'mockTimeSlots',
  'mockTechnicianShifts',
  'mockData',
  'mockDoctors',
  'mockAssignedTasks'
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(file, 'utf8');
      let changed = false;
      mockVars.forEach(v => {
        const regex = new RegExp(`\\b${v}\\b`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, '([])');
          changed = true;
        }
      });
      if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        results.push(file);
      }
    }
  });
  return results;
}

const modified = walk('src');
console.log(`Modified ${modified.length} files:`);
modified.forEach(f => console.log(path.basename(f)));
