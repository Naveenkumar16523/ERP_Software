import fs from 'fs';

const content = fs.readFileSync('c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/src/App.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('module')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
