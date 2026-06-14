const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.js') || file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(f => {
  if (f.includes('mockData.js')) return;
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('mockData')) {
    // Remove lines that have 'from ...mockData' or 'import ... mockData'
    const lines = content.split('\n');
    const newLines = lines.filter(line => !line.match(/from\s+['"].*mockData['"]/));
    if (lines.length !== newLines.length) {
      fs.writeFileSync(f, newLines.join('\n'), 'utf8');
      console.log('Cleaned: ' + f);
    }
  }
});
