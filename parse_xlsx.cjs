const XLSX = require('xlsx');
const fs = require('fs');

function parse(filePath) {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const preferred = wb.SheetNames.find(n => n.toLowerCase().startsWith('opera')) || wb.SheetNames[0];
  const sheet = wb.Sheets[preferred];
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
}

const ojo = parse('/mnt/user-uploads/Base_Ojo.xlsx');
const cockpit = parse('/mnt/user-uploads/Base_Cockpit.xlsx');

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/baseOjoDefault.json', JSON.stringify(ojo, null, 2));
fs.writeFileSync('src/data/baseCockpitDefault.json', JSON.stringify(cockpit, null, 2));

console.log('Parsed Ojo:', ojo.length);
console.log('Parsed Cockpit:', cockpit.length);
