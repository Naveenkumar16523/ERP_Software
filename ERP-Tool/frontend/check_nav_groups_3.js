import fs from 'fs';

const content = fs.readFileSync('c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/src/App.jsx', 'utf8');
const lines = content.split('\n');

for (let i = 3400; i < 3800; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
