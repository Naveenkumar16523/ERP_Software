import fs from 'fs';
import readline from 'readline';
import path from 'path';

const logPath = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\4852afcc-b7cc-4caf-9e2b-12e944e83689\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  if (!fs.existsSync(logPath)) {
    console.log('Log file does not exist:', logPath);
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
      const contentStr = JSON.stringify(obj);
      
      if (contentStr.includes('export default function HealthcareModule')) {
        console.log(`Step ${obj.step_index || stepCount} contains export default function HealthcareModule!`);
        // Let's print out what tool calls were made or where it is
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            console.log(`  Tool: ${tc.name}`);
            if (tc.args && tc.args.CodeContent) {
              console.log(`  CodeContent starts with: ${tc.args.CodeContent.substring(0, 150)}`);
              console.log(`  CodeContent length: ${tc.args.CodeContent.length}`);
              // If it's the full file, let's write it to a temp file
              const cleanCode = tc.args.CodeContent;
              fs.writeFileSync(`c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/restored_healthcare_original.js`, cleanCode, 'utf8');
              console.log('  Saved original healthcare module to restored_healthcare_original.js');
            }
          });
        }
        if (obj.content && obj.content.includes('export default function HealthcareModule')) {
          console.log(`  Found in step content (length: ${obj.content.length})`);
        }
      }
      
      if (contentStr.includes('export default function AgricultureModule')) {
        console.log(`Step ${obj.step_index || stepCount} contains export default function AgricultureModule!`);
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            if (tc.args && tc.args.CodeContent) {
              fs.writeFileSync(`c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/restored_agriculture_original.js`, tc.args.CodeContent, 'utf8');
              console.log('  Saved original agriculture module to restored_agriculture_original.js');
            }
          });
        }
      }
      
      if (contentStr.includes('export default function BankingModule')) {
        console.log(`Step ${obj.step_index || stepCount} contains export default function BankingModule!`);
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            if (tc.args && tc.args.CodeContent) {
              fs.writeFileSync(`c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/restored_banking_original.js`, tc.args.CodeContent, 'utf8');
              console.log('  Saved original banking module to restored_banking_original.js');
            }
          });
        }
      }
      
      if (contentStr.includes('export default function EducationModule')) {
        console.log(`Step ${obj.step_index || stepCount} contains export default function EducationModule!`);
        if (obj.tool_calls) {
          obj.tool_calls.forEach(tc => {
            if (tc.args && tc.args.CodeContent) {
              fs.writeFileSync(`c:/Users/sudha/Downloads/ERP-Tool/ERP-Tool/frontend/restored_education_original.js`, tc.args.CodeContent, 'utf8');
              console.log('  Saved original education module to restored_education_original.js');
            }
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}

main();
