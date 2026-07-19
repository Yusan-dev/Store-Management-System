@echo off
echo Creating deployable WAR package for Tomcat...
echo.
cd /d "%~dp0"

:: Create META-INF if not exists
if not exist "META-INF" mkdir "META-INF"

:: Create context.xml if not exists
if not exist "META-INF\context.xml" (
    echo ^<?xml version="1.0" encoding="UTF-8"?^> > "META-INF\context.xml"
    echo ^<Context path="/dashboard" /^> >> "META-INF\context.xml"
)

echo Packaging files...
powershell -Command "& { Compress-Archive -Path * -DestinationPath 'dashboard.war' -Force }"

echo.
echo ========================================
echo Deployment package created: dashboard.war
echo.
echo How to deploy:
echo 1. Copy dashboard.war to tomcat/webapps/
echo 2. Restart Tomcat or wait for auto-deploy
echo 3. Access: http://localhost:8080/dashboard
echo ========================================
echo.
pause
