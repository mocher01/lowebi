# 📋 Issue #15 - Wizard Step 5: Content Review & Customization

**Version:** v1.1.1.9.2.4.1.8  
**Type:** User Story - Wizard Enhancement  
**Priority:** High 🔥  
**Status:** Open  

## 📊 User Story

**En tant qu'utilisateur du wizard,**  
**Je veux pouvoir réviser et personnaliser le contenu généré (services, textes, descriptions),**  
**Afin d'ajuster le contenu à mes besoins avant la création finale du site.**

## 🎯 Acceptance Criteria

### ✅ Critères fonctionnels

1. **Affichage du contenu généré/saisi**
   - Affichage structuré de tous les éléments de contenu du site
   - Services/activités avec noms, descriptions, prix
   - Textes hero, slogans, descriptions business
   - Informations de contact et coordonnées
   - Présentation claire avec sections organisées

2. **Édition en ligne des textes**
   - Tous les champs texte éditables directement dans l'interface
   - Sauvegarde automatique des modifications
   - Validation en temps réel des champs obligatoires
   - Compteur de caractères pour les limites de longueur
   - Support du markdown simple (gras, italique, listes)

3. **Preview en temps réel**
   - Aperçu immédiat des modifications dans le style du template
   - Basculement Desktop/Tablet/Mobile pour vérifier la responsivité
   - Preview de la section services telle qu'elle apparaîtra
   - Preview du header avec logo, slogan, navigation

4. **Régénération de contenu AI** 
   - Bouton "🔄 Régénérer avec Locod-AI" pour chaque section
   - Options de régénération : Services, Hero text, Descriptions
   - Intégration avec Admin AI Queue pour traitement
   - Affichage du statut de régénération en temps réel
   - Possibilité d'annuler/conserver l'ancien contenu

5. **Gestion avancée des services**
   - Réorganisation des services par drag & drop
   - Ajout/suppression de services supplémentaires
   - Édition des catégories de services
   - Association/modification des images services
   - Prix et descriptions extensibles

6. **Optimisation SEO intégrée**
   - Suggestions automatiques de mots-clés
   - Préview des meta descriptions
   - Vérification de la longueur des titres
   - Score SEO en temps réel
   - Recommendations d'amélioration

### ✅ Critères techniques

7. **Auto-sauvegarde intelligente**
   - Sauvegarde automatique toutes les 15 secondes
   - Détection des modifications avant navigation
   - Récupération automatique après interruption
   - Historique local des versions (3 dernières versions)

8. **Validation et contrôle qualité**
   - Validation des champs obligatoires en temps réel
   - Détection des textes trop courts/longs
   - Vérification de cohérence entre sections
   - Alertes pour contenu manquant ou problématique

9. **Performance et UX**
   - Interface fluide sans latence lors de l'édition
   - Preview instantané (<200ms) lors des modifications
   - Gestion des états de chargement pour la régénération AI
   - Responsive design pour édition mobile

## 🔧 Technical Implementation

### Data Structure
```javascript
wizardData.contentReview = {
    services: [
        {
            id: 'service-1',
            name: 'Traduction Juridique',
            shortDescription: 'Documents légaux et contractuels', 
            longDescription: 'Traduction certifiée de contrats, actes notariés, jugements et tous documents juridiques avec garantie de précision terminologique.',
            price: '0.12€/mot',
            category: 'legal',
            imageIndex: 1,
            seoKeywords: ['traduction juridique', 'documents légaux', 'traduction certifiée'],
            modified: true // Indique si modifié par l'utilisateur
        }
        // ... autres services
    ],
    content: {
        heroText: {
            title: 'Votre Expert en Traduction Professionnelle',
            subtitle: 'Services de traduction de haute qualité pour tous vos documents',
            cta: 'Demandez votre devis gratuit',
            modified: false
        },
        businessDescription: {
            short: 'Traduction professionnelle avec 15 ans d\'expérience',
            long: 'Notre équipe de traducteurs certifiés vous accompagne...',
            modified: true
        },
        contact: {
            email: 'contact@example.com',
            phone: '+33123456789',
            address: '123 Rue de la Traduction, Paris',
            hours: 'Lun-Ven 9h-18h',
            modified: false
        }
    },
    seo: {
        metaTitle: 'Services de Traduction Professionnelle | VotreNom',
        metaDescription: 'Traduction juridique, technique et littéraire...',
        keywords: ['traduction', 'juridique', 'technique', 'Paris'],
        score: 85 // Score SEO automatique
    },
    history: [
        { version: 1, timestamp: Date.now(), data: {...} },
        { version: 2, timestamp: Date.now(), data: {...} }
    ]
}
```

