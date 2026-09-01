const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const file = 'C:/Users/frank/Downloads/FERIAS BEIJING JOINING.xlsx';
const tmp = path.join(process.cwd(), '.tmp-xlsx-read');
fs.mkdirSync(tmp, { recursive: true });

try {
  execFileSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -Path '${file}' -DestinationPath '${tmp}' -Force`], { stdio: 'pipe' });
} catch (error) {
  console.error((error.stdout || error.message || '').toString());
  process.exit(1);
}

console.log('expanded');
console.log(fs.readdirSync(tmp));
