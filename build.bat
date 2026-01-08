@echo off
setlocal enabledelayedexpansion

set "ERR_PREFIX=[ERROR]"
set "OK_PREFIX=[OK]"
set "INFO_PREFIX=[INFO]"

REM --- Go to root (where this bat is) ---
cd /d "%~dp0"
set "ROOT_DIR=%cd%"
set "PY_DIR=%ROOT_DIR%\python"
set "REQ_FILE=%PY_DIR%\bs_requirements.txt"
set "VENV_DIR=%PY_DIR%\venv"

echo.
echo ============================================================
echo   Environment Setup - Python 3.8.20 + Node + venv
echo   Root : %ROOT_DIR%
echo   PyDir: %PY_DIR%
echo ============================================================
echo.

REM ---------- 0) check files ----------
if not exist "%PY_DIR%\" (
  echo %ERR_PREFIX% Missing folder: %PY_DIR%
  echo %INFO_PREFIX% Expected structure: main\python\bs_requirements.txt
  exit /b 10
)

if not exist "%REQ_FILE%" (
  echo %ERR_PREFIX% Missing file: %REQ_FILE%
  echo %INFO_PREFIX% Please ensure bs_requirements.txt is at: %REQ_FILE%
  exit /b 11
)

REM ---------- 1) Check Node/npm ----------
where npm >nul 2>&1
if errorlevel 1 (
  echo %ERR_PREFIX% npm not found in PATH.
  echo %INFO_PREFIX% Please install Node.js (includes npm) and reopen terminal.
  echo %INFO_PREFIX% Check commands:
  echo   node -v
  echo   npm -v
  exit /b 20
) else (
  for /f "tokens=* delims=" %%v in ('npm -v 2^>nul') do set "NPM_VER=%%v"
  echo %OK_PREFIX% npm found. Version: %NPM_VER%
)

where node >nul 2>&1
if errorlevel 1 (
  echo %ERR_PREFIX% node not found in PATH.
  echo %INFO_PREFIX% Please reinstall Node.js properly.
  exit /b 21
) else (
  for /f "tokens=* delims=" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
  echo %OK_PREFIX% node found. Version: %NODE_VER%
)

REM ---------- 2) Detect Python 3.8.20 ----------
set "PY_CMD="
set "PY_VER="

where py >nul 2>&1
if not errorlevel 1 (
  for /f "tokens=* delims=" %%v in ('py -3.8 -c "import sys; print('.'.join(map(str, sys.version_info[:3])))" 2^>nul') do set "PY_VER=%%v"
  if not "%PY_VER%"=="" (
    set "PY_CMD=py -3.8"
    echo %OK_PREFIX% Found Python via launcher: %PY_VER%
  )
)

if "%PY_CMD%"=="" (
  where python >nul 2>&1
  if not errorlevel 1 (
    for /f "tokens=* delims=" %%v in ('python -c "import sys; print('.'.join(map(str, sys.version_info[:3])))" 2^>nul') do set "PY_VER=%%v"
    if not "%PY_VER%"=="" (
      set "PY_CMD=python"
      echo %OK_PREFIX% Found Python in PATH: %PY_VER%
    )
  )
)

if "%PY_CMD%"=="" (
  echo %ERR_PREFIX% Python not found.
  echo %INFO_PREFIX% You MUST have Python 3.8.20 installed.
  echo %INFO_PREFIX% If you have conda, run:
  echo   conda create -n py38 python=3.8.20
  echo   conda activate py38
  echo   python -m venv "%VENV_DIR%"
  exit /b 30
)

if not "%PY_VER%"=="3.8.20" (
  echo %ERR_PREFIX% Python version mismatch. Required: 3.8.20, Current: %PY_VER%
  echo %INFO_PREFIX% Fix options:
  echo   Install Python 3.8.20 and ensure "py -3.8" works
  echo   Or conda: conda create -n py38 python=3.8.20
  exit /b 31
)
echo %OK_PREFIX% Python requirement satisfied: %PY_VER%

REM ---------- 3) Install Node dependencies in ROOT ----------
echo.
echo %INFO_PREFIX% Installing Node packages in: %ROOT_DIR%
pushd "%ROOT_DIR%"
call npm install
if errorlevel 1 (
  popd
  echo %ERR_PREFIX% npm install failed.
  exit /b 40
)
popd
echo %OK_PREFIX% npm install completed.

REM ---------- 4) Create venv under python\venv ----------
echo.
if exist "%VENV_DIR%\Scripts\python.exe" (
  echo %OK_PREFIX% venv already exists: %VENV_DIR%
) else (
  echo %INFO_PREFIX% Creating venv at: %VENV_DIR%
  call %PY_CMD% -m venv "%VENV_DIR%"
  if errorlevel 1 (
    echo %ERR_PREFIX% Failed to create venv.
    exit /b 50
  )
  echo %OK_PREFIX% venv created.
)

REM ---------- 5) Activate venv ----------
echo.
if not exist "%VENV_DIR%\Scripts\activate.bat" (
  echo %ERR_PREFIX% venv activation script not found: %VENV_DIR%\Scripts\activate.bat
  exit /b 51
)
call "%VENV_DIR%\Scripts\activate.bat"
if errorlevel 1 (
  echo %ERR_PREFIX% Failed to activate venv.
  exit /b 52
)
echo %OK_PREFIX% venv activated.

REM ---------- 6) Upgrade pip + install requirements ----------
echo.
echo %INFO_PREFIX% Upgrading pip...
python -m pip install --upgrade pip
if errorlevel 1 (
  echo %ERR_PREFIX% pip upgrade failed.
  exit /b 60
)
echo %OK_PREFIX% pip upgraded.

echo.
echo %INFO_PREFIX% Installing Python requirements from: %REQ_FILE%
pip install -r "%REQ_FILE%"
if errorlevel 1 (
  echo %ERR_PREFIX% pip install failed.
  echo %INFO_PREFIX% If fenxiaaa.py later shows "fiona has no attribute path", try:
  echo   pip uninstall fiona
  exit /b 61
)
echo %OK_PREFIX% Python dependencies installed.

echo.
echo ============================================================
echo %OK_PREFIX% Environment setup completed successfully.
echo %INFO_PREFIX% Next time activate venv with:
echo   "%VENV_DIR%\Scripts\activate.bat"
echo ============================================================
echo.

exit /b 0
