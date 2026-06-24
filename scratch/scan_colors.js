const fs = require('fs');
const path = require('path');

const searchTerms = [
  'purple',
  'violet',
  '7C3AED',
  '8B5CF6',
  '9333EA',
  'A855F7',
  'C084FC',
  'text-indigo',
  'bg-indigo',
  'border-indigo',
  'from-indigo',
  'to-indigo',
  'via-indigo',
  'fuchsia-500',
  'to-fuchsia'
];

const results = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        scanDir(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (['.tsx', '.ts', '.css', '.js'].includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          for (const term of searchTerms) {
            if (line.toLowerCase().includes(term.toLowerCase())) {
              results.push({
                file: fullPath,
                lineNum: i + 1,
                term,
                content: line.trim()
              });
              break; // match once per line
            }
          }
        });
      }
    }
  }
}

scanDir('src');

const outPath = 'scratch/color_scan_results.json';
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`Found ${results.length} matches. Saved to ${outPath}`);
