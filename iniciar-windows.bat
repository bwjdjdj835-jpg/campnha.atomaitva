@echo off
chcp 65001 >nul
title Central de Agentes
cd /d "%~dp0"
echo.
echo  Central de Agentes - rodando no seu computador
echo  (os videos sao gravados pelo proprio computador, em MP4 nitido, sem pedir permissao)
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  Falta o Node.js. Baixe e instale em https://nodejs.org (botao LTS^) e abra este arquivo de novo.
  start "" https://nodejs.org
  pause
  exit /b
)

if not exist node_modules (
  echo  Instalando o app pela primeira vez (uns 2 minutos^)...
  call npm install
)

if not exist server\.env (
  copy .env.example server\.env >nul
  echo.
  echo  Cole as suas chaves no arquivo que vai abrir (as mesmas do Vercel: Settings - Environment Variables^),
  echo  salve e feche o Bloco de Notas para continuar.
  notepad server\.env
)

echo.
echo  Abrindo http://localhost:5173 ... (para fechar o app, feche esta janela)
start "" http://localhost:5173
call npm run dev