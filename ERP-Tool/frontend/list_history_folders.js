import fs from 'fs';
import path from 'path';

const historyDir = 'C:\\Users\\sudha\\AppData\\Roaming\\Code\\User\\History';

if (!fs.existsSync(historyDir)) {
  console.error("History directory not found");
  process.exit(1);
}

const folders = fs.readdirSync(historyDir);
console.log(`Found ${folders.length} folders.`);

folders.forEach(folder => {
  const folderPath = path.join(historyDir, folder);
  if (!fs.statSync(folderPath).isDirectory()) return;

  const entriesPath = path.join(folderPath, 'entries.json');
  if (fs.existsSync(entriesPath)) {
    try {
      const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
      if (entries.resource && entries.resource.toLowerCase().includes('erp-tool')) {
        console.log(`Folder: ${folder}, Resource: ${entries.resource}`);
      }
    } catch (e) {}
  }
});
