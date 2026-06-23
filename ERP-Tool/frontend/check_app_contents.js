import fs from 'fs';
import path from 'path';

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`${filePath} does not exist`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`=== Checks for ${path.basename(filePath)} ===`);
  console.log('Size:', content.length);
  console.log('Includes Dashboard:', content.includes('Dashboard'));
  console.log('Includes EPR:', content.includes('EPR'));
  console.log('Includes ERP:', content.includes('ERP'));
  console.log('Includes RainbowButton:', content.includes('RainbowButton'));
  console.log('Includes GlobalSearch:', content.includes('GlobalSearch'));
  console.log('Includes FollowCursor:', content.includes('FollowCursor'));
  console.log('Includes AnimatedThemeToggler:', content.includes('AnimatedThemeToggler'));
}

checkFile('c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/src/App.jsx');
checkFile('c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/src/App_backup.jsx');
