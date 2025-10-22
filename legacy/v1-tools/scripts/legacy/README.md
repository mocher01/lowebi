# 🛠️ Scripts Directory Organization

## 📁 Structure

### `core/` - Scripts Essentiels
Scripts critiques pour le fonctionnement du générateur :
- `generate-site.sh` - Génération des sites
- `setup.sh` - Configuration initiale
- `create-new-site.sh` - Création nouveaux sites
- `deploy-to-nginx.sh` - Déploiement nginx

### `test/` - Scripts de Test
Scripts de validation et tests :
- `test-*.sh` - Tests de fonctionnalités
- `validate-*.sh` - Validation configurations
- `demo-markdown-system.sh` - Démo système Markdown

### `maintenance/` - Scripts Utilitaires
Scripts de maintenance et génération :
- `update-version.sh` - Mise à jour versions
- `generate-blog-articles.sh` - Génération articles
- `generate-layout-css.js` - Génération CSS
- `inject-html-config.js` - Injection configuration
- `validate-config.js` - Validation JSON

### `archive/` - Scripts Obsolètes
Scripts historiques ou spécifiques à d'anciennes versions :
- `fix-*.sh` - Corrections spécifiques
- `analyze-locodai.sh` - Analyse ancienne
- `clean-temp-fixes.sh` - Nettoyages temporaires

## 🚀 Usage Principal

```bash
# Déploiement standard
./core/generate-site.sh qalyarab --build --docker

# Tests
./test/validate-generation.sh

# Maintenance
./maintenance/update-version.sh v1.1.2
```

## 📝 Ajout de Nouveaux Scripts

- **Scripts critiques** → `core/`
- **Scripts de test** → `test/`
- **Scripts utilitaires** → `maintenance/`
- **Scripts temporaires** → `archive/` (après usage)