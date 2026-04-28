@echo off
chcp 65001 >nul 2>nul
title EduTrack Launcher
color 0A

echo ===========================================
echo    EduTrack System - Launcher
echo ===========================================
echo.

echo [1/2] Starting backend server (port 3000)...
start "EduTrack-Server" cmd /k "cd /d c:\Users\mimo\Desktop\Edu\server && npm run dev"
timeout /t 5 /nobreak >nul

echo [2/2] Starting frontend server...
start "EduTrack-Client" cmd /k "cd /d c:\Users\mimo\Desktop\Edu\client && npm run dev"
timeout /t 8 /nobreak >nul

echo.
echo ===========================================
echo    Opening browser...
echo ===========================================
start http://localhost:5173/

echo.
echo DONE! Services are running.
echo.
echo Info:
echo   Backend port: 3000
echo   Frontend port: 5173 (or 5174)
echo   Admin account: admin / admin123
echo.
echo To stop: close the other two windows.
echo.
pause
