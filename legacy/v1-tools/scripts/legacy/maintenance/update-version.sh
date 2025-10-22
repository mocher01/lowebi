#!/bin/bash

# 🔄 SCRIPT DE MISE À JOUR AUTOMATIQUE DES VERSIONS
# Usage: ./scripts/update-version.sh [nouvelle-version] [description]
# Si aucune version fournie, lit VERSION.txt

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Récupérer la version depuis VERSION.txt ou argument
if [ ! -z "$1" ]; then
    NEW_VERSION="$1"
    VERSION_DESC="${2:-Mise à jour automatique}"
    
    # Mettre à jour VERSION.txt
    echo "$NEW_VERSION" > VERSION.txt
    echo -e "${BLUE}📝 VERSION.txt mis à jour: $NEW_VERSION${NC}"
else
    if [ -f "VERSION.txt" ]; then
        NEW_VERSION=$(cat VERSION.txt | tr -d '\\n')
        VERSION_DESC="${2:-Synchronisation versions}"
    else
        echo -e "${RED}❌ VERSION.txt introuvable et aucune version fournie${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}🔄 Mise à jour automatique vers: $NEW_VERSION${NC}"
echo -e "${BLUE}📝 Description: $VERSION_DESC${NC}"
echo ""

# 1. Mise à jour init.sh
echo -e "${YELLOW}🔧 Mise à jour init.sh...${NC}"
if [ -f "init.sh" ]; then
    # Remplacer la ligne VERSION="..."
    sed -i "s/^VERSION=.*/VERSION=\"$NEW_VERSION\"/" init.sh
    
    # Remplacer la description
    sed -i "s/^VERSION_DESC=.*/VERSION_DESC=\"$VERSION_DESC\"/" init.sh
    
    echo -e "${GREEN}✅ init.sh mis à jour${NC}"
else
    echo -e "${RED}❌ init.sh introuvable${NC}"
fi

# 2. Mise à jour package.json
echo -e "${YELLOW}🔧 Mise à jour package.json...${NC}"
if [ -f "package.json" ]; then
    # Convertir version (enlever le 'v' si présent)
    JSON_VERSION=$(echo "$NEW_VERSION" | sed 's/^v//')
    
    # Utiliser sed pour remplacer la version dans package.json
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$JSON_VERSION\"/" package.json
    
    echo -e "${GREEN}✅ package.json mis à jour${NC}"
else
    echo -e "${RED}❌ package.json introuvable${NC}"
fi

# 3. Mise à jour README.md
echo -e "${YELLOW}🔧 Mise à jour README.md...${NC}"
if [ -f "README.md" ]; then
    # Remplacer la ligne "Version actuelle"
    sed -i "s/\\*\\*Version actuelle.*/**Version actuelle :** $NEW_VERSION stable/" README.md
    
    echo -e "${GREEN}✅ README.md mis à jour${NC}"
else
    echo -e "${RED}❌ README.md introuvable${NC}"
fi

# 4. Mise à jour docs/VERSIONS.md si existe
echo -e "${YELLOW}🔧 Mise à jour docs/VERSIONS.md...${NC}"
if [ -f "docs/VERSIONS.md" ]; then
    # Remplacer "Version actuelle"
    sed -i "s/### \\*\\*Version actuelle\\*\\* : v[0-9.]*/### **Version actuelle** : $NEW_VERSION/" docs/VERSIONS.md
    
    echo -e "${GREEN}✅ docs/VERSIONS.md mis à jour${NC}"
else
    echo -e "${YELLOW}⚠️  docs/VERSIONS.md introuvable (pas critique)${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Vérification des mises à jour:${NC}"

# Vérification init.sh
if grep -q "VERSION=\"$NEW_VERSION\"" init.sh 2>/dev/null; then
    echo -e "${GREEN}✅ init.sh: VERSION=\"$NEW_VERSION\"${NC}"
else
    echo -e "${RED}❌ init.sh: Version non mise à jour${NC}"
fi

# Vérification package.json
JSON_VERSION=$(echo "$NEW_VERSION" | sed 's/^v//')
if grep -q "\"version\": \"$JSON_VERSION\"" package.json 2>/dev/null; then
    echo -e "${GREEN}✅ package.json: \"version\": \"$JSON_VERSION\"${NC}"
else
    echo -e "${RED}❌ package.json: Version non mise à jour${NC}"
fi

# Vérification README.md
if grep -q "Version actuelle.*$NEW_VERSION" README.md 2>/dev/null; then
    echo -e "${GREEN}✅ README.md: Version actuelle: $NEW_VERSION${NC}"
else
    echo -e "${RED}❌ README.md: Version non mise à jour${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Synchronisation des versions terminée !${NC}"
echo -e "${BLUE}📋 Résumé:${NC}"
echo "  • Version unique: $NEW_VERSION"
echo "  • Description: $VERSION_DESC"
echo "  • Fichiers mis à jour: VERSION.txt, init.sh, package.json, README.md"
echo ""
echo -e "${YELLOW}💡 Prochaine étape: Commit des changements${NC}"
echo "git add ."
echo "git commit -m \"$NEW_VERSION: $VERSION_DESC\""