import fs from 'fs';

const path = 'C:\\Users\\sudha\\.gemini\\antigravity-ide\\brain\\f1721082-34b8-46b4-bafe-4576da86c3ff\\.system_generated\\messages\\40e44b7b-bf6d-429f-81b7-5d64c097af47.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

console.log("Keys:", Object.keys(data));
if (data.prompt) {
  console.log("Prompt length:", data.prompt.length);
  console.log("Prompt start:", data.prompt.substring(0, 500));
}
if (data.response) {
  console.log("Response length:", data.response.length);
  console.log("Response start:", data.response.substring(0, 500));
}
console.log("Data sample:", JSON.stringify(data).substring(0, 1000));
