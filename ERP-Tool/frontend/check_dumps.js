import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend';

function checkDump(fileName) {
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`${fileName} does not exist`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`=== ${fileName} ===`);
  console.log(`Length: ${content.length}`);
  console.log(`Starts with: ${content.substring(0, 100)}`);
  console.log(`Ends with: ${content.substring(content.length - 100)}`);
  console.log(`Contains "<truncated": ${content.includes('<truncated')}`);
}

checkDump('agriculture_dump.txt');
checkDump('banking_dump.txt');
checkDump('education_dump.txt');
checkDump('healthcare_dump.txt');
