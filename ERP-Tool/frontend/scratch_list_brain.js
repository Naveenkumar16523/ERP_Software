import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain';
if (fs.existsSync(brainDir)) {
  const dirs = fs.readdirSync(brainDir);
  console.log('Brain directories:', dirs);
  dirs.forEach(d => {
    const logFile = path.join(brainDir, d, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(logFile)) {
      console.log(`  Log exists for ${d}: size = ${fs.statSync(logFile).size}`);
    }
  });
} else {
  console.log('Brain directory does not exist');
}
