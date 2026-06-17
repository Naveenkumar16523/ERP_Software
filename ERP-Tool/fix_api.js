const fs = require('fs');

let code = fs.readFileSync('frontend/src/utils/api.js', 'utf8');

// Replace standard single-line try/catches
code = code.replace(/try\s*\{\s*return\s*await\s*request\((.*?)\);\s*\}\s*catch(?:\s*\([^)]+\))?\s*\{\s*(?:if\s*\([^)]+\)\s*throw[^;]+;\s*)?(?:const[^;]+;\s*)*(?:useERPStore\.getState\(\)\.[^;]+;\s*)*(?:return[^;]+;\s*)?\}/g, "return request($1);");

// Fix createJournalEntry custom logic
code = code.replace(/try\s*\{\s*const res = await request\((.*?)\);\s*return res\.entry \|\| res;\s*\}\s*catch(?:\s*\([^)]+\))?\s*\{\s*(?:const[^;]+;\s*)*(?:useERPStore\.getState\(\)\.[^;]+;\s*)*(?:return[^;]+;\s*)?\}/g, "const res = await request($1);\n      return res.entry || res;");

fs.writeFileSync('frontend/src/utils/api.js', code);
console.log("api.js patched via Node.");
