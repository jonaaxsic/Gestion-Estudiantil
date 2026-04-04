@echo off
cd /d "%~dp0"
echo Iniciando servidor Django...
start "Django Server" python manage.py runserver 8000
echo Servidor iniciado. Presiona Enter para salir.
pause > nul
