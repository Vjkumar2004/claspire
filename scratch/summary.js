const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/color_scan_results.json', 'utf8'));

const summary = {};
data.forEach(x => {
  summary[x.file] = (summary[x.file] || 0) + 1;
});

console.log(JSON.stringify(summary, null, 2));
