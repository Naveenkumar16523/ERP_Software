import fs from 'fs';
import path from 'path';

const historyDir = 'C:\\Users\\sudha\\AppData\\Roaming\\Code\\User\\History';

if (!fs.existsSync(historyDir)) {
  console.error("History directory not found");
  process.exit(1);
}

console.log("Scanning VS Code history...");
const folders = fs.readdirSync(historyDir);
console.log(`Found ${folders.length} history folders.`);

const matches = [];

folders.forEach(folder => {
  const folderPath = path.join(historyDir, folder);
  if (!fs.statSync(folderPath).isDirectory()) return;

  const entriesPath = path.join(folderPath, 'entries.json');
  if (fs.existsSync(entriesPath)) {
    try {
      const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
      const resource = entries.resource;
      if (resource && (
        resource.includes('HealthcareModule') ||
        resource.includes('AgricultureModule') ||
        resource.includes('EducationModule') ||
        resource.includes('BankingModule') ||
        resource.includes('App.jsx') ||
        resource.includes('useERPStore') ||
        resource.includes('GlobalSearch') ||
        resource.includes('RainbowButton')
      )) {
        matches.push({
          folder: folder,
          resource: resource,
          entries: entries.entries
        });
      }
    } catch (e) {}
  }
});

console.log(`\nFound ${matches.length} matching files in history:`);
matches.forEach(m => {
  console.log(`\nResource: ${m.resource}`);
  console.log(`Folder: ${m.folder}`);
  m.entries.forEach(e => {
    const filePath = path.join(historyDir, m.folder, e.id);
    const size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
    console.log(`  - Entry ID: ${e.id}, Time: ${new Date(e.timestamp).toLocaleString()}, Size: ${size} bytes`);
  });
});
