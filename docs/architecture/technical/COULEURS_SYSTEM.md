# 🎨 SYSTÈME DE COULEURS - DOCUMENTATION COMPLÈTE

## Vue d'ensemble

Le website-generator utilise un système de couleurs configurable à 3 niveaux :
1. **Configuration JSON** (`site-config.json`)
2. **Générateur CSS** (`generate-site.sh`)
3. **Templates React** (BlogPage, ServicesPage, ContactPage)

## 📋 STRUCTURE DE CONFIGURATION

### 1. Couleurs principales (brand.colors)
```json
{
  "brand": {
    "colors": {
      "primary": "#8B4513",    // Couleur principale du thème
      "secondary": "#D2691E",  // Couleur secondaire
      "accent": "#DAA520"      // Couleur d'accent
    }
  }
}
```

### 2. Configuration navbar
```json
{
  "navbar": {
    "background": "#FAF0E6",
    "textColor": "#8B4513",
    "accentColor": "#8B4513"  // Couleur bouton "Nous contacter"
  }
}
```

### 3. Sections page d'accueil
```json
{
  "sections": {
    "hero": {
      "background": "#FFFFFF",
      "textColor": "#8B4513"
    },
    "services": {
      "background": "#FDF5E6",
      "textColor": "#8B4513",
      "cardBackground": "#FFFFFF"
    },
    "about": {
      "background": "#FFFFFF", 
      "textColor": "#8B4513",
      "cardBackground": "#FDF5E6"
    },
    "testimonials": {
      "background": "#FDF5E6",
      "textColor": "#8B4513"
    },
    "faq": {
      "background": "#FFFFFF",
      "textColor": "#8B4513"
    },
    "cta": {
      "background": "#FDF5E6",
      "textColor": "#8B4513"
    },
    "values": {
      "background": "#FFFFFF",
      "textColor": "#8B4513",
      "cardBackground": "#FDF5E6"
    }
  }
}
```

### 4. Pages spéciales (Blog, Cours, Contact)
```json
{
  "sections": {
    "blog": {
      "background": "#FFFFFF",
      "titleBackground": "#A0522D",     // Fond du header
      "titleTextColor": "#FFFFFF",      // Couleur titre
      "subtitleTextColor": "#FFFFFF",   // Couleur sous-titre
      "textColor": "#8B4513"
    },
    "courses": {
      "background": "#FFFFFF",
      "titleBackground": "#A0522D",
      "titleTextColor": "#FFFFFF",
      "subtitleTextColor": "#FFFFFF",
      "textColor": "#8B4513"
    },
    "contact": {
      "background": "#FFFFFF",
      "titleBackground": "#A0522D",
      "titleTextColor": "#FFFFFF",
      "subtitleTextColor": "#FFFFFF",
      "textColor": "#8B4513"
    }
  }
}
```

### 5. Configuration headers globaux
```json
{
  "design": {
    "pageHeaders": {
      "background": {
        "type": "solid",
        "color": "#A0522D"
      },
      "title": {
        "color": "#FFFFFF",
        "size": "text-3xl md:text-4xl",
        "weight": "font-bold",
        "margin": "mb-4"
      },
      "subtitle": {
        "color": "#FFFFFF",
        "size": "text-lg md:text-xl",
        "weight": "font-medium",
        "margin": "mb-6"
      }
    }
  }
}
```

## 🔧 GÉNÉRATEUR CSS

Le script `scripts/core/generate-site.sh` génère automatiquement le CSS dans `src/styles/site-variables.css`.

### Variables CSS générées
```css
:root {
  --color-primary: #8B4513;
  --color-secondary: #D2691E;
  --color-accent: #DAA520;
  --navbar-background: #FAF0E6;
  --navbar-text: #8B4513;
  --navbar-accent: #8B4513;
  --section-hero-bg: #FFFFFF;
  --section-hero-text: #8B4513;
  /* ... etc pour toutes les sections */
}
```

### Classes générées pour sections
```css
.hero-section {
  background-color: #FFFFFF;
  color: #8B4513;
}

.section-services {
  background-color: #FDF5E6;
  color: #8B4513;
}

/* ... etc */
```

