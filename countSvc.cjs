const fs = require('fs');
const c = fs.readFileSync('src/mockData.js', 'utf8');
const lines = c.split('\n');
const svcs = {};
let curService = null, curStatus = null;
lines.forEach(line => {
  const sm = line.match(/"service":\s*"([^"]+)"/);
  const st = line.match(/"status":\s*"([^"]+)"/);
  if (sm) curService = sm[1];
  if (st) curStatus = st[1];
  if (line.includes('},') || line.includes('    }')) {
    if (curService && curStatus) {
      if (!svcs[curService]) svcs[curService] = {t:0, d:0};
      svcs[curService].t++;
      if (curStatus === '\u0110\u00e3 kh\u00e1m') svcs[curService].d++;
      curService = null; curStatus = null;
    }
  }
});
const sorted = Object.entries(svcs).sort((a,b) => b[1].d - a[1].d);
sorted.forEach(([k,v]) => console.log(k.padEnd(45) + 'done=' + v.d + '  total=' + v.t));
