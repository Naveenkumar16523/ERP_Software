import fs from 'fs';
import readline from 'readline';

const logPath = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\f1721082-34b8-46b4-bafe-4576da86c3ff\\.system_generated\\logs\\transcript.jsonl';
const targetSteps = [2610, 2611, 2612, 2613, 2614, 2615];

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
        console.log(`\n=================== STEP ${stepIndex} ===================`);
        console.log(`Source: ${obj.source}, Type: ${obj.type}, Status: ${obj.status}`);
        if (obj.tool_calls) {
          obj.tool_calls.forEach((tc, idx) => {
            console.log(`  Tool Call ${idx}: ${tc.name}`);
            if (tc.args) {
              console.log('  Args:');
              for (const [key, val] of Object.entries(tc.args)) {
                if (typeof val === 'string') {
                  console.log(`    ${key}: ${val}`);
                } else {
                  console.log(`    ${key}:`, JSON.stringify(val));
                }
              }
            }
          });
        }
        if (obj.content) {
          console.log(`Content: ${obj.content.substring(0, 1000)}`);
        }
      }
    } catch (e) {}
  }
}

main();
