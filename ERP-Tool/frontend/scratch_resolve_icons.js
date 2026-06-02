import fs from 'fs';

const content = fs.readFileSync('c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/dist/assets/index-BuGdy65W.js', 'utf8');

const vars = [
  'T6', 'IO', 'Yw', 'Nr', 'Y6', 'Oi', 'Xo', 'wu', 'J6', 
  'Hx', '$e', 'Gw', 'K6', 'Ww', 'Vx', 'rp', 'q6', 'Yo', 
  'eb', 'Ks', 'Nu', 'Zv', 'sp', 'Fx', 'CO', 'Uw', 'Be'
];

vars.forEach(v => {
  // Let's search for patterns like `const T6 =` or `const T6=` or `,T6=` or `function T6`
  const regexes = [
    new RegExp(`const\\s+${v}\\s*=`),
    new RegExp(`let\\s+${v}\\s*=`),
    new RegExp(`var\\s+${v}\\s*=`),
    new RegExp(`function\\s+${v}\\b`),
    new RegExp(`\\b${v}\\s*=\\s*createReactComponent\\b`),
    new RegExp(`\\b${v}\\s*=\\s*\\w+\\s*\\(\\s*["']\\w+["']`),
  ];
  
  let found = false;
  for (const regex of regexes) {
    const match = content.match(regex);
    if (match) {
      const index = match.index;
      const context = content.substring(Math.max(0, index - 80), Math.min(content.length, index + 120));
      console.log(`Matched variable ${v}:`);
      console.log(`  ${context.trim()}`);
      found = true;
      break;
    }
  }
  
  if (!found) {
    // Search general index of variable
    let idx = content.indexOf(` ${v} `);
    if (idx === -1) idx = content.indexOf(`,${v}=`);
    if (idx === -1) idx = content.indexOf(`(${v})`);
    if (idx !== -1) {
      const context = content.substring(Math.max(0, idx - 80), Math.min(content.length, idx + 120));
      console.log(`General match for ${v}:`);
      console.log(`  ${context.trim()}`);
    }
  }
});
