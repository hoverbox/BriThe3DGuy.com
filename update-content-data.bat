@echo off
cd /d "%~dp0"
python tools\build_content.py
if errorlevel 1 (
  echo.
  echo Build failed. Make sure Python and PyYAML are installed.
  pause
  exit /b 1
)
echo.
echo Tutorial and download data updated from the four Markdown content files.
pause
