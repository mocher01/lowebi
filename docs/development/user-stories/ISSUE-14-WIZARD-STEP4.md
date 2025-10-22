# 📋 Issue #14 - Wizard Step 4: Services/Activities Manual Input

**Version:** v1.1.1.9.2.4.1.6  
**Type:** User Story - Wizard Enhancement  
**Priority:** High 🔥  
**Status:** Open  

## 📊 User Story

**En tant qu'utilisateur du wizard,**  
**Je veux pouvoir définir manuellement mes services/activités avec une terminologie flexible,**  
**Afin de créer du contenu personnalisé pour mon domaine professionnel.**

## 🎯 Acceptance Criteria

### ✅ Critères fonctionnels

1. **Terminologie flexible sélectionnable**
   - Dropdown avec suggestions: Services, Cours, Activités, Prestations, Offres, Spécialités, Interventions
   - Possibilité de saisie libre pour terminologie personnalisée
   - Affichage cohérent dans toute l'interface avec la terminologie choisie

2. **Interface flexible pour définir services**
   - Liste dynamique avec ajout/suppression
   - Minimum 1 service, maximum 6 services
   - Champs : nom, description courte, prix (optionnel)
   - Validation en temps réel des champs requis

3. **Saisie manuelle complète**
   - Champs texte pour nom, description courte, description longue
   - Prix optionnel avec formats suggérés (€/h, €/projet, €/mot, etc.)
   - Validation en temps réel des champs obligatoires

4. **Preview en temps réel**
   - Aperçu de la section services telle qu'elle apparaîtra sur le site
   - Style cohérent avec le template sélectionné
   - Responsive design (desktop/tablet/mobile)

5. **Intégration images services**  
   - Association optionnelle d'une image par service
   - Utilisation des images uploadées en Step 3
   - Fallback sur images génériques si pas d'image spécifique

6. **Bouton génération IA (fonctionnel)**
   - Bouton "🧠 Générer avec Locod-AI Expert"
   - Intégration avec Admin AI Queue system
   - Création automatique d'une demande IA dans la queue admin
   - Affichage du statut de traitement en temps réel
   - Notification à l'admin via dashboard
   - Récupération automatique du contenu généré

### ✅ Critères techniques

6. **Validation et sauvegarde**
   - Validation en temps réel des champs obligatoires
   - Auto-save dans localStorage toutes les 30 secondes
   - Gestion des erreurs avec messages explicites

7. **Navigation fluide**
   - Boutons Précédent/Suivant fonctionnels
   - Progress bar mise à jour (4/8 étapes)
   - Sauvegarde automatique avant navigation

8. **Compatibilité existante**
   - Intégration avec ConfigGenerator.processServices()
   - Respect de la structure de données wizardData
   - Compatible avec les templates existants

## 🔧 Technical Implementation

### Data Structure
```javascript
wizardData.services = [
    {
        id: 'service-1',
        name: 'Traduction Juridique',
        shortDescription: 'Documents légaux et contractuels',
        longDescription: 'Traduction certifiée de contrats, actes notariés...',
        price: '0.12€/mot',
        imageIndex: 1, // Correspond à {siteId}-1.jpg
        category: 'legal'
    },
    // ... jusqu'à 6 services max
]
```

### Business Type Terminology
```javascript
const serviceTerminology = {
    'translation': {
        title: 'Services de Traduction',
        singular: 'service',
        plural: 'services',
        addButton: 'Ajouter un service',
        suggestions: [
            { name: 'Traduction Juridique', desc: 'Documents légaux et contractuels' },
            { name: 'Traduction Technique', desc: 'Manuels et documentation technique' },
            { name: 'Traduction Littéraire', desc: 'Romans, poésie et œuvres créatives' }
        ]
    },
    'education': {
        title: 'Cours et Formations',
        singular: 'cours',
        plural: 'cours',
        addButton: 'Ajouter un cours',
        suggestions: [
            { name: 'Cours Particuliers', desc: 'Accompagnement personnalisé' },
            { name: 'Formation Groupe', desc: 'Sessions collectives interactives' },
            { name: 'Stage Intensif', desc: 'Formation accélérée sur plusieurs jours' }
        ]
    }
    // ... autres business types
}
```

### API Integration
```javascript
// Nouvelle route pour suggestions business-specific
GET /api/services/suggestions/:businessType
Response: {
    terminology: { title, singular, plural, addButton },
    suggestions: [{ name, description, category, estimatedPrice }]
}

// Validation des services
POST /api/services/validate
Body: { services: [...] }
Response: { valid: true, errors: [] }
```

