@echo off
chcp 936 >nul 2>&1
cd /d "%~dp0"
setlocal

rem Force UTF-8 for Python so emoji in logs never crash the scripts
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"

echo ================================================
echo    Meayu の 拾光集 - 内容管理台
echo ================================================
echo.

set "PY_CMD="

py -3 --version >nul 2>&1
if %errorlevel% equ 0 set "PY_CMD=py -3"

if not defined PY_CMD (
    python --version >nul 2>&1
    if %errorlevel% equ 0 set "PY_CMD=python"
)

if not defined PY_CMD goto NOPYTHON

echo [1/2] 使用 Python: %PY_CMD%
%PY_CMD% -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>&1
if %errorlevel% neq 0 goto OLDPYTHON

echo [2/2] 正在启动（首次会自动检查依赖，可能稍慢）...
echo.
%PY_CMD% run_me.py
goto END

:NOPYTHON
echo [错误] 没有找到 Python。
echo.
echo 请安装 Python 3.10 或更高版本: https://www.python.org/downloads/
echo 安装时记得勾选 "Add Python to PATH"。
echo.
pause
exit /b 1

:OLDPYTHON
echo.
echo [错误] Python 版本过低，需要 3.10 或更高。当前:
%PY_CMD% --version
echo.
pause
exit /b 1

:END
echo.
echo [提示] 启动器已退出。若不是你主动关闭，上方信息即为原因。
pause
