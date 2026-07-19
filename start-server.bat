@echo off
echo Starting Local Server on http://localhost:8080...
echo.
echo Open browser and go to: http://localhost:8080
echo Press Ctrl+C to stop server
echo.
cd /d "%~dp0"

:: Check if http-server is installed globally
where http-server >nul 2>&1
if %errorlevel% equ 0 (
    echo Using global http-server...
    http-server -p 8080 -c-1
) else (
    echo Installing http-server globally...
    npm install -g http-server
    if %errorlevel% equ 0 (
        http-server -p 8080 -c-1
    ) else (
        echo.
        echo ERROR: Failed to install http-server
        echo Please install Node.js first: https://nodejs.org
        pause
        exit /b 1
    )
)

pause
