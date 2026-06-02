$env:GIT_TERMINAL_PROMPT = "0"
$stdout = ""

$stdout += "=== GIT STATUS ===`n"
$res = git status 2>&1
$stdout += ($res | Out-String) + "`n"

$stdout += "=== GIT ADD ===`n"
$res = git add -A 2>&1
$stdout += ($res | Out-String) + "`n"

$stdout += "=== GIT COMMIT ===`n"
$res = git commit -m "Update ERP Tool components" 2>&1
$stdout += ($res | Out-String) + "`n"

$stdout += "=== GIT PUSH ===`n"
$res = git push -u origin main 2>&1
$stdout += ($res | Out-String) + "`n"

Set-Content -Path "git_output.txt" -Value $stdout
