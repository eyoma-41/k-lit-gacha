@echo off
cd /d "%~dp0"
echo 한국소설 가챠 페이지를 시작합니다.
echo 브라우저에서 http://127.0.0.1:5173/ 를 열어주세요.
echo 이 창을 닫으면 페이지도 꺼집니다.
node static-server.cjs
pause
