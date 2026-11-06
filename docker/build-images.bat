@echo off
echo Building Java 21 runner image...
docker build -t clashcode/java:runner -f docker\java\Dockerfile docker\java
if %errorlevel% neq 0 exit /b %errorlevel%

echo Building Python 3.12 runner image...
docker build -t clashcode/python:runner -f docker\python\Dockerfile docker\python
if %errorlevel% neq 0 exit /b %errorlevel%

echo Building GCC C++ runner image...
docker build -t clashcode/cpp:runner -f docker\cpp\Dockerfile docker\cpp
if %errorlevel% neq 0 exit /b %errorlevel%

echo Building Node.js LTS runner image...
docker build -t clashcode/javascript:runner -f docker\javascript\Dockerfile docker\javascript
if %errorlevel% neq 0 exit /b %errorlevel%

echo All ClashCode runner images built successfully!

