# 🧙‍♂️ Wizard Documentation

Documentation complète du système de wizard pour la création de sites.

## 📋 Index

### Recent Updates
- [**Step 3 Images Cleanup**](./STEP3-IMAGES-CLEANUP.md) - Optimisation complète du système d'images

### User Stories (Issues GitHub)
- [Issue #11 - Portal Entry](../user-stories/ISSUE-11-PORTAL-ENTRY.md)
- [Issue #12 - Step 0](../user-stories/ISSUE-12-STEP0.md)  
- [Issue #13 - Step 1](../user-stories/ISSUE-13-WIZARD-STEP1.md)

## 🎯 Vue d'ensemble

### Architecture du Wizard
```
Step 0: Welcome & Terms     → Acceptation conditions
Step 1: Template Selection  → Choix template (Basic)
Step 2: Business Info       → Nom, type, domaine
Step 3: Logo & Images       → Gestion assets visuels ✨
Step 4: Services/Activities → Définition services
Step 5: Content Review      → Révision contenu
Step 6: Advanced Features   → Blog, newsletter, SEO
Step 7: Final Review        → Validation finale
Step 8: Creation Result     → Résultat & déploiement
```

## 🖼️ Système d'images (Step 3)

### Images obligatoires (5)
1. **Logo Navbar** (`{siteId}-logo-clair.png`) - Version claire pour navbar
2. **Logo Footer** (`{siteId}-logo-sombre.png`) - Version sombre pour footer  
3. **Favicons** (`{siteId}-favicon-clair/sombre.png`) - Adaptatifs clair/sombre
4. **Hero Image** (`{siteId}-hero.png`) - Bannière principale

### Images services (variables)
- `{siteId}-1.jpg`, `{siteId}-2.png`, `{siteId}-3.png` selon nombre de services

### Approches de génération
- **Manuel** (gratuit) - Upload utilisateur
- **IA** (payant ~10€) - Génération automatique
- **Mixte** (sur mesure) - Combinaison des deux

## 🔧 Configuration technique

### Wizard Data Structure
```javascript
wizardData: {
    // Step 0
    termsAccepted: false,
    language: 'fr',
    
    // Step 1  
    template: 'basic',
    
    // Step 2
    siteName: '',
    businessType: '',
    domain: '',
    slogan: '',
    description: '',
    
    // Step 3
    imageApproach: '', // 'manual', 'ai', 'mixed'
    images: {
        logoNavbar: null,
        logoFooter: null, 
        hero: null,
        services: []
    },
    
    // Step 4+
    services: [],
    features: {},
    // ...
}
```

### API Endpoints
```javascript
GET  /api/templates        // Liste templates disponibles
POST /api/sites/create     // Création site depuis wizard
GET  /api/config/business-types // Types métier avec suggestions
```

## 🧪 Testing

### Playwright E2E Tests
```bash
# Test Step 0
npx playwright test specs/wizard-step0.spec.js

# Test Step 2  
npx playwright test specs/wizard-step2.spec.js

# Test Step 3
npx playwright test specs/wizard-step3.spec.js

# Test complet
npx playwright test specs/wizard-complete-flow.spec.js
```

### Test Scenarios
- ✅ Navigation entre étapes
- ✅ Validation des champs
- ✅ Sauvegarde auto (localStorage)
- ✅ Récupération session
- ✅ Génération config finale

## 💾 Persistence & Auto-save

### LocalStorage
```javascript
// Auto-save toutes les 30 secondes
localStorage.setItem('wizard-session', JSON.stringify({
    data: wizardData,
    step: currentStep,
    timestamp: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24h
}));
```

### Session Recovery
- **Détection automatique** au chargement
- **Popup de confirmation** pour récupérer
- **Validation des données** récupérées
- **Expiration 24h** par défaut

## 🌐 Interface & UX

### Design System
- **Tailwind CSS** pour le styling
- **Alpine.js** pour l'interactivité
- **Progress bar** cliquable entre étapes
- **Validation temps réel** avec feedback visuel

### Responsive Design
- **Mobile-first** approach
- **Breakpoints Tailwind** standards
- **Touch-friendly** pour mobile/tablet
- **Accessibilité** ARIA compliant

## 🔄 Integration avec Config Generator

### Workflow
```
Wizard Data → ConfigGenerator.generateConfig() → site-config.json
```

### Business Type Defaults
```javascript
businessTypeDefaults = {
    'translation': { colors: {...}, terminology: 'services' },
    'education': { colors: {...}, terminology: 'cours' },
    'creative': { colors: {...}, terminology: 'créations' },
    // ...
}
```

## 📊 Analytics & Monitoring

### Métriques trackées
- **Completion rate** par étape
- **Drop-off points** identification  
- **Time spent** par étape
- **Error patterns** validation

### Debug Tools
- **Console logging** détaillé
- **State inspection** via Alpine.js devtools
- **Network monitoring** API calls
- **LocalStorage inspection** session data

## 🚀 Performance

### Optimisations
- **Lazy loading** des étapes
- **Image optimization** automatique
- **Bundle splitting** par étapes
- **API response caching** côté client

### Métriques cibles
- **First Load**: <2s
- **Step Navigation**: <200ms
- **Auto-save**: <100ms background
- **Form Validation**: <50ms