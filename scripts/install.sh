#!/bin/bash
set -e

echo "=== Shrutibox Digital - Instalación ==="
echo ""

if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js no está instalado."
  echo "Instálalo desde https://nodejs.org/ o con: brew install node"
  exit 1
fi

echo "Node.js: $(node --version)"
echo "npm:     $(npm --version)"
echo ""

echo "Instalando dependencias..."
npm install

echo ""
echo "Instalación completada correctamente."
echo "Ejecuta 'npm run dev' para iniciar el servidor de desarrollo."
