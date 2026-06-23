import fs from 'fs';
import readline from 'readline';

const logPath = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\f1721082-34b8-46b4-bafe-4576da86c3ff\\.system_generated\\logs\\transcript.jsonl';
const targetSteps = [1019, 1101, 1109, 1174];

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
      
      if (targetSteps.includes(stepIndex)) {
        console.log(`Step ${stepIndex}:`);
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            if (tc.args && tc.args.CodeContent) {
              console.log(`  CodeContent length: ${tc.args.CodeContent.length}`);
              console.log(`  Ends with truncated? ${tc.args.CodeContent.includes('truncated')}`);
              console.log(`  Last 100 chars: ${tc.args.CodeContent.substring(tc.args.CodeContent.length - 100)}`);
            }
          });
        }
      }
    } catch (e) {}
  }
}

main();