### Classes spéciales page-header (Contact uniquement)
```css
body[data-page="contact"] .page-header {
  background-color: #A0522D;
}

body[data-page="contact"] .page-header h1 {
  color: #FFFFFF;
}

body[data-page="contact"] .page-header .subtitle {
  color: #FFFFFF;
}
```

## 📄 TEMPLATES REACT

### 1. BlogPage et ServicesPage (styles inline)
Ces pages utilisent les configurations `sections.blog` et `sections.courses` :

```jsx
const blogSection = config.sections?.blog || {};
const headerBackgroundStyle = {
  background: blogSection.titleBackground || primaryColor
};
const headerTitleColor = blogSection.titleTextColor || '#ffffff';
const headerSubtitleColor = blogSection.subtitleTextColor || '#ffffff';

// Application dans le JSX
<section style={headerBackgroundStyle}>
  <h1 style={{ color: headerTitleColor }}>Titre</h1>
  <p style={{ color: headerSubtitleColor }}>Sous-titre</p>
</section>
```

### 2. ContactPage (classes CSS)
Cette page utilise le système `data-page` + classes CSS :

```jsx
// Ajout de l'attribut data-page
useEffect(() => {
  document.body.setAttribute('data-page', 'contact');
  return () => document.body.removeAttribute('data-page');
}, []);

// Utilisation des classes CSS générées
<section className="page-header">
  <h1>Contactez-nous</h1>
  <p className="subtitle">Description</p>
</section>
```

## 🎯 BONNES PRATIQUES

### 1. Palette de couleurs harmonieuse
- **Primaire** : `#8B4513` (brun foncé) - pour textes et boutons principaux
- **Terre clair** : `#FDF5E6` (beige) - pour fonds alternés
- **Headers** : `#A0522D` (sienna) - plus doux que l'orange agressif
- **Blanc** : `#FFFFFF` - pour fonds neutres et textes sur fond coloré

### 2. Alternance page d'accueil
- Hero : Blanc
- Services : Terre clair
- About : Blanc  
- Testimonials : Terre clair
- FAQ : Blanc
- CTA : Terre clair

### 3. Headers pages distinctifs
- **Blog/Cours** : Fond sienna (#A0522D) avec texte blanc
- **Contact** : Même style via CSS classes
- **Navbar** : Fond différent pour bien distinguer

## 🚨 POINTS CRITIQUES

### 1. Deux systèmes de couleurs
- **Pages React** (Blog/Cours) → styles inline
- **Page Contact** → classes CSS + data-page

### 2. Fallbacks obligatoires
Toujours prévoir des couleurs par défaut :
```jsx
const color = blogSection.titleTextColor || designConfig.title?.color || '#ffffff';
```

### 3. Bouton "Nous contacter"
Utilise `navbarAccent` défini dans Navbar.jsx :
```jsx
const navbarAccent = config.brand?.colors?.primary || "#8B4513";
```

## 🔄 PROCESS DE MODIFICATION

1. **Modifier** `configs/[site]/site-config.json`
2. **Commit** et push sur GitHub
3. **Régénérer** avec `./init.sh [site] --docker`
4. **Vérifier** sur `http://162.55.213.90:[port]`

## 📝 TROUBLESHOOTING

### Couleurs Contact ne changent pas
- Vérifier `sections.contact.titleBackground` dans config
- Vérifier génération CSS `body[data-page="contact"]`
- Vérifier `useEffect` dans ContactPage.jsx

### Headers Blog/Cours toujours par défaut
- Vérifier `sections.blog.titleTextColor` et `sections.courses.titleTextColor`
- Vérifier utilisation dans templates React

### Bouton navbar reste bleu
- Vérifier `navbar.accentColor` ou `brand.colors.primary`
- Problème dans `navbarAccent` calculation

## 📊 EXEMPLE COMPLET QALYJAP

Configuration testée et validée pour un rendu harmonieux :
- Alternance blanc/terre sur accueil
- Headers distinctifs en sienna doux
- Navigation cohérente tous navigateurs
- Système entièrement configurable sans hardcode