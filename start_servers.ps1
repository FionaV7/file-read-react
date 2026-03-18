# Kill any existing processes on ports 8000 and 5173
Write-Host "Checking for existing processes..." -ForegroundColor Yellow

# Kill processes on port 8000 (backend)
$backend = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backend) {
    Stop-Process -Id $backend.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "Killed process on port 8000" -ForegroundColor Green
}

# Kill processes on port 5173 (frontend)
$frontend = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontend) {
    Stop-Process -Id $frontend.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "Killed process on port 5173" -ForegroundColor Green
}

Start-Sleep -Seconds 2

# Start Backend
Write-Host "`nStarting Backend Server..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$backendPath`" && python -m uvicorn main:app --reload"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$frontendPath`" && npm run dev"

Write-Host "`nBoth servers are starting!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