### API Integration
```javascript
// Routes pour la révision de contenu
GET /api/content/review/:siteId - Récupère le contenu pour révision
PUT /api/content/review/:siteId - Sauvegarde les modifications
POST /api/content/regenerate - Demande de régénération AI

// Validation et SEO
POST /api/content/validate - Validation du contenu
GET /api/content/seo-score - Calcul du score SEO
GET /api/content/suggestions/:businessType - Suggestions d'amélioration
```

### AI Regeneration Workflow
```javascript
// Processus de régénération
const regenerateContent = async (sectionType, currentContent) => {
    // 1. Créer demande dans AI Queue
    const aiRequest = await createAIRequest({
        type: 'content_regeneration',
        section: sectionType, // 'services', 'hero', 'description'
        currentContent: currentContent,
        businessType: wizardData.businessType,
        userPreferences: wizardData.preferences
    });
    
    // 2. Polling pour récupérer le résultat
    const result = await pollAIRequestStatus(aiRequest.id);
    
    // 3. Proposer le nouveau contenu à l'utilisateur
    showContentComparison(currentContent, result.generated_content);
};
```

## 🖥️ UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Step 5: Révision du Contenu (5/8)              │
├─────────────────────────────────────────────────┤
│ 📝 Révisez et personnalisez votre contenu      │
│                                                 │
│ [🖥️ Desktop] [📱 Tablet] [📱 Mobile] Preview   │
│                                                 │
│ ┌─ Hero Section ──────────────────────────────┐ │
│ │ Titre: [Votre Expert en Traduction...] [🔄]│ │
│ │ Sous-titre: [Services de haute qualité...]  │ │
│ │ CTA: [Demandez votre devis gratuit]         │ │
│ │ ✅ SEO Score: 85/100 [📊 Détails]          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Services ──────────────────────────────────┐ │
│ │ [↕️] Service 1: Traduction Juridique [✏️] │ │
│ │     Description: [Documents légaux...] [🔄] │ │
│ │     Prix: [0.12€/mot] Image: [📷]          │ │
│ │ ──────────────────────────────────────────── │ │
│ │ [↕️] Service 2: Traduction Technique [✏️]  │ │
│ │     Description: [Manuels techniques...] 📷 │ │
│ │ [+ Ajouter un service]                      │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Informations Business ─────────────────────┐ │
│ │ Description courte: [Traduction avec...]    │ │
│ │ Description longue: [Notre équipe...] [🔄]  │ │
│ │ Contact: Email [✏️] Téléphone [✏️]         │ │
│ │ Adresse: [123 Rue...] Horaires: [Lun-Ven]  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 📱 Preview Responsive                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ [🖼️] Votre Expert en Traduction...        │ │
│ │      Services de haute qualité pour tous   │ │
│ │      [Demandez votre devis gratuit]        │ │
│ │ ═════════════════════════════════════════   │ │
│ │ 🔹 Traduction Juridique                    │ │
│ │    Documents légaux et contractuels        │ │
│ │    À partir de 0.12€/mot                   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [← Précédent]                    [Suivant →]   │
└─────────────────────────────────────────────────┘
```

### Interactive Features
- **Édition inline** avec sauvegarde automatique
- **Drag & Drop** pour réorganiser les services
- **Modal de régénération** avec preview avant/après
- **Tooltips SEO** avec conseils d'optimisation
- **Historique des versions** avec possibilité de retour
- **Export preview** pour validation externe

## 🧪 Test Scenarios

### Test Cases
1. **Content Editing Flow**
   - ✅ Éditer texte hero et voir preview en temps réel
   - ✅ Modifier description service et sauvegarder
   - ✅ Réorganiser services par drag & drop
   - ✅ Ajouter/supprimer un service

2. **AI Regeneration Workflow**
   - ✅ Déclencher régénération d'une section
   - ✅ Comparer ancien/nouveau contenu
   - ✅ Accepter ou rejeter le nouveau contenu
   - ✅ Gérer les erreurs de régénération

3. **SEO Optimization**
   - ✅ Calcul automatique du score SEO
   - ✅ Suggestions d'amélioration pertinentes
   - ✅ Validation des meta descriptions
   - ✅ Optimisation des mots-clés

4. **Responsive Preview**
   - ✅ Basculement Desktop/Mobile fonctionnel
   - ✅ Preview fidèle au rendu final
   - ✅ Éléments responsive correctement affichés

### E2E Test
```javascript
// tests/specs/wizard-step5.spec.js
test('Step 5: Content review and customization', async ({ page }) => {
  // Navigation vers Step 5 avec contenu généré
  await page.goto('/wizard?step=5');
  
  // Vérification affichage du contenu
  await expect(page.locator('[data-testid="hero-title"]')).toBeVisible();
  await expect(page.locator('[data-testid="services-list"]')).toBeVisible();
  
  // Test édition inline
  await page.click('[data-testid="edit-hero-title"]');
  await page.fill('[data-testid="hero-title-input"]', 'Nouveau Titre Expert');
  await page.click('[data-testid="save-hero-title"]');
  
  // Vérification preview mis à jour
  await expect(page.locator('[data-testid="preview-hero"]'))
    .toContainText('Nouveau Titre Expert');
  
  // Test régénération AI
  await page.click('[data-testid="regenerate-services"]');
  await expect(page.locator('[data-testid="ai-processing"]')).toBeVisible();
  
  // Test navigation suivante
  await page.click('[data-testid="next-step"]');
  await expect(page).toHaveURL(/step=6/);
});
```

## 📊 Success Metrics

### Functional KPIs
- **Content completion rate**: >90% des utilisateurs finalisent au moins 80% du contenu
- **Regeneration usage**: 40-60% utilisent la régénération AI au moins une fois
- **Editing engagement**: Moyenne de 3-5 modifications par section
- **Step completion time**: 5-8 minutes (temps optimal pour révision qualité)

### Technical KPIs  
- **Auto-save success**: >99.5% des sauvegardes automatiques réussies
- **Preview rendering**: <200ms pour mise à jour du preview
- **SEO score accuracy**: >85% de corrélation avec outils SEO standards
- **Mobile editing**: 100% fonctionnel sur dispositifs mobiles

## 🔗 Dependencies

### Prerequisites
- ✅ Step 4 completed (services/activities définis)
- ✅ Admin AI Queue system operational
- ✅ ConfigGenerator with content processing
- ✅ SEO analysis engine ready

### Integration Points
- **AI Queue API**: Régénération de contenu
- **ConfigGenerator**: Content validation & processing
- **Template Engine**: Preview rendering
- **SEO Engine**: Score calculation & suggestions
- **Customer Portal**: Content persistence

## 🚀 Definition of Done

- [ ] **UI Component**: Interface Step 5 complète avec édition inline
- [ ] **Content Display**: Affichage structuré de tout le contenu généré
- [ ] **Inline Editing**: Édition en temps réel avec auto-save
- [ ] **AI Regeneration**: Intégration complète avec Admin AI Queue
- [ ] **Preview System**: Preview responsive en temps réel
- [ ] **SEO Integration**: Score SEO et suggestions opérationnels
- [ ] **Drag & Drop**: Réorganisation des services fonctionnelle
- [ ] **Version History**: Système de versions locales
- [ ] **Validation**: Contrôle qualité et validation complète
- [ ] **API Routes**: Endpoints de révision de contenu
- [ ] **Tests**: Suite E2E complète avec tous les scénarios
- [ ] **Documentation**: Guide utilisateur Step 5
- [ ] **Deployment**: Code déployé et testé sur serveur production

---

**🎯 Business Value**: Permet aux utilisateurs de personnaliser et optimiser leur contenu pour créer un site web qui correspond exactement à leurs attentes et optimisé SEO.

**⚡ Ready for Development**: Admin AI Queue opérationnel, foundation Step 4 complète, ready to implement!