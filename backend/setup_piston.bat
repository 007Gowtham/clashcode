@echo off
echo ============================================
echo  ClashCode - Piston Setup
echo ============================================
echo.

echo [1/5] Starting Piston container...
docker-compose up -d piston
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Piston. Is Docker Desktop running?
    pause
    exit /b 1
)

echo [2/5] Waiting 10 seconds for Piston to initialize...
timeout /t 10 /nobreak

echo [3/5] Installing Python 3.10.0...
docker exec clashcode-piston piston pkg install python 3.10.0
if %errorlevel% neq 0 echo WARNING: Python install may have failed, retrying...
timeout /t 2 /nobreak

echo [4/5] Installing Node.js (JavaScript) 18.15.0...
docker exec clashcode-piston piston pkg install node 18.15.0
if %errorlevel% neq 0 echo WARNING: Node.js install may have failed, retrying...
timeout /t 2 /nobreak

echo [5a/5] Installing Java 15.0.2...
docker exec clashcode-piston piston pkg install java 15.0.2
if %errorlevel% neq 0 echo WARNING: Java install may have failed, retrying...
timeout /t 2 /nobreak

echo [5b/5] Installing GCC/C++ 10.2.0...
docker exec clashcode-piston piston pkg install gcc 10.2.0
if %errorlevel% neq 0 echo WARNING: GCC install may have failed, retrying...
timeout /t 2 /nobreak

echo.
echo ============================================
echo  Verifying installed packages...
echo ============================================
docker exec clashcode-piston piston ppman list

echo.
echo ============================================
echo  Piston setup complete!
echo  Code execution is ready on localhost:2000
echo ============================================
pause
