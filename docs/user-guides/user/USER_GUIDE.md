# 📖 Guide Utilisateur - Website Generator

> **Comment utiliser le générateur de sites web**

---

## 🚀 Démarrage Rapide

### **Prérequis**
- Node.js 18+
- Docker  
- Python3
- Git

### **Installation**
```bash
git clone https://github.com/mocher01/website-generator.git
cd website-generator
./init.sh  # Configuration initiale
```

---

## 🎯 Générer un Site Existant

### **Qalyarab (site de test principal)**
```bash
# Génération + Docker
./init.sh qalyarab --docker

# Site accessible sur http://localhost:3000
```

### **Locod.AI (site de référence)**  
```bash
# Génération de référence
./init.sh locod-ai --docker

# Site accessible sur http://localhost:3001
```

---

## 🆕 Créer un Nouveau Site

### **1. Initialiser la configuration**
```bash
# Créer template de configuration
./scripts/create-new-site.sh mon-nouveau-site
```

### **2. Éditer la configuration**
```bash
# Ouvrir le fichier de configuration
nano configs/mon-nouveau-site/site-config.json
```

### **3. Ajouter les assets**
Placer dans `configs/mon-nouveau-site/assets/` :
- `logo-clair.png` (navbar)
- `logo-sombre.png` (footer)  
- `favicon-clair.png` (mode clair)
- `favicon-sombre.png` (mode sombre)

### **4. Valider et générer**
```bash
# Validation configuration
node scripts/validate-config.js mon-nouveau-site

# Génération
./init.sh mon-nouveau-site --docker
```

---

## ⚙️ Configuration JSON

### **Structure de base**
```json
{
  \"meta\": {
    \"siteId\": \"mon-site\",
    \"domain\": \"www.mon-site.fr\",
    \"language\": \"fr\"
  },
  \"brand\": {
    \"name\": \"Mon Site\",
    \"slogan\": \"Mon slogan\",
    \"colors\": {
      \"primary\": \"#3B82F6\",
      \"secondary\": \"#8B5CF6\",
      \"accent\": \"#F59E0B\"
    }
  },
  \"content\": {
    \"hero\": {
      \"title\": \"Titre principal\",
      \"subtitle\": \"Sous-titre\",
      \"description\": \"Description...\"
    },
    \"services\": [...],
    \"about\": {...}
  }
}
```

### **Sections configurables**
- **Hero** : Titre, sous-titre, description, CTA
- **Services** : Liste des services avec icônes
- **About** : À propos, valeurs, statistiques  
- **Testimonials** : Témoignages clients
- **FAQ** : Questions/réponses
- **Blog** : Articles et catégories
- **Contact** : Coordonnées et formulaire

---

## 🎨 Personnalisation

### **Couleurs**
```json
\"brand\": {
  \"colors\": {
    \"primary\": \"#3B82F6\",    // Couleur principale
    \"secondary\": \"#8B5CF6\",  // Couleur secondaire  
    \"accent\": \"#F59E0B\"      // Couleur d'accent
  }
}
```

### **Features conditionnelles**
```json
\"features\": {
  \"blog\": true,           // Activer le blog
  \"testimonials\": true,   // Activer témoignages
  \"faq\": true,           // Activer FAQ
  \"darkMode\": true       // Mode sombre
}
```

### **Navigation**
```json
\"navigation\": {
  \"links\": [
    {\"name\": \"Accueil\", \"path\": \"/\"},
    {\"name\": \"Services\", \"path\": \"/services\"},
    {\"name\": \"À propos\", \"path\": \"/about\"}
  ],
  \"cta\": {
    \"text\": \"Contact\",
    \"path\": \"/contact\"
  }
}
```

---

## 🧪 Tests et Validation

### **Validation configuration**
```bash
# Vérifier la configuration JSON
node scripts/validate-config.js mon-site

# Tests architecture
./scripts/test-clean-architecture.sh

# Validation complète
./init.sh mon-site --validate
```

### **Tests visuels**
```bash
# Générer et tester
./init.sh mon-site --docker

# Accéder au site
open http://localhost:3000
```

---

## 🔧 Commandes Utiles

### **Génération**
```bash
./init.sh [site] --docker          # Générer + Docker
./init.sh [site] --validate        # Valider seulement
./init.sh [site] --force           # Forcer rebuild
./init.sh --clean                  # Nettoyer Docker
```

### **Debugging**
```bash
# Voir les logs du container
docker logs [site]-current

# État des containers
docker ps

# Accéder au container
docker exec -it [site]-current bash
```

### **Développement**
```bash
# Générer sans Docker (pour dev)
./scripts/generate-site.sh [site] --build

# Tests spécifiques
./scripts/test-iteration3.sh
```

---

## 📁 Structure du Projet

```
website-generator/
├── configs/              # Configurations par site
│   ├── qalyarab/         # Site de test principal
│   └── mon-site/         # Votre nouveau site
├── template-base/        # Template React de base
├── scripts/              # Scripts de génération
├── generated-sites/      # Sites générés (temporaire)
└── docs/                # Documentation
```

---

## 🚨 Résolution de Problèmes

### **Erreur de build**
```bash
# Nettoyer et regénérer
./init.sh --clean
./init.sh [site] --docker --force
```

### **Site inaccessible**
```bash
# Vérifier le container
docker ps | grep [site]

# Vérifier les logs
docker logs [site]-current

# Redémarrer le container
docker restart [site]-current
```

### **Configuration invalide**
```bash
# Valider la configuration
node scripts/validate-config.js [site]

# Vérifier la structure JSON
cat configs/[site]/site-config.json | python -m json.tool
```

---

## 📞 Support

### **Documentation**
- [État actuel](../CURRENT_STATUS.md)
- [Architecture](../ARCHITECTURE.md)  
- [Historique](../CHANGELOG.md)

### **En cas de problème**
1. Vérifier les prérequis
2. Consulter les logs Docker
3. Tester avec Qalyarab (référence)
4. Valider la configuration JSON

---

**Version du guide** : Compatible v1.0.11+