# 📜 Changelog - Website Generator

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.11] - 2025-07-21 - STABLE ACTUEL ✅

### **Version de référence stable**
- Template paramétrable entièrement fonctionnel
- Génération Qalyarab opérationnelle et testée
- Scripts de base stables (`init.sh`, `generate-site.sh`)
- Configuration JSON dynamique complète
- Build Docker optimisé et reproductible

### **Points forts**
- ✅ Génération de sites différenciés (Qalyarab ≠ Locod.AI)
- ✅ Variables CSS automatiques
- ✅ Tests de base passants
- ✅ Documentation technique à jour

---

## [1.0.8] - 2025-07-XX

### **Corrigé**
- Boutons CTA fonctionnels sur page services
- Navigation \"Réserver un cours d'essai\" → redirection `/contact`
- Configuration pure sans hardcodes
- Suppression fallbacks inappropriés

### **Technique**
- React Router navigation simplifiée
- Console logs pour debugging
- Validation configuration obligatoire

---

## [1.0.3] - 2025-07-XX

### **Corrigé**
- Hero.jsx hardcode couleur (fond marron → fond blanc configurable)
- Interligne titre Hero (`line-height: 1.1`)
- Architecture CSS pure avec variables

### **Technique**
- Suppression styles JavaScript inline
- Classes CSS pures (btn-primary, hero-section)
- Tests automatisés améliorés

---

## [1.0.0] - 2025-07-XX

### **Ajouté**
- Template de base React/Vite fonctionnel
- Première génération de sites (Qalyarab, Locod.AI)
- Configuration JSON centralisée
- Scripts de génération automatisés
- Infrastructure Docker

---

## [v1.1.1.9.2.1] - 2025-07-25 - Testing TestCo Corrections ✅

### **Corrigé**
- Fallback blog hardcodé qalyarab → spécifique par site (BlogPage.jsx)
- Autonomie complète des sites (conteneurs Docker séparés)
- Chargement articles markdown TestCo fonctionnel
- Sections manquantes configuration (layout, textColors, routing)
- Template hardcodé qalyarab → placeholders dynamiques
- Script paths après réorganisation (scripts/core/, scripts/maintenance/)

### **Testing**
- ✅ Création site TestCo end-to-end réussie
- ✅ 6 bugs critiques identifiés et corrigés
- ✅ Générateur stabilisé pour prochaines étapes

### **Architecture**
- Sub-versioning introduit (v1.1.1.9.2.X) pour corrections pré-nginx
- Sites complètement autonomes (0 mélange de contenu)

---

## [EN COURS] - v1.1.1.9.2.X - Generator Stabilization

### **En développement**
- **v1.1.1.9.2.2** - Corrections template + architecture images pluggable
- **v1.1.1.9.2.3** - Système images + placeholder provider
- **v1.1.1.9.2.4** - Génération guidée + hot-patch system
- Finalisation avant v1.1.1.9.3 (nginx)

---

## [PLANIFIÉ] - Versions futures

### **v1.2.X - API de Gestion**
- API REST pour gestion des sites
- Interface web d'administration
- Endpoints CRUD pour configurations

### **v1.3.X - Infrastructure Production** 
- Intégration nginx-reverse
- SSL automatique (Let's Encrypt)
- Workflows n8n automatisés

---

## Conventions de Versioning

- **Versions stables** : x.y.11, x.y.0 (versions de référence)
- **Versions de développement** : x.y.Z (améliorations incrémentales)
- **Versions majeures** : x.0.0 (changements architecturaux)

## Liens de Référence

- **Version stable actuelle** : v1.0.11
- **Documentation** : [docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md)
- **Architecture** : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Historique détaillé** : [docs/archive/](docs/archive/)
