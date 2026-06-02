import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend';

function scanFunctions(fileName) {
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n=== FUNCTIONS IN ${fileName} ===`);
  
  const regex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    console.log(`Found function "${match[1]}" at index ${match.index}`);
    // Print first 100 characters of the function
    console.log(`  Code: ${content.substring(match.index, match.index + 120)}`);
  }
}

scanFunctions('banking_dump.txt');
scanFunctions('education_dump.txt');
