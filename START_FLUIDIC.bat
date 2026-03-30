@echo off
REM FLUIDIC System - Start Script for Windows
REM Starts both React dashboard and GA-VMD algorithm

echo.
echo =====================================
echo   FLUIDIC - Smart Pipeline Monitoring
echo =====================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start React dev server in new window
echo Starting React Dashboard on http://localhost:8081...
start "FLUIDIC Dashboard" cmd /k npm run dev

REM Wait a moment for React to start
timeout /t 3

REM Start GA-VMD algorithm in new window
echo Starting GA-VMD Algorithm...
start "GA-VMD Algorithm" cmd /k cd GA-VMD && python main.py

echo.
echo =====================================
echo Both services started!
echo.
echo Dashboard: http://localhost:8081
echo GA-VMD: Running in background, logs below
echo.
echo Close either terminal to stop that service
echo =====================================
echo.
pause
