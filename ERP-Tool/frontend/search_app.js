import fs from 'fs';
import readline from 'readline';

const logPath = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\f1721082-34b8-46b4-bafe-4576da86c3ff\\.system_generated\\logs\\transcript.jsonl';

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
      if (obj.tool_calls) {
        obj.tool_calls.forEach(tc => {
          if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
            const args = tc.args;
            const target = args?.TargetFile || args?.TargetFile;
            if (target && target.toLowerCase().includes('app.jsx')) {
              console.log(`Step ${obj.step_index} (${tc.name})`);
              console.log('Keys:', Object.keys(args));
              if (args.CodeContent) {
                console.log('CodeContent snippet:', args.CodeContent.slice(0, 150));
              }
              if (args.ReplacementContent) {
                console.log('ReplacementContent snippet:', args.ReplacementContent.slice(0, 150));
              }
            }
          }
        });
      }
    } catch (e) {}
  }
}

main();
