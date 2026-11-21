@echo off
chcp 65001 >nul
title 迈从 K980 WebHID 网页驱动
echo 正在启动迈从 K980 现代网页端驱动...
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  python server.py
  goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 server.py
  goto :end
)

where python3 >nul 2>nul
if %errorlevel%==0 (
  python3 server.py
  goto :end
)

echo.
echo [错误] 未检测到 Python 3 环境，请先安装 Python 3 并勾选 "Add Python to PATH"。
echo 或直接使用支持 WebHID 的浏览器访问在线版。

:end
pause
