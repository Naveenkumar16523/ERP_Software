# PowerShell script to fix all stringified JSX/JS files
# These files have their code stored as a JavaScript string literal (the source
# code was accidentally written wrapped in quotes with \n escape sequences).

$frontendSrc = "C:\Users\Welcome\OneDrive\Documents\ERP-Tool\ERP-Tool\frontend\src"
$fixed = 0
$skipped = 0

function Unescape-JsString {
    param ([string]$s)
    # Remove outer quotes
    $s = $s.TrimStart('"').TrimEnd('"')
    # Unescape common JavaScript string sequences
    $s = $s -replace '\\n', "`n"
    $s = $s -replace '\\r', "`r"
    $s = $s -replace '\\t', "`t"
    $s = $s -replace '\\"', '"'
    $s = $s -replace "\\'" , "'"
    $s = $s -replace '\\\\', '\'
    return $s
}

Get-ChildItem -Path $frontendSrc -Recurse -Include "*.jsx","*.js","*.ts","*.tsx" | ForEach-Object {
    $file = $_.FullName
    $raw = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    $trimmed = $raw.Trim()
    
    # Check if file starts with a quote AND contains \n escape sequences (stringified)
    if (($trimmed.StartsWith('"') -or $trimmed.StartsWith("'")) -and $trimmed.Contains('\n')) {
        Write-Host "Fixing: $file"
        $unescaped = Unescape-JsString -s $trimmed
        [System.IO.File]::WriteAllText($file, $unescaped, [System.Text.Encoding]::UTF8)
        $fixed++
    } else {
        $skipped++
    }
}

Write-Host "`nDone! Fixed: $fixed | Skipped (already OK): $skipped"
