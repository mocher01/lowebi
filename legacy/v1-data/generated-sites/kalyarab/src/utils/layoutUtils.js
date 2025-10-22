# ⚠️ FICHIER SUPPRIMÉ - ARCHITECTURE CLEAN v1.1

Ce fichier `layoutUtils.js` a été **SUPPRIMÉ** dans l'architecture Clean v1.1.

## 🎯 Nouveau système

L'ancien système JavaScript complexe est remplacé par :

### ✅ CSS Variables pures
- Fichier : `template-base/src/styles/layout-variables.css`
- Généré par : `scripts/generate-layout-css.js`
- Classes fixes : `.page-header`, `.about-header`, `.hero-section`

### ✅ Pas de logique JavaScript
- Plus de fonction `getPageHeaderClasses()`
- Plus de fonction `getHeroClasses()`
- Plus de fonction `getSectionClasses()`

### ✅ Classes CSS directes
```jsx
// ❌ ANCIEN (v1.0)
const headerClasses = getPageHeaderClasses(config);
<section className={headerClasses.section}>

// ✅ NOUVEAU (v1.1)
<section className="page-header">
```

## 📚 Documentation

Voir : `RELEASE_NOTES_v1.1.md` pour plus de détails sur l'architecture Clean v1.1.
