import fs from 'fs';
import path from 'path';

const historyDir = 'C:\\Users\\sudha\\AppData\\Roaming\\Code\\User\\History';
const folders = fs.readdirSync(historyDir);

for (const folder of folders) {
  const folderPath = path.join(historyDir, folder);
  if (!fs.statSync(folderPath).isDirectory()) continue;

  const entriesPath = path.join(folderPath, 'entries.json');
  if (fs.existsSync(entriesPath)) {
    try {
      const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
      console.log(`Folder: ${folder}`);
      console.log(`Resource: ${entries.resource}`);
      console.log(`Entries:`, JSON.stringify(entries.entries, null, 2));
      break;
    } catch (e) {
      console.error(e);
    }
  }
}
