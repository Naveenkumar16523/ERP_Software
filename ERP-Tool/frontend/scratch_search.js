import fs from 'fs';
import readline from 'readline';

const logPath = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\4852afcc-b7cc-4caf-9e2b-12e944e83689\\.system_generated\\logs\\transcript.jsonl';

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
      
      if (contentStr.includes('HealthcareModule') && contentStr.includes('write_to_file')) {
        console.log(`Step ${stepIndex}: source=${obj.source}, type=${obj.type}`);
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
              console.log(`  Tool: ${tc.name}, TargetFile: ${tc.args.TargetFile}`);
              if (tc.args.CodeContent) {
                console.log(`    CodeContent Length: ${tc.args.CodeContent.length}`);
              }
            }
          });
        }
      }
    } catch (e) {}
  }
}

main();
