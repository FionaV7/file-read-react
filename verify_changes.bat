@echo off
echo ========================================
echo VERIFYING ALL CHANGES
echo ========================================
echo.

echo [1/6] Checking ThemeContext.jsx exists...
if exist "frontend\src\context\ThemeContext.jsx" (
    echo    ✓ ThemeContext.jsx created
) else (
    echo    ✗ ThemeContext.jsx NOT FOUND
)

echo.
echo [2/6] Checking App.jsx has ThemeProvider...
findstr /C:"ThemeProvider" "frontend\src\App.jsx" >nul
if %errorlevel%==0 (
    echo    ✓ App.jsx has ThemeProvider
) else (
    echo    ✗ App.jsx missing ThemeProvider
)

echo.
echo [3/6] Checking Navbar.jsx has theme toggle...
findstr /C:"toggleTheme" "frontend\src\components\Navbar.jsx" >nul
if %errorlevel%==0 (
    echo    ✓ Navbar.jsx has theme toggle
) else (
    echo    ✗ Navbar.jsx missing theme toggle
)

echo.
echo [4/6] Checking index.css has light theme styles...
findstr /C:"html.light" "frontend\src\index.css" >nul
if %errorlevel%==0 (
    echo    ✓ index.css has light theme styles
) else (
    echo    ✗ index.css missing light theme styles
)

echo.
echo [5/6] Checking Dashboard.jsx chat history fix...
findstr /C:"focus:bg-gray-700/30" "frontend\src\pages\Dashboard.jsx" >nul
if %errorlevel%==0 (
    echo    ✓ Dashboard.jsx chat history hover fixed
) else (
    echo    ✗ Dashboard.jsx chat history not fixed
)

echo.
echo [6/6] Checking GuestLogin.jsx has console logs...
findstr /C:"console.log" "frontend\src\pages\GuestLogin.jsx" >nul
if %errorlevel%==0 (
    echo    ✓ GuestLogin.jsx has debug logs
) else (
    echo    ✗ GuestLogin.jsx missing debug logs
)

echo.
echo ========================================
echo VERIFICATION COMPLETE
echo ========================================
echo.
echo Now run: start_all.bat
echo Then test the 3 fixes:
echo   1. Chat history hover (no white background)
echo   2. Theme toggle button in navbar
echo   3. Guest account file upload
echo.
pause
