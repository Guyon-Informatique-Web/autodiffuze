#!/bin/bash
# Script de generation du dossier statique pour Netlify Drop
# Telecharge les pages publiques depuis le site Vercel deploye
# Usage : bash scripts/netlify-export.sh

set -e

SITE_URL="https://autodiffuze.vercel.app"
OUTPUT_DIR="./netlify-drop"

echo "-- Nettoyage du dossier precedent..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "-- Telechargement des pages publiques depuis $SITE_URL..."
wget \
  --mirror \
  --convert-links \
  --adjust-extension \
  --page-requisites \
  --no-host-directories \
  --directory-prefix="$OUTPUT_DIR" \
  --reject-regex='/(dashboard|api/)' \
  --domains=autodiffuze.vercel.app \
  --no-verbose \
  "$SITE_URL/" 2>&1 || true

echo "-- Telechargement des icones de plateformes..."
mkdir -p "$OUTPUT_DIR/platforms"
for icon in facebook.svg instagram.svg linkedin.svg x.svg tiktok.svg; do
  wget -q -O "$OUTPUT_DIR/platforms/$icon" "$SITE_URL/platforms/$icon" 2>/dev/null || true
done

echo "-- Nettoyage des fichiers..."
# Corriger le favicon avec query string
if [ -f "$OUTPUT_DIR/favicon.ico?favicon.0b3bf435.ico" ]; then
  mv "$OUTPUT_DIR/favicon.ico?favicon.0b3bf435.ico" "$OUTPUT_DIR/favicon.ico"
fi
# Renommer les fichiers favicon avec query string (variantes possibles)
find "$OUTPUT_DIR" -maxdepth 1 -name 'favicon.ico*' -not -name 'favicon.ico' -exec mv {} "$OUTPUT_DIR/favicon.ico" \; 2>/dev/null || true

echo ""
echo "====================================="
echo "  Dossier pret : $OUTPUT_DIR"
echo "  Taille : $(du -sh "$OUTPUT_DIR" | cut -f1)"
echo "  Fichiers : $(find "$OUTPUT_DIR" -type f | wc -l)"
echo "====================================="
echo ""
echo "  Pour deployer : glissez-deposez le dossier 'netlify-drop'"
echo "  sur https://app.netlify.com/drop"
echo ""
echo "  ATTENTION : les pages login/register/dashboard ne fonctionneront"
echo "  pas sur Netlify Drop (pas de serveur). Seules les pages marketing"
echo "  (accueil, tarifs, fonctionnalites, legal) seront navigables."
echo ""
