# User Story: Welcome & Terms Screen (v1.1.1.9.2.4.1.2)

## Issue #12: Wizard Step 0 - Welcome & Terms Acceptance

### Description
As a new user visiting the wizard, I want to see a welcoming introduction screen that explains what I'm about to do and requires me to accept terms before proceeding.

### Acceptance Criteria
1. **Welcome Message**
   - [ ] Display "Assistant de Création de Site Locod.AI" as main title
   - [ ] Show subtitle explaining the wizard purpose
   - [ ] Display in French by default

2. **Terms & Conditions**
   - [ ] Checkbox for terms acceptance with label "J'accepte les conditions d'utilisation"
   - [ ] Checkbox must be checked to enable "Commencer" button
   - [ ] Link to full terms (can be placeholder for now)

3. **Language Selection**
   - [ ] Language toggle (FR/EN) in top right corner
   - [ ] Default to French (FR)
   - [ ] Persist language choice throughout wizard

4. **Navigation**
   - [ ] "Commencer" button disabled until terms accepted
   - [ ] Button becomes enabled when checkbox is checked
   - [ ] Clicking "Commencer" moves to Step 1

5. **Visual Design**
   - [ ] Clean, centered layout
   - [ ] Locod.AI branding/logo if available
   - [ ] Professional color scheme (blue primary)
   - [ ] Responsive design for mobile/tablet

### Technical Requirements
- URL: `/wizard`
- Step indicator shows Step 0 of 8
- Alpine.js state: `currentStep === 0`
- Data binding: `wizardData.termsAccepted`
- Language stored in: `wizardData.language`

### Test Scenarios
1. Load wizard → See welcome screen in French
2. Try to click "Commencer" → Button is disabled
3. Check terms checkbox → Button becomes enabled
4. Click "Commencer" → Navigate to Step 1
5. Toggle language → UI updates to English/French

### Definition of Done
- [ ] Implementation matches all acceptance criteria
- [ ] Playwright test validates all scenarios
- [ ] No console errors
- [ ] Deployed to production
- [ ] Manual verification passes