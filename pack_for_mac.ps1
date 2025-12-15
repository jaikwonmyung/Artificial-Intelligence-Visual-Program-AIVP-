$sourceDir = "C:\Users\GENTLE MONSTER\.gemini\antigravity\playground\GM"
$destZip = "$PSScriptRoot\GM_Mac_Export.zip"

write-host "Packing source code..."

# Remove old zip if exists
if (Test-Path $destZip) { Remove-Item $destZip }

# Get items excluding node_modules, .git, etc
$items = Get-ChildItem -Path $sourceDir -Exclude "node_modules", ".git", "dist", ".gemini", "*.zip"

# Compress
Compress-Archive -Path $items.FullName -DestinationPath $destZip -Force

write-host "Done! Zip created at: $destZip"
