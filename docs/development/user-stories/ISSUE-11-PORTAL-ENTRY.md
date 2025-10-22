# User Story: Portal Entry Screen (v1.1.1.9.2.4.1.1)

## Issue #11: Portal Main Entry Page

### ✅ VALIDATED BY USER

### Description
As a user visiting the Customer Portal, I want to see a clear entry page that presents my options: using the guided wizard, quick mode, or accessing the admin dashboard.

### Acceptance Criteria

1. **Portal Header**
   - [ ] Display "Locod.AI Customer Portal" as main title
   - [ ] Show version number (v1.1.1.9.2.4.1.1)
   - [ ] Clean, professional header with Locod.AI branding

2. **Three Main Options Cards**
   
   **Card 1: Assistant Guidé (Guided Wizard)**
   - [ ] Icon: Wizard/Magic wand icon
   - [ ] Title: "Assistant Guidé"
   - [ ] Description: "Création étape par étape avec l'assistant"
   - [ ] Button: "Lancer l'assistant" (blue primary)
   - [ ] Click action: Navigate to `/wizard`

   **Card 2: Mode Rapide (Quick Mode)**
   - [ ] Icon: Lightning/Fast icon
   - [ ] Title: "Mode Rapide"
   - [ ] Description: "Création rapide avec configuration minimale"
   - [ ] Button: "Commencer" (blue primary)
   - [ ] Click action: Show quick creation form

   **Card 3: Administration**
   - [ ] Icon: Dashboard/Chart icon
   - [ ] Title: "Administration"
   - [ ] Description: "Gérer vos sites existants, facturation et workflows"
   - [ ] Button: "Accéder" (green)
   - [ ] Click action: Load admin dashboard

3. **Quick Mode Form**
   - [ ] Appears when "Mode Rapide" is selected
   - [ ] Fields:
     - Nom de votre entreprise (required)
     - Slogan/Description (optional)
     - Type d'activité (dropdown, required)
     - Email de contact (required)
     - Téléphone (optional)
   - [ ] Options:
     - [ ] Blog activé (checkbox, default true)
     - [ ] Intégrations N8N (checkbox, default false)
   - [ ] Submit button: "Créer mon site"
   - [ ] Uses wizard-user customer ID (b131e26a1d916c086088491ea6ed0cfa)
   - [ ] Maps brandName to name field for API

4. **Visual Design**
   - [ ] Responsive grid layout (3 cards on desktop, stack on mobile)
   - [ ] Cards with hover effects
   - [ ] Consistent spacing and alignment
   - [ ] Loading states for all actions

5. **Error Handling**
   - [ ] Show clear error messages if creation fails
   - [ ] Maintain form data on error
   - [ ] Allow retry without re-entering data

### Technical Requirements
- URL: `/` (portal root)
- Alpine.js app: `portalApp()`
- Customer ID: Use wizard-user (b131e26a1d916c086088491ea6ed0cfa)
- API endpoint for quick mode: `/api/sites/create`

### Test Scenarios
1. Load portal → See three option cards
2. Click "Assistant Guidé" → Navigate to `/wizard`
3. Click "Mode Rapide" → Show quick form
4. Fill quick form → Submit → Create site successfully
5. Click "Administration" → Load dashboard view
6. Submit incomplete form → Show validation errors
7. Submit complete form → Show success message

### Definition of Done
- [ ] Implementation matches all acceptance criteria
- [ ] Playwright test validates all scenarios
- [ ] No console errors
- [ ] Quick mode creates sites successfully
- [ ] Navigation to wizard works
- [ ] Admin dashboard loads correctly
- [ ] Deployed to production
- [ ] Manual verification passes