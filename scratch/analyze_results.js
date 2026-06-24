const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/color_scan_results.json', 'utf8'));

const fileSummary = {};
data.forEach(item => {
  if (!fileSummary[item.file]) {
    fileSummary[item.file] = [];
  }
  fileSummary[item.file].push({
    lineNum: item.lineNum,
    term: item.term,
    content: item.content
  });
});

console.log('Unique files with matches:', Object.keys(fileSummary).length);
console.log('---');
for (const [file, matches] of Object.entries(fileSummary)) {
  console.log(`${file}: ${matches.length} matches`);
  matches.forEach(m => {
    console.log(`  Line ${m.lineNum} (${m.term}): ${m.content}`);
  });
}
