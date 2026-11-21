@echo off
setlocal
cd /d "%~dp0"

echo.
echo  Portfolio local preview
echo  -----------------------
echo  Starting a tiny web server in this folder.
echo  Open http://localhost:8000 in your browser.
echo  Press Ctrl+C to stop.
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    python -m http.server 8000
) else (
    where py >nul 2>nul
    if %errorlevel%==0 (
        py -3 -m http.server 8000
    ) else (
        echo Python was not found. Install Python from https://www.python.org/downloads/
        pause
    )
)
