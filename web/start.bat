@echo off
chcp 65001 >nul
title 迈从 K980 WebHID 网页驱动
echo 正在启动迈从 K980 现代网页端驱动...
cd /d "%~dp0"
python server.py
pause