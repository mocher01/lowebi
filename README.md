# 🚀 Website Generator

Générateur automatisé de sites web basé sur template Locod.AI avec système de blog Markdown intégré et **traitement d'images intelligent**.

> ⚠️ **Important**: Version 2.0 en développement! Voir [Issue #44](https://github.com/mocher01/website-generator/issues/44) et [Roadmap v2.0](docs/project/ROADMAP-v2.md) pour la refonte complète avec NestJS + Next.js.

## 🔥 DÉPLOIEMENT COMPLET EN UNE COMMANDE (v1.1.1.9.1 n8n Integration)

```bash
cd /var/apps/
rm -rf website-generator
git clone https://github.com/mocher01/website-generator.git
cd website-generator
./init.sh translatepro --docker
```

## 🎯 Démarrage rapide

```bash
# Générer et déployer TranslatePro
./init.sh translatepro --docker

# Test de l'installation
curl -I http://162.55.213.90:3003
```

## 📝 Système Blog Markdown ✅ COMPLET

### Nouvelles fonctionnalités

- **📄 Contenu Markdown** : Articles riches dans `content/blog/`
- **🔄 Fallback automatique** : Compatible avec l'ancien système JSON
- **📊 Indicateurs visuels** : Source du contenu clairement identifiée
- **🎨 Styles adaptatifs** : CSS automatique pour contenu riche
- **⚡ Parser intégré** : Sans dépendances externes

### Commandes Markdown

```bash
# Test complet du système Markdown
./init.sh qalyarab --test-markdown

# Démonstration interactive
./scripts/demo-markdown-system.sh

# Tests de validation
./scripts/test-markdown-v1117.sh

# Génération avec contenu Markdown
./init.sh qalyarab --docker
```

### Structure des articles

```markdown
---
title: "Titre de l'article"
excerpt: "Description courte"
date: "2024-01-15"
author: "Auteur"
category: "Catégorie"
tags: ["tag1", "tag2"]
image: "blog/image.jpg"
slug: "url-article"
---

# Contenu de l'article

Votre contenu en Markdown...
```

## 📚 Documentation complète

- **[📚 Documentation](docs/)** - Documentation complète organisée par thème
- **[👥 Guide Utilisateur](docs/user/)** - Documentation utilisateur
- **[🔧 Architecture](docs/technical/ARCHITECTURE.md)** - Description technique
- **[📋 Roadmap](docs/project/ROADMAP.md)** - Feuille de route du projet
- **[📊 Status Actuel](docs/project/CURRENT_STATUS.md)** - Statut de développement
- **[🚀 Améliorations](docs/project/IMPROVEMENTS.md)** - Fonctionnalités à développer
- **[🏗️ Infrastructure](docs/infrastructure/)** - N8N, sécurité, déploiement

## 🏗️ Structure

```
website-generator/
├── README.md           # Ce fichier
├── VERSION.txt         # Version unique centralisée
├── init.sh            # Script principal avec tests Markdown
├── Dockerfile         # Build Docker
├── package.json       # Configuration npm
├── content/           # 🆕 Contenu Markdown
│   └── blog/          # 🆕 Articles de blog
├── configs/           # Configurations sites
├── scripts/           # Scripts utiles + tests Markdown
├── template-base/     # Template React avec markdown-loader
├── api/              # API (Itération 4)
└── docs/             # Documentation complète
```

## 🚀 Statut

**Version actuelle :** v1.1.1.9.2.4 - Navigation Architecture V2 + Template Isolation  
**Prochaine étape :** v1.1.1.9.3 - Guided Generation System  
**Site de démonstration :** TranslatePro (http://162.55.213.90:3003)

## 🚀 Version Actuelle v1.1.1.9.2.4

### ✅ Réalisations Récentes
- **Navigation Architecture V2** - Système de navigation robuste et fiable
- **Template Isolation** - Architecture modulaire pour les templates
- **Hot-Patch System** - Système de mise à jour en temps réel
- **Tests Automatisés** - Suite de tests complets pour la navigation
- **N8N Integration** - Configuration automatique des workflows email

### 🎯 Prochaine Étape: v1.1.1.9.3 - Guided Generation System
- **🎯 Guided Generation CLI** - Assistant interactif de création de sites
- **🔄 Enhanced Hot-Patch System** - Interface améliorée pour les mises à jour
- **📋 Customer Portal Enhancement** - Tableau de bord client amélioré
- **🧪 Advanced Template Testing** - Validation automatique des templates

## 🎯 Technologies et Fonctionnalités

✅ **React + Vite** - Framework moderne et build ultra-rapide  
✅ **Tailwind CSS** - Styles utilitaires et design responsive  
✅ **Docker** - Déploiement containerisé et isolation  
✅ **N8N Integration** - Workflows automatisés pour les formulaires  
✅ **Markdown Support** - Système de blog avec articles riches  
✅ **Template System** - Architecture modulaire et réutilisable

## 🧪 Tests et validation

```bash
# Générer un site de test
./init.sh translatepro --docker

# Tests automatisés complets
cd tests && npm test

# Tests de navigation spécifiques
npx playwright test tests/specs/navigation-comprehensive.spec.js

# Validation du site en production
curl -I http://162.55.213.90:3003
```

## 🔄 Gestion des versions

```bash
# Mettre à jour la version automatiquement dans tous les fichiers
./scripts/update-version.sh v1.2.0 "Description de la version"

# La version sera mise à jour dans :
# - VERSION.txt (source unique)
# - init.sh 
# - package.json
# - README.md
# - docs/VERSIONS.md
```

## 📊 Site de Démonstration

Site TranslatePro déployé en production :

- **🏠 Accueil** : `http://162.55.213.90:3003/`
- **🛠️ Services** : `http://162.55.213.90:3003/services`
- **📝 Blog** : `http://162.55.213.90:3003/blog`
- **📄 Articles** : 
  - `http://162.55.213.90:3003/blog/defis-traduction-chinois-francais`
  - `http://162.55.213.90:3003/blog/differences-espagnol-amerique-espagne`
  - `http://162.55.213.90:3003/blog/tarifs-traduction-professionnelle-guide`

## 🎨 Fonctionnalités blog

- **📱 Responsive** : Design adaptatif mobile/desktop
- **🔍 Recherche** : Dans titre et contenu
- **🏷️ Filtrage** : Par catégorie et tags
- **📊 Tri** : Date, titre (asc/desc)
- **🖼️ Images** : Support images responsives
- **🎨 Styles** : Tableaux, listes, code, citations

## 🧠 Traitement d'Images Intelligent (v1.1.1.9.2.4.2)

### Fonctionnalités Principales

- **🎯 Détection Intelligente** : Analyse automatique du contenu des logos et favicons
- **📐 Smart Cropping** : Recadrage adaptatif basé sur l'analyse de contenu
- **🔍 Détection de Pré-optimisation** : Skip automatique des assets déjà optimisés
- **🖼️ Favicon Intelligent** : Préservation des tailles optimales (16x16 à 512x512)
- **💾 Site-Specific Intelligence** : Configuration spéciale pour sites avec assets pré-optimisés

### Modes d'Analyse

1. **Content-Aware Analysis**
   - Détection des bordures de contenu
   - Analyse de la densité du contenu
   - Calcul de l'utilisation de l'espace
   - Recommandations de recadrage intelligentes

2. **Intelligent Skip Detection**
   - Logos avec ratio optimal (2.5-6) et utilisation efficace
   - Favicons aux tailles standards (32x32, 64x64, etc.)
   - Assets pré-optimisés détectés automatiquement

3. **Site-Specific Overrides**
   - Configuration pour Qalyarab (assets pré-optimisés)
   - Priorité maximale sur toutes les autres détections

### Configuration

```bash
# Mode de traitement des images
IMAGE_MODE=process  # Smart cropping activé
IMAGE_MODE=copy     # Copie simple sans traitement

# Forcer la régénération
FORCE_REGENERATE=true
FORCE_BLOG_IMAGES=true
FORCE_HERO_IMAGES=true
FORCE_SERVICE_IMAGES=true
```

## 📖 Liens rapides

### Version 2.0 (En développement)
- **🚀 Master Issue v2.0 :** [Issue #44](https://github.com/mocher01/website-generator/issues/44)
- **📋 Roadmap v2.0 :** [docs/project/ROADMAP-v2.md](docs/project/ROADMAP-v2.md)
- **📝 Transition Summary :** [docs/project/V2_TRANSITION_SUMMARY.md](docs/project/V2_TRANSITION_SUMMARY.md)
- **🧹 Cleanup Plan :** [docs/project/CLEANUP-PLAN.md](docs/project/CLEANUP-PLAN.md)

### Version 1.x (Actuelle)
- **🗺️ Roadmap v1 :** [docs/project/ROADMAP.md](docs/project/ROADMAP.md)
- **🏗️ Architecture :** [docs/technical/ARCHITECTURE.md](docs/technical/ARCHITECTURE.md)
- **📊 Status actuel :** [docs/project/CURRENT_STATUS.md](docs/project/CURRENT_STATUS.md)
- **🎨 Système couleurs :** [docs/technical/COULEURS_SYSTEM.md](docs/technical/COULEURS_SYSTEM.md)
- **🔮 Améliorations futures :** [docs/project/IMPROVEMENTS.md](docs/project/IMPROVEMENTS.md)
- **🚀 Déploiement :** [docs/deployment/DEPLOY.md](docs/deployment/DEPLOY.md)

---

**🎉 Version v1.1.1.9.2.4.2 : Intelligent Image Processing - Smart cropping & detection!**