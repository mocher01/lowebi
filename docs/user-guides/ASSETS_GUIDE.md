# 🎨 Guide des Assets - Website Generator

> **Guide complet : Assets adaptatifs, formats, dimensions et optimisation**

## 🆕 SYSTÈME ADAPTATIF (NOUVEAU)

> **NOUVEAUTÉ :** Support complet des thèmes sombre/clair pour une expérience moderne et adaptative

### 📋 LES 4 FICHIERS REQUIS

#### 1. **Logo Clair** (Navbar)
- **Fichier :** `{site}-logo-clair.png`
- **Usage :** Barre de navigation (fond clair)
- **Dimensions :** 200x56px recommandées

#### 2. **Logo Sombre** (Footer)  
- **Fichier :** `{site}-logo-sombre.png`
- **Usage :** Footer (fond sombre)
- **Dimensions :** 200x56px recommandées

#### 3. **Favicon Clair**
- **Fichier :** `{site}-favicon-clair.png`
- **Usage :** Mode clair du navigateur
- **Dimensions :** 32x32px minimum, 192x192px recommandé

#### 4. **Favicon Sombre**
- **Fichier :** `{site}-favicon-sombre.png`
- **Usage :** Mode sombre du navigateur  
- **Dimensions :** 32x32px minimum, 192x192px recommandé

### ⚙️ CONFIGURATION ADAPTATIVE

```json
{
  "brand": {
    "logos": {
      "navbar": "monsite-logo-clair.png",
      "footer": "monsite-logo-sombre.png"
    },
    "favicons": {
      "light": "monsite-favicon-clair.png",
      "dark": "monsite-favicon-sombre.png"
    }
  },
  "features": {
    "adaptiveLogos": true,
    "adaptiveFavicons": true
  }
}
```

### 🔧 BACKWARD COMPATIBILITY

Le système est 100% rétrocompatible avec l'ancien système :

```json
{
  "brand": {
    "logo": "monsite-logo.png",
    "favicon": "monsite-favicon.ico"
  }
}
```

---

## 📋 Vue d'ensemble (Guide Complet)

Ce guide détaille tous les formats d'images supportés par le website generator, leurs dimensions optimales, et les bonnes pratiques pour éviter les problèmes d'affichage.

---

## ✅ Formats d'images supportés

### 🎯 **Formats officiellement supportés par nginx**

D'après la configuration `template-base/docker/nginx.conf` :

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
```

| Format | Extension | Usage recommandé | Support |
|--------|-----------|------------------|---------|
| **PNG** | `.png` | Logos, icônes, transparence | ✅ Excellent |
| **JPG/JPEG** | `.jpg`, `.jpeg` | Photos, images sans transparence | ✅ Excellent |
| **SVG** | `.svg` | Logos vectoriels, icônes | ✅ Excellent |
| **WEBP** | `.webp` | Images modernes optimisées | ✅ Excellent |
| **GIF** | `.gif` | Animations, images simples | ✅ Bon |
| **ICO** | `.ico` | Favicons | ✅ Standard |

### ❌ **Formats NON supportés**

- **BMP** - Non configuré dans nginx
- **TIFF** - Non supporté web
- **RAW** - Non supporté web

---

## 📐 Dimensions recommandées par type

### 🏷️ **1. LOGO PRINCIPAL**

**Contraintes techniques :**
```jsx
// Code React dans Navbar.jsx
className="h-[48px] sm:h-[56px] w-auto"
```

**📋 Spécifications :**
- **Hauteur fixe :** 56px (redimensionnement automatique)
- **Largeur recommandée :** 140-200px
- **Ratio optimal :** 3:1 à 4:1 (largeur:hauteur)
- **Format :** PNG ou SVG
- **Poids max :** < 50KB

**✅ Exemples optimaux :**
- `200x56px` (ratio 3.6:1) - **RECOMMANDÉ**
- `168x56px` (ratio 3:1) - Version compacte
- `224x56px` (ratio 4:1) - Version étendue

### 🖼️ **2. IMAGE HERO**

**Contraintes techniques :**
```jsx
// Layout grid responsive dans Hero.jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
  <img className="rounded-xl shadow-2xl" />
```

**📋 Spécifications :**
- **Desktop optimal :** 800x600px
- **Ratio recommandé :** 4:3 ou 3:2
- **Format :** JPG (photos) ou WEBP (moderne)
- **Poids max :** < 200KB (JPG) ou < 100KB (WEBP)
- **Responsive :** S'adapte automatiquement

**✅ Dimensions recommandées :**
- `800x600px` (ratio 4:3) - **OPTIMAL**
- `720x480px` (ratio 3:2) - Alternative
- `600x400px` (ratio 3:2) - Version légère

### 🌍 **3. OPEN GRAPH (Réseaux sociaux)**

**Standards web officiels :**
- **Taille standard :** 1200x630px (ratio 1.91:1)
- **Minimum requis :** 600x315px
- **Format :** JPG ou PNG
- **Poids max :** < 1MB
- **Usage :** Aperçus Facebook, Twitter, LinkedIn

### 🔗 **4. FAVICON**

**Formats multiples recommandés :**

| Fichier | Dimensions | Usage |
|---------|------------|-------|
| `favicon.ico` | 32x32px | Standard navigateurs |
| `favicon-16x16.png` | 16x16px | Petite taille |
| `favicon-32x32.png` | 32x32px | Taille standard |
| `apple-touch-icon.png` | 180x180px | iOS/Safari |

---

## 📁 Structure recommandée

### 🎯 **Pour un nouveau site**

```
configs/mon-site/assets/
├── mon-site-logo.png          # 200x56px - Logo principal
├── mon-site-logo.svg          # Vectoriel - Logo alternatif
├── mon-site-favicon.ico       # 32x32px - Favicon standard
├── mon-site-hero.jpg          # 800x600px - Image hero
├── mon-site-og.jpg            # 1200x630px - Open Graph
├── apple-touch-icon.png       # 180x180px - Icône iOS
└── README.md                  # Documentation spécifique
```

### 📝 **Nomenclature**

**Convention de nommage :**
```
[site-id]-[type].[extension]

