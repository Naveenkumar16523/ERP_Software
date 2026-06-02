import fs from 'fs';
import path from 'path';

const jsFile = 'c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/dist/assets/index-BuGdy65W.js';

if (!fs.existsSync(jsFile)) {
  console.error("Dist JS file not found");
  process.exit(1);
}

const content = fs.readFileSync(jsFile, 'utf8');

// We want to find references to module keywords
const searchTerms = {
  agriculture: 'Cultivation fields planner',
  healthcare: 'Clinical EHR console',
  banking: 'Core banking ledger',
  education: 'Student Information System',
  ai: 'ocrEngine',
  crm: 'Lead for',
  finance: 'Trial Balance',
  hr: 'recruitment',
  inventory: 'Inventory Module',
  manufacturing: 'Bill of Materials'
};

Object.entries(searchTerms).forEach(([name, term]) => {
  const idx = content.indexOf(term);
  if (idx !== -1) {
    console.log(`Found term for ${name} at index ${idx}`);
    // Print around the index to inspect the compiled code
    const start = Math.max(0, idx - 1000);
    const end = Math.min(content.length, idx + 2000);
    console.log(`--- Context for ${name} ---`);
    console.log(content.substring(start, end));
    console.log(`---------------------------\n`);
  } else {
    console.log(`Term NOT found for ${name}`);
  }
});
