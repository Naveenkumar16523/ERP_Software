/**
 * fix_stringified_files.js
 * Scans all JSX/JS component files and fixes those that have been stored
 * as a JSON string literal (first line starts with a quote and the content
 * is the escaped source code).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = './src';

function getAllFiles(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      getAllFiles(full, files);
    } else {
      const ext = extname(name);
      if (['.jsx', '.js', '.ts', '.tsx'].includes(ext)) {
        files.push(full);
      }
    }
  }
  return files;
}

const files = getAllFiles(ROOT);
let fixed = 0;

for (const filePath of files) {
  const raw = readFileSync(filePath, 'utf8');
  const trimmed = raw.trim();

  // Detect stringified file: starts with a double-quote and the first line
  // contains embedded \n escape sequences (the source code was JSON.stringify'd)
  const firstLine = trimmed.split('\n')[0];
  if (
    (firstLine.startsWith('"') || firstLine.startsWith("'")) &&
    firstLine.includes('\\n')
  ) {
    try {
      // The file content IS the JSON string — evaluate it to get the real code
      // We use JSON.parse after stripping the trailing quote if needed.
      // The file might end with a newline after the closing quote.

      // Find the actual string: it begins with " and ends with "
      // Handle both: entire file is a JSON string, or line 1 is the string
      let jsonStr = trimmed;

      // If the string doesn't end with a quote (truncated display), skip
      // But for real files it should be fine. Let's just JSON.parse.
      const parsed = JSON.parse(jsonStr);

      if (typeof parsed === 'string' && parsed.length > 50) {
        writeFileSync(filePath, parsed, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
        fixed++;
      }
    } catch (err) {
      // Try eval as a last resort for single-quoted strings
      try {
        const evaled = eval(trimmed);
        if (typeof evaled === 'string' && evaled.length > 50) {
          writeFileSync(filePath, evaled, 'utf8');
          console.log(`✅ Fixed (eval): ${filePath}`);
          fixed++;
        }
      } catch {
        console.warn(`⚠️  Skipped (parse error): ${filePath} — ${err.message}`);
      }
    }
  } else {
    // console.log(`   OK: ${filePath}`);
  }
}

console.log(`\nDone. ${fixed} file(s) fixed out of ${files.length} scanned.`);
