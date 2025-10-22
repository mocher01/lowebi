# Script de création d'images temporaires pour Qalyarab

# Ce script crée des images placeholder en SVG pour tester le site
# À exécuter depuis la racine du projet

echo "🎨 Création d'images temporaires pour Qalyarab..."

mkdir -p configs/qalyarab/assets/

# 1. Logo temporaire (SVG converti en PNG plus tard)
cat > configs/qalyarab/assets/qalyarab-logo.svg << 'EOF'
<svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="60" fill="#B8860B" rx="8"/>
  <text x="100" y="25" font-family="serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">قلم عرب</text>
  <text x="100" y="45" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#DAA520">Qalyarab</text>
</svg>
EOF

# 2. Image hero temporaire
cat > configs/qalyarab/assets/qalyarab-hero.svg << 'EOF'
<svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#B8860B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B4513;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="600" fill="url(#bg)"/>
  <text x="600" y="250" font-family="serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">فن الخط العربي</text>
  <text x="600" y="320" font-family="sans-serif" font-size="24" text-anchor="middle" fill="#DAA520">L'art de la calligraphie arabe</text>
  <text x="600" y="380" font-family="sans-serif" font-size="18" text-anchor="middle" fill="white">Tradition millénaire • Apprentissage moderne</text>
</svg>
EOF

# 3. Favicon simple
cat > configs/qalyarab/assets/qalyarab-favicon.svg << 'EOF'
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#B8860B" rx="4"/>
  <text x="16" y="22" font-family="serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">ق</text>
</svg>
EOF

echo "✅ Images SVG temporaires créées dans configs/qalyarab/assets/"
echo "💡 Ces images seront converties automatiquement lors de la génération"

# Note: En production, il faudra convertir ces SVG en PNG/JPG/ICO selon les besoins
