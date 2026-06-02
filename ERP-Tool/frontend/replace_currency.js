import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// get the mode: 'rupee' or 'dollar'
const mode = process.argv[2] || 'rupee';

if (mode !== 'rupee' && mode !== 'dollar') {
  console.error("Usage: node replace_currency.js [rupee|dollar]");
  process.exit(1);
}

console.log(`Running in ${mode.toUpperCase()} mode...`);

function getAllFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        results = results.concat(getAllFiles(filePath, exts));
      }
    } else if (exts.some(e => file.endsWith(e))) {
      results.push(filePath);
    }
  });
  return results;
}

const srcDir = path.join(__dirname, 'src');
const files = getAllFiles(srcDir, ['.jsx', '.js', '.css']);

// Rules definition
const rules = mode === 'rupee' ? [
  // 1. Icon import and usage from lucide-react
  {
    find: /\bDollarSign\b/g,
    replace: 'IndianRupee'
  },
  // 2. Template literal currency symbol: `$${value}` -> `₹${value}`
  {
    find: /`\$\$\{/g,
    replace: '`₹${'
  },
  // 3. Mid-string template literal: `${val1}$${val2}` -> `${val1}₹${val2}`
  {
    find: /\}\$\$\{/g,
    replace: '}₹${'
  },
  // 4. ISO Currency code: "USD" -> "INR"
  {
    find: /"USD"/g,
    replace: '"INR"'
  },
  {
    find: /'USD'/g,
    replace: "'INR'"
  },
  // 5. JSX literal dollar: <span>$</span> -> <span>₹</span> or >$ < -> >₹ <
  {
    find: />(\s*)\$(\s*)</g,
    replace: '>$1₹$2<'
  },
  // 6. Hardcoded numbers with dollar (excluding single digit backreferences)
  {
    find: /\$(\d{2,}|\d[,\.]\d*)/g,
    replace: '₹$1'
  }
] : [
  // 1. Icon import and usage from lucide-react
  {
    find: /\bIndianRupee\b/g,
    replace: 'DollarSign'
  },
  // 2. Template literal currency symbol: `₹${value}` -> `$${value}`
  // Note: '$$$$' is required in JS replacement string to escape to '$$'
  {
    find: /`₹\$\{/g,
    replace: '`$$$${'
  },
  // 3. Mid-string template literal: `${val1}₹${val2}` -> `${val1}$${val2}`
  {
    find: /\}₹\$\{/g,
    replace: '}$$$${'
  },
  // 4. ISO Currency code: "INR" -> "USD"
  {
    find: /"INR"/g,
    replace: '"USD"'
  },
  {
    find: /'INR'/g,
    replace: "'USD'"
  },
  // 5. JSX literal rupee: <span>₹</span> -> <span>$</span> or >₹ < -> >$ <
  {
    find: />(\s*)₹(\s*)</g,
    replace: '>$1$$2<'
  },
  // 6. Hardcoded numbers with rupee
  {
    find: /₹(\d{2,}|\d[,\.]\d*)/g,
    replace: '$$$1'
  }
];

let totalReplaced = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  rules.forEach(rule => {
    content = content.replace(rule.find, rule.replace);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${path.relative(srcDir, filePath)}`);
    totalReplaced++;
  }
});

console.log(`\nDone. ${totalReplaced} files updated.`);
