import fs from 'fs';

const content = fs.readFileSync('c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/src/App.jsx', 'utf8');
const lines = content.split('\n');

for (let i = 2000; i < 3000; i += 200) {
  for (let j = i; j < i + 10; j++) {
    console.log(`${j + 1}: ${lines[j]}`);
  }
}
