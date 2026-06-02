$ErrorActionPreference = "Stop"

# Install uv if not installed
Write-Host "Installing uv (Python manager)..."
Invoke-WebRequest -Uri "https://astral.sh/uv/install.ps1" -OutFile "install_uv.ps1"
powershell -ExecutionPolicy Bypass -File .\install_uv.ps1
Remove-Item .\install_uv.ps1

# The uv binary is installed in $env:USERPROFILE\.local\bin by default
$uvPath = "$env:USERPROFILE\.local\bin\uv.exe"

if (-not (Test-Path $uvPath)) {
    $uvPath = "$env:USERPROFILE\.cargo\bin\uv.exe"
}

Write-Host "Found uv at $uvPath"

# Setup Backend
Write-Host "Setting up Backend Python environment..."
cd backend
if (Test-Path venv) { Remove-Item -Recurse -Force venv }
& $uvPath venv venv
& $uvPath pip install -r requirements.txt
cd ..

# Setup AI Services
Write-Host "Setting up AI Services Python environment..."
cd ai-services
if (Test-Path venv) { Remove-Item -Recurse -Force venv }
& $uvPath venv venv
& $uvPath pip install -r requirements.txt
cd ..

Write-Host "Python environments successfully created!"
