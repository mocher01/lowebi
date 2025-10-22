# User Story: Wizard Step 1 - Template Selection (v1.1.1.9.2.4.1.3)

## Issue #13: Wizard Template Selection Screen

### Description
As a user who has accepted terms in Step 0, I want to select a website template that will serve as the foundation for my site. Currently only "Template Basic" is available, but the UI is prepared for future multiple templates.

### Acceptance Criteria

1. **Navigation Context**
   - [ ] Accessible when moving from Step 0 (after terms acceptance)
   - [ ] Progress indicator shows Step 2 of 8 (25% completion)
   - [ ] Step 1 circle is active (blue), Step 0 is completed (green with checkmark)

2. **Template Selection Interface**
   - [ ] Main title: "Sélection de Modèle" (Template Selection)
   - [ ] Subtitle: "Sélectionnez un modèle de base pour votre site" (Select a base template for your site)
   - [ ] Single template displayed (for now)

3. **Template Basic (Current Single Option)**
   - [ ] **Default and only selection**: "Template Basic" 
   - [ ] Name: "Template Basic"
   - [ ] Icon: Template/Layout icon
   - [ ] Description: "Template de site moderne et responsive"
   - [ ] Loaded from `templates/template-base/` directory structure
   - [ ] Auto-selected since it's the only option

4. **Future Template System (Ready for Expansion)**
   - [ ] **Infrastructure ready** for multiple React templates (template-1, template-2, etc.)
   - [ ] **Directory structure** prepared for `templates/template-base/`, `templates/template-1/`
   - [ ] **API endpoint** `/api/templates` scans templates directory for available React templates
   - [ ] **Template card structure** prepared for:
     - Template name and description
     - Preview thumbnails (when multiple templates available)
     - Template-specific features
   - [ ] **Graceful handling** when only one template available

5. **Template Selection Behavior**
   - [ ] **Auto-selection** of "Template Basic" (only option available)
   - [ ] Visual confirmation of selection (border highlight)
   - [ ] Store selection in `wizardData.selectedTemplate = 'template-base'`
   - [ ] Load template metadata (name, description) for display

6. **Template Preview (Simple Modal)**
   - [ ] **"Aperçu" button** for Template Basic
   - [ ] **Modal popup** showing template preview
   - [ ] Display: Template description, features, layout preview text
   - [ ] **"Fermer" (Close)** button to dismiss modal
   - [ ] **"Utiliser ce modèle" (Use this template)** button (confirms selection)

7. **Navigation Controls**
   - [ ] "Précédent" (Previous) button - returns to Step 0
   - [ ] "Suivant" (Next) button - proceeds to Step 2
   - [ ] Next button always enabled (Template Basic is auto-selected)
   - [ ] Previous button always enabled

8. **Visual Design**
   - [ ] **Single template card** prominently displayed and centered
   - [ ] **Card design** with hover effects and smooth transitions
   - [ ] **Infrastructure ready** for future grid layout (2-3 columns)
   - [ ] Consistent spacing and typography matching wizard design
   - [ ] Clear visual hierarchy with template selection prominent

### Technical Requirements
- URL: `/wizard` (Step 1 in wizard flow)
- Alpine.js state: `currentStep === 1`
- Data binding: `wizardData.selectedTemplate = 'template-base'`
- API endpoint: GET `/api/templates` scans `templates/` for React template directories
- Template architecture: Future `templates/template-base/`, `templates/template-1/`, etc.
- Navigation: `previousStep()` and `nextStep()` functions

### Test Scenarios
1. Navigate from Step 0 → Step 1 → Progress shows 25%, Template Basic auto-selected
2. Load Template Basic → Template displays with description and preview button
3. Click "Aperçu" → Modal opens with template preview
4. In modal, click "Utiliser ce modèle" → Template confirmed, modal closes
5. Click "Précédent" → Returns to Step 0
6. Click "Suivant" → Proceeds to Step 2 with Template Basic selected
7. Mobile view → Template card remains centered and usable
8. Future: Multiple templates → Grid layout displays properly

### Error Handling
- [ ] Template directory not found → Show error message, disable Next button
- [ ] Template metadata load failure → Use default template name/description
- [ ] API timeout → Graceful fallback with retry option
- [ ] Future: Invalid template structure → Skip malformed templates

### Definition of Done
- [ ] Implementation matches all acceptance criteria  
- [ ] Playwright test validates all scenarios
- [ ] Template Basic displays correctly with auto-selection
- [ ] Template preview modal functionality working
- [ ] Navigation between steps functional
- [ ] Responsive design verified
- [ ] Error handling tested
- [ ] Deployed to production
- [ ] Manual verification passes

### Critical Prerequisites (Separate Issues Needed)
- [ ] **Architecture Cleanup**: Remove incorrect `templates/*.json` files
- [ ] **Directory Restructure**: Move `template-base/` to `templates/template-base/`
- [ ] **API Update**: Modify `/api/templates` to scan for React template directories
- [ ] **ConfigGenerator Update**: Remove references to JSON configuration templates