const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// --- Color Helper Functions ---
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function logWithPrefix(prefix, color, data) {
  const lines = data.toString().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      console.log(`${color}[${prefix}]${COLORS.reset} ${line}`);
    }
  });
}

const processes = [];

// 1. Start Frontend (Vite)
function startFrontend() {
  console.log(`${COLORS.bright}${COLORS.cyan}[System] Starting Frontend...${COLORS.reset}`);
  
  const child = spawn('npm', ['run', 'dev', '-w', 'frontend'], { 
    shell: true,
    cwd: __dirname
  });
  
  child.stdout.on('data', data => logWithPrefix('Frontend', COLORS.cyan, data));
  child.stderr.on('data', data => logWithPrefix('Frontend ERROR', COLORS.red, data));
  processes.push({ name: 'Frontend', child });
}

// 2. Start Backend (Python FastAPI)
function startBackend() {
  console.log(`${COLORS.bright}${COLORS.magenta}[System] Starting Backend...${COLORS.reset}`);
  
  const backendDir = path.join(__dirname, 'backend');
  let pythonPath = 'python'; // Fallback
  
  // Detect virtual environment python path
  const venvScriptsWin = path.join(backendDir, 'venv', 'Scripts', 'python.exe');
  const venvBinUnix = path.join(backendDir, 'venv', 'bin', 'python');
  
  if (fs.existsSync(venvScriptsWin)) {
    pythonPath = venvScriptsWin;
    console.log(`${COLORS.dim}[System] Found Windows Python venv for backend at: ${pythonPath}${COLORS.reset}`);
  } else if (fs.existsSync(venvBinUnix)) {
    pythonPath = venvBinUnix;
    console.log(`${COLORS.dim}[System] Found Unix Python venv for backend at: ${pythonPath}${COLORS.reset}`);
  } else {
    console.log(`${COLORS.yellow}[System] Python venv for backend not found. Using system 'python'...${COLORS.reset}`);
  }
  
  const child = spawn(pythonPath, ['-m', 'uvicorn', 'app.main:app', '--port', '5000'], { 
    cwd: backendDir,
    shell: process.platform === 'win32'
  });
  
  child.stdout.on('data', data => logWithPrefix('Backend', COLORS.magenta, data));
  child.stderr.on('data', data => logWithPrefix('Backend', COLORS.dim, data));
  processes.push({ name: 'Backend', child });
}

// 3. Start AI Service (Python FastAPI)
function startAIService() {
  console.log(`${COLORS.bright}${COLORS.green}[System] Starting AI Service...${COLORS.reset}`);
  
  const aiDir = path.join(__dirname, 'ai-services');
  let pythonPath = 'python'; // Fallback
  
  // Detect virtual environment python path
  const venvScriptsWin = path.join(aiDir, 'venv', 'Scripts', 'python.exe');
  const venvBinUnix = path.join(aiDir, 'venv', 'bin', 'python');
  
  if (fs.existsSync(venvScriptsWin)) {
    pythonPath = venvScriptsWin;
    console.log(`${COLORS.dim}[System] Found Windows Python venv at: ${pythonPath}${COLORS.reset}`);
  } else if (fs.existsSync(venvBinUnix)) {
    pythonPath = venvBinUnix;
    console.log(`${COLORS.dim}[System] Found Unix Python venv at: ${pythonPath}${COLORS.reset}`);
  } else {
    console.log(`${COLORS.yellow}[System] Python venv not found. Using system 'python'...${COLORS.reset}`);
  }
  
  const child = spawn(pythonPath, ['main.py'], { 
    cwd: aiDir,
    shell: process.platform === 'win32'
  });
  
  child.stdout.on('data', data => logWithPrefix('AI Service', COLORS.green, data));
  child.stderr.on('data', data => logWithPrefix('AI Service', COLORS.dim, data));
  processes.push({ name: 'AI Service', child });
}

// Ensure cleanup on exit
function cleanup() {
  console.log(`\n${COLORS.bright}${COLORS.red}[System] Shutting down all services...${COLORS.reset}`);
  processes.forEach(proc => {
    console.log(`${COLORS.dim}Killing ${proc.name}...${COLORS.reset}`);
    proc.child.kill();
  });
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Run all
console.log(`${COLORS.bright}${COLORS.yellow}=== ERP Dashboard Startup Script ===${COLORS.reset}\n`);
startFrontend();
startBackend();
startAIService();
