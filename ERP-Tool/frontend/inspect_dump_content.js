import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend';

function searchInDump(fileName) {
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n=== SEARCHING IN ${fileName} ===`);
  
  // Find common keywords
  const keywords = [
    'AgricultureModule',
    'HealthcareModule',
    'BankingModule',
    'EducationModule',
    'function Zde',
    'function Qde',
    'function Xde',
    'admitPatient',
    'soilMoisture',
    'student'
  ];

  keywords.forEach(kw => {
    const idx = content.indexOf(kw);
    if (idx !== -1) {
      console.log(`Keyword "${kw}" found at index ${idx}`);
    }
  });
}

searchInDump('healthcare_dump.txt');
searchInDump('agriculture_dump.txt');
searchInDump('banking_dump.txt');
searchInDump('education_dump.txt');