## 🖥️ UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Step 4: Services de Traduction (4/8)           │
├─────────────────────────────────────────────────┤
│ 📋 Définissez vos services principaux          │
│                                                 │
│ [+ Ajouter un service]     [💡 Suggestions IA] │
│                                                 │
│ ┌─ Service 1 ────────────────────────────────┐  │
│ │ Nom: [Traduction Juridique         ] [🗑️] │  │
│ │ Description: [Documents légaux...   ]     │  │
│ │ Prix: [0.12€/mot] Image: [📷 Image 1]    │  │
│ └─────────────────────────────────────────────┘  │
│                                                 │
│ ┌─ Service 2 ────────────────────────────────┐  │
│ │ Nom: [Traduction Technique        ] [🗑️] │  │
│ │ Description: [Manuels techniques...] │  │
│ │ Prix: [0.15€/mot] Image: [📷 Image 2]    │  │
│ └─────────────────────────────────────────────┘  │
│                                                 │
│ 📱 Aperçu Mobile                               │
│ ┌───────────────────────────────────────────────┐ │
│ │ [🖼️] Traduction Juridique           │ │
│ │      Documents légaux et contractuels │ │
│ │      À partir de 0.12€/mot          │ │
│ └───────────────────────────────────────────────┘ │
│                                                 │
│ [← Précédent]                      [Suivant →] │
└─────────────────────────────────────────────────┘
```

### Interactive Features
- **Drag & Drop** pour réorganiser l'ordre des services
- **Auto-suggestions IA** basées sur le business type  
- **Preview responsive** en temps réel
- **Image picker** pour associer images services
- **Validation dynamique** avec feedback visuel

## 🧪 Test Scenarios

### Test Cases
1. **Service Addition/Removal**
   - ✅ Ajouter un service vide
   - ✅ Remplir les champs obligatoires
   - ✅ Supprimer un service existant
   - ✅ Réorganiser l'ordre des services

2. **Business Type Integration**
   - ✅ Terminologie correcte selon business type
   - ✅ Suggestions pertinentes chargées
   - ✅ Validation adaptée au domaine

3. **Image Association**
   - ✅ Associer image uploadée en Step 3
   - ✅ Fallback sur image générique
   - ✅ Preview image dans aperçu service

4. **Responsive & Accessibility**
   - ✅ Interface fonctionnelle sur mobile
   - ✅ Navigation keyboard-friendly
   - ✅ Screen reader compatible

### E2E Test
```javascript
// tests/specs/wizard-step4.spec.js
test('Step 4: Services creation flow', async ({ page }) => {
  // Navigation vers Step 4
  await page.goto('/wizard?step=4');
  
  // Vérification terminologie business type
  await expect(page.locator('h2')).toContainText('Services de Traduction');
  
  // Ajout d'un service
  await page.click('[data-testid="add-service"]');
  await page.fill('[data-testid="service-name-0"]', 'Traduction Juridique');
  await page.fill('[data-testid="service-desc-0"]', 'Documents légaux');
  
  // Vérification preview
  await expect(page.locator('[data-testid="service-preview-0"]'))
    .toContainText('Traduction Juridique');
  
  // Navigation vers étape suivante
  await page.click('[data-testid="next-step"]');
  await expect(page).toHaveURL(/step=5/);
});
```

## 📊 Success Metrics

### Functional KPIs
- **Service completion rate**: >95% des utilisateurs définissent au moins 1 service
- **Average services per site**: 2-3 services (optimal pour lisibilité)
- **Suggestion usage**: >60% utilisent les suggestions IA
- **Step completion time**: <3 minutes en moyenne

### Technical KPIs  
- **Page load time**: <1.5s pour Step 4
- **Auto-save frequency**: Toutes les 30s sans échec
- **Validation response**: <200ms pour validation en temps réel
- **Mobile usability**: 100% fonctionnel sur tous devices

## 🔗 Dependencies

### Prerequisites
- ✅ Step 3 completed (images disponibles)
- ✅ Business type selected (Step 2)
- ✅ ConfigGenerator.processServices() method
- ✅ Wizard infrastructure (localStorage, navigation)

### Integration Points
- **ConfigGenerator**: Service data → site-config.json
- **Template Engine**: Services → HTML generation  
- **Image Controller**: Service images → asset optimization
- **Customer Portal API**: Service validation & suggestions

## 🚀 Definition of Done

- [ ] **UI Component**: Step 4 interface complete avec tous les éléments
- [ ] **Business Logic**: Terminologie dynamique selon business type
- [ ] **Validation**: Champs obligatoires + validation en temps réel
- [ ] **Auto-save**: Persistance localStorage toutes les 30s
- [ ] **Preview**: Aperçu responsive des services en temps réel
- [ ] **Navigation**: Integration fluide dans le flow wizard
- [ ] **API**: Routes suggestions et validation fonctionnelles
- [ ] **Tests**: Suite E2E complète avec tous les cas d'usage
- [ ] **Documentation**: README step 4 + code comments
- [ ] **Deployment**: Code déployé et testé sur serveur production

---

**🎯 Business Value**: Foundation essentielle pour créer des sites web personnalisés avec du contenu métier pertinent et optimisé SEO.

**⚡ Ready for Development**: Specs complètes, dependencies satisfaites, ready to code!