import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend';

function extractAndSave(fileName, startKeyword, endKeyword, outputName) {
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const startIdx = content.indexOf(startKeyword);
  const endIdx = content.indexOf(endKeyword);

  if (startIdx !== -1 && endIdx !== -1) {
    const extracted = content.substring(startIdx, endIdx);
    fs.writeFileSync(path.join(dir, outputName), extracted, 'utf8');
    console.log(`Saved ${outputName} (length: ${extracted.length})`);
  } else {
    console.error(`Failed to find keywords in ${fileName}`);
  }
}

extractAndSave('healthcare_dump.txt', 'function Qde', 'function Zde', 'extracted_healthcare.js');
extractAndSave('agriculture_dump.txt', 'function Zde', 'student', 'extracted_agriculture.js');
extractAndSave('banking_dump.txt', 'function efe', 'function tfe', 'extracted_banking.js');
extractAndSave('education_dump.txt', 'function Jde', 'function efe', 'extracted_education.js');
