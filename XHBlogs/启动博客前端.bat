@echo off
chcp 936 >nul 2>&1
cd /d "%~dp0"
setlocal

echo ================================================
echo    Meayu の 拾光集 - 博客前端
echo ================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 goto NONODE

for /f "tokens=*" %%v in ('node --version') do set "NODEVER=%%v"
echo [1/3] Node.js: %NODEVER%

if exist "node_modules" goto HAVEDEPS
echo [2/3] 首次运行，正在安装依赖（可能需要几分钟）...
call npm install
if %errorlevel% neq 0 goto NPMFAIL
goto STARTDEV

:HAVEDEPS
echo [2/3] 依赖已就绪。

:STARTDEV
echo [3/3] 启动开发服务器...
echo.
echo 启动后请在浏览器打开: http://localhost:3000
echo 关闭本窗口即可停止服务。
echo.
call npm run dev
goto END

:NONODE
echo [错误] 没有找到 Node.js。
echo.
echo 请安装 Node.js 18 或更高版本: https://nodejs.org/
echo.
pause
exit /b 1

:NPMFAIL
echo.
echo [错误] 依赖安装失败，请检查网络后重试。
echo.
pause
exit /b 1

:END
echo.
echo [提示] 服务器已停止。
pause
