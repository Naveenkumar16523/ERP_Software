import fs from 'fs';
import readline from 'readline';

const logPath = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\f1721082-34b8-46b4-bafe-4576da86c3ff\\.system_generated\\logs\\transcript.jsonl';

function cleanString(str) {
  if (!str) return '';
  if (str.startsWith('"') && str.endsWith('"')) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return str.slice(1, -1);
    }
  }
  return str;
}

async function main() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.step_index === 687 && obj.tool_calls) {
        obj.tool_calls.forEach(tc => {
          console.log('=== Step 687 TargetContent ===');
          console.log(cleanString(tc.args.TargetContent));
          console.log('=== Step 687 ReplacementContent ===');
          console.log(cleanString(tc.args.ReplacementContent));
        });
      }
    } catch (e) {}
  }
}

main();
