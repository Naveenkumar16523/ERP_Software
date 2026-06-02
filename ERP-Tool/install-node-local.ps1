$url = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip"
$zipFile = Join-Path $pwd "node.zip"
$destFolder = Join-Path $pwd "node-local"

Write-Host "Downloading Node.js from $url..."
Invoke-WebRequest -Uri $url -OutFile $zipFile

Write-Host "Extracting to $destFolder..."
if (Test-Path $destFolder) {
    Remove-Item -Recurse -Force $destFolder
}
Expand-Archive -Path $zipFile -DestinationPath $destFolder

# Move files up from nested directory if needed
$nested = Join-Path $destFolder "node-v20.11.1-win-x64"
if (Test-Path $nested) {
    Get-ChildItem -Path $nested | Move-Item -Destination $destFolder
    Remove-Item $nested
}

Remove-Item $zipFile
Write-Host "Node.js installation completed!"
