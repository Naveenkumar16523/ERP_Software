import fs from 'fs';

const path = 'c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/src/components/AgricultureModule.jsx';
const content = fs.readFileSync(path, 'utf8');

console.log(`Length: ${content.length}`);
console.log(`First 100 characters: ${content.substring(0, 100)}`);
for (let i = 0; i < Math.min(20, content.length); i++) {
  console.log(`Char ${i}: ${content.charCodeAt(i)} (${JSON.stringify(content[i])})`);
}
console.log(`Last 20 characters: ${content.substring(content.length - 20)}`);
for (let i = Math.max(0, content.length - 20); i < content.length; i++) {
  console.log(`Char ${i}: ${content.charCodeAt(i)} (${JSON.stringify(content[i])})`);
}
