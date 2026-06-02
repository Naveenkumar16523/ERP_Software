import fs from 'fs';
import readline from 'readline';

const logPath = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\b993cdab-deaa-44ad-8d73-e68c0fe08022\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  if (!fs.existsSync(logPath)) {
    console.error("Log file not found at " + logPath);
    return;
  }
  
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
      
      if (contentStr.toLowerCase().includes('healthcaremodule')) {
        console.log(`Step ${stepIndex}: source=${obj.source}, type=${obj.type}`);
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            console.log(`  Tool: ${tc.name}`);
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
