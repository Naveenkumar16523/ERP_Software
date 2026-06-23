import fs from 'fs';
import path from 'path';

const componentsDir = 'c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/src/components';

function restoreFile(filePath) {
  try {
    const rawContent = fs.readFileSync(filePath, 'utf8').trim();
    if (rawContent.startsWith('"') && rawContent.endsWith('"')) {
      console.log(`Processing JSON-serialized file: ${path.basename(filePath)}`);
      // Parse the JSON string
      const parsedContent = JSON.parse(rawContent);
      fs.writeFileSync(filePath, parsedContent, 'utf8');
      console.log(`Successfully restored: ${path.basename(filePath)}`);
    } else {
      console.log(`File is already normal: ${path.basename(filePath)}`);
    }
  } catch (err) {
    console.error(`Error processing ${path.basename(filePath)}:`, err);
  }
}

function main() {
  const files = fs.readdirSync(componentsDir);
  files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    if (fs.statSync(filePath).isFile() && file.endsWith('.jsx')) {
      restoreFile(filePath);
    }
  });
}

main();
