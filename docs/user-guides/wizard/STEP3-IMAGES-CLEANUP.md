# 🖼️ Step 3 Images Cleanup Documentation

## Overview

Nettoyage complet du système d'images pour supprimer les références inutilisées et optimiser le template React.

## Problème identifié

### Images définies mais non utilisées
- `{siteId}-logo.png` (logo "default") → Pas référencé dans le code React
- `{siteId}-favicon.ico` (favicon "default") → HTML utilise `/favicon.ico` hardcodé

### Code legacy obsolète  
- Références aux images `{siteId}-image-1/2/3` pour articles de blog de démo
- Placeholders HTML non utilisés dans les templates

## Solution implementée

### 1. Config Generator (`api/config-generator.js`)

#### ❌ Supprimé
```javascript
logos: {
    navbar: `${siteId}-logo-clair.png`,
    footer: `${siteId}-logo-sombre.png`,
    default: `${siteId}-logo-clair.png`  // ❌ SUPPRIMÉ
},
favicons: {
    light: `${siteId}-favicon-clair.png`,
    dark: `${siteId}-favicon-sombre.png`,
    default: `${siteId}-favicon.ico`     // ❌ SUPPRIMÉ
}
```

#### ✅ Optimisé
```javascript
logos: {
    navbar: `${siteId}-logo-clair.png`,    // ✅ Utilisé dans Navbar
    footer: `${siteId}-logo-sombre.png`    // ✅ Utilisé dans Footer
},
favicons: {
    light: `${siteId}-favicon-clair.png`,  // ✅ Favicons adaptatifs
    dark: `${siteId}-favicon-sombre.png`   // ✅ Favicons adaptatifs
}
```

#### SEO/OpenGraph
```javascript
// Avant
ogImage: `${siteId}-logo.png`,           // ❌ Image inexistante

// Après  
ogImage: `${siteId}-logo-clair.png`,     // ✅ Utilise logo navbar existant
```

### 2. Template HTML (`templates/template-base/index.html`)

#### ❌ Avant
```html
<meta property="og:image" content="{{SITE_OG_IMAGE}}" />
<link rel="icon" type="image/png" href="{{SITE_FAVICON}}" />
<link rel="apple-touch-icon" href="{{SITE_APPLE_ICON}}" />
```

#### ✅ Après
```html
<meta property="og:image" content="{{SITE_LOGO_NAVBAR}}" />
<link rel="icon" type="image/png" href="/assets/{{SITE_FAVICON_LIGHT}}" />
<link rel="apple-touch-icon" href="/assets/{{SITE_FAVICON_LIGHT}}" />
```

### 3. Manifest PWA (`templates/template-base/public/manifest.json`)

#### ❌ Avant
```json
{
  "src": "/assets/{{SITE_FAVICON}}",      // ❌ Placeholder obsolète
  "src": "/assets/{{SITE_LOGO}}"          // ❌ Placeholder obsolète
}
```

#### ✅ Après
```json
{
  "src": "/assets/{{SITE_FAVICON_LIGHT}}", // ✅ Favicon réel
  "src": "/assets/{{SITE_LOGO_NAVBAR}}"    // ✅ Logo navbar
}
```

### 4. Scripts d'injection

#### `scripts/maintenance/inject-html-config.js`
```javascript
// Avant
const ogImage = config.seo?.ogImage ? `/assets/${config.seo.ogImage}` : '/assets/og-default.jpg';
const favicon = config.brand?.favicon ? `/assets/${config.brand.favicon}` : '/favicon.ico';

// Après
const logoNavbar = config.brand?.logos?.navbar || 'logo-navbar.png';
const faviconLight = config.brand?.favicons?.light || 'favicon-light.png';
```

#### `templates/template-base/scripts/inject-config.js`
```javascript
// Avant
'{{SITE_OG_IMAGE}}': `/assets/${config.seo.ogImage}`,
'{{SITE_FAVICON}}': `/assets/${config.brand.favicon}`,

// Après
'{{SITE_LOGO_NAVBAR}}': `/assets/${config.brand.logos.navbar}`,
'{{SITE_FAVICON_LIGHT}}': config.brand.favicons.light
```

### 5. Interface Wizard (`api/portal-ui/wizard.html`)

#### ❌ Avant
```html
<label>Logo Principal * (obligatoire)</label>
<h4>Logo Principal *</h4>
```

#### ✅ Après
```html
<label>Logo Navbar * (version claire)</label>
<h4>Logo Navbar *</h4>
```

## Images nécessaires après cleanup

### ✅ Obligatoires (5 images core)
1. `{siteId}-logo-clair.png` → Navbar + OpenGraph + PWA
2. `{siteId}-logo-sombre.png` → Footer
3. `{siteId}-favicon-clair.png` → Favicons adaptatifs
4. `{siteId}-favicon-sombre.png` → Favicons adaptatifs  
5. `{siteId}-hero.png` → Bannière hero

### ✅ Variables selon config (3 services max)
6. `{siteId}-1.jpg` → Premier service
7. `{siteId}-2.png` → Deuxième service
8. `{siteId}-3.png` → Troisième service

### ❌ Supprimées (inutilisées)
- `{siteId}-logo.png` → Jamais référencée dans React
- `{siteId}-favicon.ico` → HTML utilise `/favicon.ico` statique
- `{siteId}-image-1/2/3` → Articles blog de démo (legacy)

## Impact sur Step 3 Wizard

### Interface simplifiée
- **Avant** : "Logo Principal" (ambigu)
- **Après** : "Logo Navbar (version claire)" (explicite)

### Logique de génération optimisée
- **8 images maximum** au lieu de 12+
- **Pas d'images inutiles** générées
- **Template plus léger** et performant

## Validation

### Tests automatiques
- ✅ Templates HTML valides
- ✅ Manifests PWA fonctionnels  
- ✅ Images référencées correctement
- ✅ Pas de 404 sur les images

### Sites de test
- ✅ `qalyarab-3005` : Toutes images utilisées
- ✅ `qalyjap-3006` : Architecture cohérente
- ✅ Portal wizard : Interface claire

## Déploiement

```bash
# Auto-deploy avec restart automatique
./scripts/deploy/auto-deploy.sh "feat: Cleanup unused images"

# Vérification
curl http://162.55.213.90:3080/wizard
```

## Bénéfices

### 🎯 Technique
- **-33% d'images** générées inutilement
- **Code plus propre** sans références mortes
- **Template optimisé** pour la performance

### 👥 UX/UI  
- **Interface wizard claire** avec noms explicites
- **Pas de confusion** entre logos différents
- **Génération plus rapide** avec moins d'images

### 🔧 Maintenance
- **Moins de fichiers** à gérer
- **Config simplifiée** sans doublons
- **Debug facilité** avec images cohérentes