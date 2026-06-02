import fs from 'fs';
import path from 'path';

const srcDir = 'c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/src';
const searchTerms = ['FollowCursor', 'RainbowButton', 'GlobalSearch', 'AnimatedThemeToggler', 'EPR'];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const found = {};
searchTerms.forEach(t => found[t] = []);

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      searchTerms.forEach(term => {
        if (content.includes(term)) {
          found[term].push(filePath.replace(/\\/g, '/'));
        }
      });
    } catch (e) {}
  }
});

console.log('=== SEARCH RESULTS ===');
searchTerms.forEach(term => {
  console.log(`\nTerm: "${term}" found in:`);
  if (found[term].length === 0) {
    console.log('  (none)');
  } else {
    found[term].forEach(file => {
      console.log(`  - ${file}`);
    });
  }
});
