import fs from 'fs';

const content = fs.readFileSync('c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/dist/assets/index-BuGdy65W.js', 'utf8');

// We want to find declarations like "const T6 =" or "T6=" or "as T6"
const icons = ['T6', 'IO', 'Yw', 'Nr', 'Y6', 'Oi', 'Xo', 'wu', 'J6'];

icons.forEach(icon => {
  // Search for the icon name in the file and print context
  let idx = -1;
  while ((idx = content.indexOf(icon, idx + 1)) !== -1) {
    if (idx > 50 && idx < content.length - 50) {
      const context = content.substring(idx - 100, idx + 100);
      if (context.includes('lucide') || context.includes('Icon') || context.includes('createReactComponent')) {
        console.log(`Icon ${icon} found in context:`);
        console.log(`  ${context.trim()}`);
        break;
      }
    }
  }
});
