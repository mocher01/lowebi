# User Story: Wizard Step 0 - Welcome & Terms (v1.1.1.9.2.4.1.2)

## Issue #12: Wizard Welcome & Terms Acceptance Screen

### Description
As a user who clicked "Assistant Guidé" from the portal, I want to see a welcoming wizard introduction screen that explains the process and requires me to accept terms before starting the guided site creation.

### Acceptance Criteria

1. **Navigation Context**
   - [ ] Accessible via URL: `/wizard` 
   - [ ] Shows when user clicks "Lancer l'assistant" from portal
   - [ ] Header shows "Assistant de Création de Site Locod.AI"

2. **Enhanced Progress Indicator**
   - [ ] **Professional centered design** with proper spacing and alignment
   - [ ] **Step counter**: "Étape 1 sur 8" text above progress bar
   - [ ] **Visual progress bar**: Horizontal bar showing 12.5% completion (1/8)
   - [ ] **Step circles**: Numbered circles (1-8) with connector lines
   - [ ] **Active step**: Circle filled with blue background, white number
   - [ ] **Completed steps**: Circle filled with green background, white checkmark
   - [ ] **Future steps**: Circle with gray border, gray number
   - [ ] **Step labels**: Clear, concise French labels below each circle
   - [ ] **Responsive design**: Stacks vertically on mobile, horizontal on desktop
   - [ ] **Smooth animations**: Progress bar fills smoothly, circles animate on state change

3. **Welcome Content**
   - [ ] Main title: Display from `text.welcome.title` (French by default)
   - [ ] Subtitle: Display from `text.welcome.subtitle` explaining the wizard purpose
   - [ ] Language selector in top navigation (FR/EN with FR as default)
   - [ ] Help button in top right corner

4. **Site Language Selection Section**
   - [ ] Label: "Langue de votre site web" (Language for your website)
   - [ ] Dropdown with options: Français, English, Español, Deutsch
   - [ ] Default selection: Français
   - [ ] Store selection in `wizardData.siteLanguage` (NOT portal language)
   - [ ] This determines the language of the generated website content

5. **Terms & Conditions Section**
   - [ ] Gray background box with rounded corners
   - [ ] Title: Display from `text.welcome.terms.title`
   - [ ] Three bullet points from `text.welcome.terms.item1/2/3`
   - [ ] Checkbox with label from `text.welcome.terms.accept`
   - [ ] Checkbox bound to `wizardData.termsAccepted`

6. **Navigation Button**
   - [ ] Button text: Display from `text.common.start` ("Commencer")
   - [ ] Disabled state when terms not accepted (gray, cursor not allowed)
   - [ ] Enabled state when terms accepted (blue, hover effect)
   - [ ] Click action: Navigate to Step 1 (Template Selection)

7. **Visual Design**
   - [ ] Centered layout with max-width container
   - [ ] Clean typography with proper spacing
   - [ ] Responsive design for mobile/tablet
   - [ ] Smooth transitions between states

8. **Help System**
   - [ ] Help button opens modal with navigation tips
   - [ ] Modal displays help content from `text.help.*`
   - [ ] Close button to dismiss modal

### Technical Requirements
- URL: `/wizard`
- Alpine.js app: `enhancedWizardApp()`
- Current step: `currentStep === 0`
- Data binding: `wizardData.termsAccepted`, `wizardData.siteLanguage`
- Text system: Uses `text` object with French/English translations
- Navigation: `nextStep()` function moves to step 1

### Test Scenarios
1. Load `/wizard` → See Step 0 welcome screen in French
2. Try clicking "Commencer" → Button disabled until terms checked
3. Check terms checkbox → Button becomes enabled and blue
4. Click "Commencer" → Navigate to Step 1 (Template Selection)
5. Change language → UI updates to selected language
6. Click help button → Modal opens with guidance
7. Mobile view → Layout remains usable and responsive

### Definition of Done
- [ ] Implementation matches all acceptance criteria
- [ ] Playwright test validates all scenarios
- [ ] No console errors or Alpine.js warnings
- [ ] Language switching works correctly
- [ ] Terms acceptance state properly managed
- [ ] Navigation to Step 1 functional
- [ ] Deployed to production
- [ ] Manual verification passes