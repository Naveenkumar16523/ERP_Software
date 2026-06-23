const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory() && file !== 'node_modules') {
      results = results.concat(getAllFiles(filePath, exts));
    } else if (exts.some(e => file.endsWith(e))) {
      results.push(filePath);
    }
  });
  return results;
}

const srcDir = path.join(__dirname, 'src');
const files = getAllFiles(srcDir, ['.jsx', '.js']);

let totalReplaced = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. Template literal: `$${expr}` → `₹${expr}`
  content = content.replace(/`\$\$\{/g, '`₹${');

  // 2. Template literal mid-string: ${...}$${...} → ${...}₹${...}
  content = content.replace(/\}\$\$\{/g, '}₹${');

  // 3. String literal dollar: "$" → "₹" and '$' → '₹'
  content = content.replace(/"USD"/g, '"INR"');
  content = content.replace(/'USD'/g, "'INR'");

  // 4. In JSX text content: >$< → >₹< (e.g. <span>$</span>)
  content = content.replace(/>(\s*)\$(\s*)</g, '>$1₹$2<');

  // 5. Hardcoded numbers with dollar: "$10,000" or "$10.50" patterns in strings
  content = content.replace(/\"\$(\d)/g, '"₹$1');
  content = content.replace(/'\$(\d)/g, "'₹$1");

  // 6. Narration strings in useERPStore/seedData with $XX format
  content = content.replace(/`\$(\d)/g, '`₹$1');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${path.relative(srcDir, filePath)}`);
    totalReplaced++;
  }
});

console.log(`\nDone. ${totalReplaced} files updated.`);
