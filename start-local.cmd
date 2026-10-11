@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 22 LTS, then run this file again.
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  echo Missing built page. Run npm install and npm run build first.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:5173/ in your browser.
echo Keep this window open while using OmegaLog.
node scripts\serve.cjs
pause
