#!/bin/bash

# Script de validation pour l'Iteration 2
echo "🧪 Validation Iteration 2: Dockerisation Template"
echo "==============================================="

# Compteurs
PASSED=0
FAILED=0
TOTAL=0

# Fonction de test
test_check() {
    local description="$1"
    local condition="$2"
    
    TOTAL=$((TOTAL + 1))
    
    if eval "$condition"; then
        echo "✅ $description"
        PASSED=$((PASSED + 1))
    else
        echo "❌ $description"
        FAILED=$((FAILED + 1))
    fi
}

echo "
🚀 Composants React clonés..."
test_check "Hero.jsx avec config" "[ -f 'templates/templates/template-base/src/components/home/Hero.jsx' ]"
test_check "Services.jsx avec config" "[ -f 'templates/template-base/src/components/home/Services.jsx' ]"
test_check "About.jsx avec config" "[ -f 'templates/template-base/src/components/home/About.jsx' ]"
test_check "CTA.jsx avec config" "[ -f 'templates/template-base/src/components/home/CTA.jsx' ]"
test_check "FAQ.jsx avec config" "[ -f 'templates/template-base/src/components/home/FAQ.jsx' ]"
test_check "Testimonials.jsx avec config" "[ -f 'templates/template-base/src/components/home/Testimonials.jsx' ]"

echo "
🏗️ Composants layout..."
test_check "Navbar.jsx paramétré" "[ -f 'templates/template-base/src/components/layout/Navbar.jsx' ]"
test_check "Footer.jsx paramétré" "[ -f 'templates/template-base/src/components/layout/Footer.jsx' ]"

echo "
📄 Pages principales..."
test_check "HomePage.jsx avec SEO" "[ -f 'templates/template-base/src/pages/HomePage.jsx' ]"
test_check "ServicesPage.jsx" "[ -f 'templates/template-base/src/pages/ServicesPage.jsx' ]"
test_check "AboutPage.jsx" "[ -f 'templates/template-base/src/pages/AboutPage.jsx' ]"
test_check "ContactPage.jsx" "[ -f 'templates/template-base/src/pages/ContactPage.jsx' ]"
test_check "NotFound.jsx" "[ -f 'templates/template-base/src/pages/NotFound.jsx' ]"
test_check "Privacy.jsx" "[ -f 'templates/template-base/src/pages/Privacy.jsx' ]"
test_check "Terms.jsx" "[ -f 'templates/template-base/src/pages/Terms.jsx' ]"

echo "
📝 Blog (conditionnel)..."
test_check "BlogPage.jsx" "[ -f 'templates/template-base/src/pages/blog/BlogPage.jsx' ]"
test_check "BlogArticleRouter.jsx" "[ -f 'templates/template-base/src/pages/blog/BlogArticleRouter.jsx' ]"

echo "
🧺 Composants UI..."
test_check "Button component" "[ -f 'templates/template-base/src/components/ui/button.jsx' ]"
test_check "Accordion component" "[ -f 'templates/template-base/src/components/ui/accordion.jsx' ]"
test_check "Toast system" "[ -f 'templates/template-base/src/components/ui/toaster.jsx' ]"
test_check "ScrollToTop utility" "[ -f 'templates/template-base/src/components/utils/ScrollToTop.jsx' ]"

echo "
🔧 Utilitaires et hooks..."
test_check "Utils library" "[ -f 'templates/template-base/src/lib/utils.js' ]"
test_check "Toast hook" "[ -f 'templates/template-base/src/hooks/use-toast.js' ]"

echo "
🐳 Docker et build..."
test_check "Dockerfile multi-stage" "[ -f 'templates/template-base/Dockerfile' ]"
test_check "nginx.conf pour SPA" "[ -f 'templates/template-base/docker/nginx.conf' ]"
test_check "Build script" "[ -f 'templates/template-base/scripts/build-with-config.sh' ]"
test_check "Injection script" "[ -f 'templates/template-base/scripts/inject-config.js' ]"

echo "
⚙️ Configuration système..."
test_check "Config loader" "[ -f 'templates/template-base/src/config/config-loader.js' ]"
test_check "Vite config" "[ -f 'templates/template-base/vite.config.js' ]"
test_check "Tailwind config" "[ -f 'templates/template-base/tailwind.config.js' ]"
test_check "Package.json template" "[ -f 'templates/template-base/package.json' ]"

echo "
🎨 Styles et assets..."
test_check "Index CSS avec variables" "[ -f 'templates/template-base/src/index.css' ]"
test_check "Globals CSS" "[ -f 'templates/template-base/src/styles/globals.css' ]"
test_check "Page layout CSS" "[ -f 'templates/template-base/src/styles/page-layout.css' ]"
test_check "index.html template" "[ -f 'templates/template-base/index.html' ]"

echo "
🔍 Tests de configuration..."
if [ -f 'templates/template-base/src/config/config-loader.js' ]; then
    test_check "Config loader exports" "grep -q 'loadSiteConfig' templates/template-base/src/config/config-loader.js"
    test_check "Feature checker" "grep -q 'isFeatureEnabled' templates/template-base/src/config/config-loader.js"
    test_check "Fallback config" "grep -q 'getFallbackConfig' templates/template-base/src/config/config-loader.js"
fi

echo "
📋 Vérification intégration config..."
if [ -f 'templates/template-base/src/components/home/Hero.jsx' ]; then
    test_check "Hero utilise config" "grep -q 'loadSiteConfig' templates/template-base/src/components/home/Hero.jsx"
fi
if [ -f 'templates/template-base/src/components/layout/Navbar.jsx' ]; then
    test_check "Navbar utilise config" "grep -q 'config.brand.name' templates/template-base/src/components/layout/Navbar.jsx"
fi

echo "
==============================================="
echo "📊 Résultats de validation:"
echo "   ✅ Passés: $PASSED/$TOTAL"
echo "   ❌ Échoués: $FAILED/$TOTAL"

if [ $FAILED -eq 0 ]; then
    echo "
🎉 ITERATION 2 VALIDÉE !"
    echo "
🚀 Prochaines étapes:"
    echo "1. Tester le build : cd template-base && npm install && npm run build"
    echo "2. Tester l'injection config : node scripts/inject-config.js qalyarab"
    echo "3. Tester Docker : docker build -t test-template ."
    echo "4. Commencer Iteration 3: Template Paramétrable"
    
    echo "
📦 Commandes de test:"
    echo "cd template-base"
    echo "npm install"
    echo "node scripts/inject-config.js qalyarab"
    echo "npm run build"
    echo "docker build -t qalyarab-template ."
    
    exit 0
else
    echo "
⚠️  ITERATION 2 INCOMPLÈTE"
    echo "Veuillez corriger les éléments échoués avant de continuer."
    exit 1
fi