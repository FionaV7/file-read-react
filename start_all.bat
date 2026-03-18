@echo off
echo Starting File Read Bot...
echo.
start "Backend Server" cmd /k "cd backend && py -3.11 -m uvicorn main:app --reload"
timeout /t 2 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"
echo.
echo Both servers are starting in separate windows!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause
