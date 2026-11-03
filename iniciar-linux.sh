#!/usr/bin/env bash
# Script para iniciar o Sistema Financeiro & Obra no Linux

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "Iniciando Sistema Financeiro & Obra..."
npx electron . "$@"
