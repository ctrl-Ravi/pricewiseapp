Write-Host "Starting PriceWiseApp..." -ForegroundColor Green
Set-Location -Path $PSScriptRoot
npm install
npm start
Read-Host -Prompt "Press Enter to exit" 