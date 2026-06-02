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
      const contentStr = JSON.stringify(obj);
      
      if (contentStr.includes('_dump.txt')) {
        console.log(`Step ${stepIndex}: source=${obj.source}, type=${obj.type}`);
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            console.log(`  Tool Call: ${tc.name}`);
            if (tc.args && tc.args.TargetFile) {
              console.log(`    TargetFile: ${tc.args.TargetFile}`);
            }
          });
        }
      }
    } catch (e) {}
  }
}

main();
