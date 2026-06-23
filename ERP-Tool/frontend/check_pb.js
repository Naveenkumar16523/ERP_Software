import fs from 'fs';

const pbPath = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\conversations\\f1721082-34b8-46b4-bafe-4576da86c3ff.pb';

if (!fs.existsSync(pbPath)) {
  console.log('PB file does not exist');
  process.exit(1);
}

const buffer = fs.readFileSync(pbPath);
console.log(`Loaded PB file of size ${buffer.length} bytes.`);

// Print first 500 bytes as printable characters and hex
console.log('=== FIRST 500 BYTES ===');
let ascii = '';
let hex = '';
for (let i = 0; i < Math.min(500, buffer.length); i++) {
  const b = buffer[i];
  hex += b.toString(16).padStart(2, '0') + ' ';
  ascii += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
}
console.log('Hex:', hex.substring(0, 150));
console.log('Ascii:', ascii);

// Search for some known text like "App.jsx" or "useERPStore"
console.log('\n=== Search Tests ===');
const searchWords = ['App.jsx', 'useERPStore', 'HealthcareModule', 'FollowCursor', 'clarixLogo'];
searchWords.forEach(w => {
  const index = buffer.indexOf(Buffer.from(w, 'utf8'));
  console.log(`"${w}" utf8 index:`, index);
  const index16 = buffer.indexOf(Buffer.from(w, 'utf16le'));
  console.log(`"${w}" utf16le index:`, index16);
});
