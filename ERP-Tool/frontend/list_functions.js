import fs from 'fs';

const content = fs.readFileSync('c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/src/App.jsx', 'utf8');
const lines = content.split('\n');

console.log('=== Functions/Components in App.jsx ===');
lines.forEach((line, idx) => {
  if (line.includes('const ') && (line.includes(' = () =>') || line.includes(' = ({') || line.includes(' = React.forwardRef'))) {
    console.log(`Line ${idx+1}: ${line.trim()}`);
  }
  if (line.includes('function ') && !line.includes('(') && !line.includes('=')) {
    // maybe standard function
  }
  if (line.includes('export default function') || (line.includes('function ') && (line.includes('Module') || line.includes('Dashboard')))) {
    console.log(`Line ${idx+1}: ${line.trim()}`);
  }
});
