import fs from 'fs';
import readline from 'readline';

const logPath = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\f1721082-34b8-46b4-bafe-4576da86c3ff\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let stepCount = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    stepCount++;
    try {
      const obj = JSON.parse(line);
      const stepIndex = obj.step_index || stepCount;
      if (stepIndex > 1700) continue;
      
      if (obj.type === 'USER_INPUT' || obj.source === 'USER_EXPLICIT') {
        const text = (obj.content || '').substring(0, 150).replace(/\n/g, ' ');
        console.log(`Step ${stepIndex}: USER: ${text}`);
      }
    } catch (e) {
      // Ignored
    }
  }
}

main();