Exemples :
- qalyarab-logo.png
- qalyarab-hero.jpg
- qalyarab-favicon.ico
```

---

## 🎯 Récapitulatif par usage

| Type d'image | Dimensions optimales | Ratio | Format prioritaire | Poids max | Exemple |
|--------------|---------------------|-------|-------------------|-----------|---------|
| **Logo navbar** | 200x56px | 3.6:1 | PNG ou SVG | < 50KB | `logo.png` |
| **Image hero** | 800x600px | 4:3 | JPG ou WEBP | < 200KB | `hero.jpg` |
| **Open Graph** | 1200x630px | 1.91:1 | JPG ou PNG | < 1MB | `og-image.jpg` |
| **Favicon** | 32x32px | 1:1 | ICO ou PNG | < 10KB | `favicon.ico` |
| **Apple icon** | 180x180px | 1:1 | PNG | < 50KB | `apple-touch-icon.png` |

---

## ⚡ Optimisation performance

### 🛠️ **Outils recommandés**

```bash
# Redimensionner le logo
convert logo-original.png -resize 200x56 logo.png

# Optimiser l'image hero
convert hero-original.jpg -resize 800x600^ -gravity center -crop 800x600+0+0 -quality 85 hero.jpg

# Créer favicon multi-tailles
convert logo.png -resize 32x32 favicon.ico

# Convertir en WEBP (moderne)
cwebp -q 80 hero.jpg -o hero.webp

# Optimiser PNG
pngquant logo.png --output logo-optimized.png
```

### 📊 **Formats par priorité de performance**

**1. Pour les logos :**
```
🥇 SVG (vectoriel, léger, scalable)
🥈 PNG optimisé (transparence, bonne qualité)
🥉 JPG (si pas de transparence nécessaire)
```

**2. Pour les images hero/photos :**
```
🥇 WEBP (moderne, ultra optimisé)
🥈 JPG optimisé (compatible partout)
🥉 PNG (plus lourd mais excellente qualité)
```

**3. Pour les favicons :**
```
🥇 ICO (standard universel)
🥈 PNG (plus facile à créer)
```

---

## 🚨 Problèmes courants et solutions

### ❌ **Image qui ne s'affiche pas**

**Causes possibles :**
1. **Fichier corrompu** → Vérifier avec `file image.jpg`
2. **Mauvaise extension** → Vérifier .jpg vs .png dans config
3. **Paramètres de cache** → Éviter `?v=timestamp` dans les noms
4. **Taille trop importante** → Optimiser < 200KB

**✅ Solutions :**
```bash
# Vérifier le fichier
file configs/site/assets/image.jpg

# Tester l'accessibilité
curl -I http://site.com/assets/image.jpg

# Regénérer proprement
rm -rf generated-sites/site
./scripts/generate-site.sh site --build --docker
```

### ⚠️ **Performance dégradée**

**Signes :**
- Build lent > 10s
- Images lourdes > 500KB
- Temps de chargement élevé

**✅ Solutions :**
```bash
# Optimiser toutes les images
find configs/*/assets -name "*.jpg" -exec jpegoptim --size=200k {} \;
find configs/*/assets -name "*.png" -exec pngquant --ext .png --force {} \;
```

---

## 📝 Configuration JSON

### 🎯 **Référencement dans site-config.json**

```json
{
  "brand": {
    "logo": "mon-site-logo.png",
    "favicon": "mon-site-favicon.ico"
  },
  "content": {
    "hero": {
      "image": "mon-site-hero.jpg"
    }
  },
  "seo": {
    "ogImage": "mon-site-og.jpg"
  }
}
```

### ⚠️ **Points d'attention**

1. **Pas de paramètres de cache :** `hero.jpg` ✅ - `hero.jpg?v=123` ❌
2. **Extension exacte :** Correspondance fichier/config obligatoire
3. **Chemin relatif :** Pas de `/assets/` dans la config JSON

---

## 🧪 Tests et validation

### ✅ **Checklist avant déploiement**

```bash
# 1. Vérifier tous les fichiers
ls -la configs/mon-site/assets/
file configs/mon-site/assets/*

# 2. Tester la génération
./scripts/generate-site.sh mon-site --build --docker

# 3. Vérifier les assets dans le container
docker exec mon-site ls -la /usr/share/nginx/html/assets/

# 4. Test d'accessibilité
curl -I http://site.com/assets/logo.png
curl -I http://site.com/assets/hero.jpg
```

### 🌐 **Test navigateur**

1. **Mode incognito** → Éviter le cache
2. **DevTools Network** → Vérifier le chargement des images
3. **Différentes tailles d'écran** → Responsive
4. **Test sur mobile** → Performance

---

## 📞 Support

### 🐛 **En cas de problème**

1. **Vérifier ce guide** → Dimensions et formats
2. **Regénérer le site** → `./scripts/generate-site.sh`
3. **Vider le cache navigateur** → Mode incognito
4. **Consulter les logs** → `docker logs container-name`

### 📚 **Documentation additionnelle**

- [Template README](../template-base/README.md)
- [Scripts de génération](../scripts/)
- [Configuration site](./site-config.json)

---

**✨ Avec ce guide, tes images s'afficheront parfaitement ! 🎯**

*Dernière mise à jour : Juillet 2025 - Suite aux corrections du website generator*