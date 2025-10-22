# 🔧 DEBUG STRATEGY
**Version: v0.0**
*Created: September 15, 2025*
*Last Updated: September 23, 2025*
*Purpose: Complete end-to-end testing and debugging strategy for LOGEN v2*

## 📋 **OVERVIEW**

This document serves as our reference for debugging the Continue button functionality in the LOGEN v2 wizard. We will document all debugging progress, findings, and fixes here.

## 🎯 **OBJECTIVE**

Test the complete Continue button workflow to verify it works correctly and takes users to the exact step where they left off (not defaulting to Step 1).

## 🔧 **INCREMENTAL DEBUGGING METHODOLOGY**

### **Approach**:
We use an **incremental step-by-step debugging approach** where each step builds on the previous ones to ensure comprehensive testing and immediate issue resolution.

### **TERMINOLOGY CLARIFICATION**:
- **STEP** = Individual action (e.g., "Step 5: Set Timestamp Site Name")
- **CYCLE** = Test that runs ALL steps from Step 1 up to Step N (e.g., "Cycle 12" = test running Steps 1-12)

### **For Each Step N, Complete Verification Cycle**:

1. **📋 Code Analysis**: Review the code that implements step N
2. **🔍 Static Analysis**: Analyze if the implementation looks correct
3. **🤖 Automated Test**: Run any automated tests I can execute
4. **✅ Self Verification**: Confirm my tests passed
5. **👤 User Manual Test**: Ask you to manually test steps 1 through N
6. **✅ User Confirmation**: Get your confirmation that steps 1-N work correctly
7. **➡️ Progression**: Only then move to step N+1

### **Progressive Testing Cycles**:

- **Cycle 1**: Test Step 1 only → Get confirmation → Move forward
- **Cycle 2**: Test Steps 1+2 together → Get confirmation → Move forward
- **Cycle 3**: Test Steps 1+2+3 together → Get confirmation → Move forward
- **Cycle 6**: Test Steps 1+2+3+4+5+6 together → **FOUNDATION CYCLE**
- **Continue until Step 14**

### **SPECIAL CYCLE DEPENDENCIES (Steps 10+)**:

**For Cycles 10-13 and forward:**
- **Re-execute Steps 1-6 ONLY** (foundation steps)
- **Transfer the site name** created in Step 5 to all subsequent steps
- **Skip Steps 7-9** (Quitter, My Sites verification, Continue button)

**Example:**
- **Cycle 10** = Steps 1-6 + Step 10 (using same site name)
- **Cycle 11** = Steps 1-6 + Steps 10-11 (using same site name)
- **Cycle 12** = Steps 1-6 + Steps 10-12 (using same site name)
- **Cycle 13** = Steps 1-6 + Steps 10-13 (using same site name)

### **Key Principles**:
- **🚫 Never skip steps** - if Step N fails, we fix it before moving to Step N+1
- **🔄 Always cumulative** - each cycle tests ALL previous steps plus the new one
- **👤 User confirmation required** - cannot proceed without manual verification
- **🔧 Fix immediately** - if any step fails, we stop and fix before continuing
- **📝 Document everything** - update this document with results from each cycle

### **Example Workflow**:
```
Step 1: Analyze auth code → Test → User confirms → ✅
Step 2: Analyze navigation + auth → Test both → User confirms → ✅
Step 3: Analyze create site + previous steps → Test all 3 → User confirms → ✅
...and so on
```

## 📝 **DETAILED TEST STEPS**

### **1. 🔐 Authentication**
- Login as `test@example.com` (with password `Administrator2025`)
- **Status**: ⏳ Pending
- **Notes**:

### **2. 🏠 Navigate to My Sites**
- Go to My Sites page
- Verify existing sites are displayed
- **Status**: ⏳ Pending
- **Notes**:

### **3. ➕ Create New Site**
- Click "Create a new site" button
- This goes to `https://logen.locod-ai.com/sites/create` first
- Click "Commencer" button in the "Assistant Classique" section
- This should start the wizard at Step 1
- **Status**: ⏳ Pending
- **Notes**:

### **4. 📋 Complete Steps 1-3 (to reach Step 4)**
- **Step 1**: Complete "Bienvenue" (Welcome) step
- **Step 2**: Complete "Modèle" (Template) step
- **Step 3**: Complete "Informations" (Business Info) step
- **✅ CRITICAL VERIFICATION**: Confirm we are actually on Step 3 "Informations" and the URL mapping is correct
- **Status**: ⏳ Pending
- **Notes**:

### **5. ✏️ Modify Site Name in Step 3 (Informations)**
- In Step 3 "Informations" step, replace the site name with a **timestamp** (e.g., `Site_1757928400000`)
- This creates a unique identifier for our test session
- **Status**: ⏳ Pending
- **Notes**:
- **Timestamp Used**:

### **6. ➡️ Navigate to Step 4**
- Move from Step 3 to Step 4 "Contenu" step
- Verify we're actually on Step 4 "Contenu"
- **Status**: ⏳ Pending
- **Notes**:

### **7. 🚪 Exit via "Quitter" Button**
- Click the "Quitter" (Quit) button while on Step 4 "Contenu"
- This should save progress and return to My Sites
- **Status**: ⏳ Pending
- **Notes**:

### **8. 🔍 Verify My Sites Display**
- Confirm we're back on My Sites page
- **CRITICAL**: Verify our new timestamped site appears in the list
- Verify it shows the correct progress (should indicate Step 4 or similar)
- **Status**: ⏳ Pending
- **Notes**:

### **9. 🎯 Test Continue Button**
- Click the "Continue" button for our newly created timestamped site
- **EXPECTED RESULT**: Should land on Step 4 "Contenu" where we left off
- **NOT** Step 1 "Bienvenue" (Welcome step)
- **Status**: ✅ SUCCESS
- **Actual Result**: Continue button works correctly, lands on Step 4 "Contenu"
- **Notes**: Fixed with currentStepNumber implementation

---

## 🤖 **AI CONTENT GENERATION WORKFLOW (CYCLES 10-14)**

*Extended testing for the complete AI content generation process*

**⚠️ IMPORTANT:** All Cycles 10+ require **Steps 1-6** as foundation and use the **same site name** created in Step 5.

### **CYCLE 6 (FOUNDATION)** - Reusable Base for Cycles 10+
- Execute Steps 1-6 (Authentication → Navigate to Step 4 "Contenu")
- Output: Site name (timestamp) and session data for subsequent cycles
- This becomes the foundation that Cycles 10+ will call

### **STEP 10: 🎨 Test "Générer par IA" Button**
- **Prerequisite**: Execute Cycle 6 (Steps 1-6) to reach Step 4 "Contenu"
- **Action**: Click the "Générer par IA" button
- **EXPECTED RESULT**: Should show loading state with message:
  - "⏳ En attente d'un expert..."
  - Timer showing elapsed time: "⏱️ Temps: XX secondes"
- **Status**: ⏳ Pending
- **Actual Result**:
- **Notes**:

### **STEP 11: 🔍 Verify AI Request in Admin Queue**
- **Prerequisite**: Execute Steps 1-6 + Step 10 (AI generation triggered)
- **Action**: Navigate to admin console: `https://admin.logen.locod-ai.com/`
- Login with: `admin@locod.ai` / `admin123`
- Go to: `https://admin.logen.locod-ai.com/dashboard/ai-queue`
- **EXPECTED RESULT**: New AI request appears in queue for our timestamped site
- **Status**: ⏳ Pending
- **Actual Result**:
- **Notes**:

### **STEP 12: 🧠 Process AI Request as Expert** ⚠️ **CURRENTLY BROKEN**
- **Prerequisite**: Execute Steps 1-6 + Steps 10-11 (AI request in queue)
- **Action**: In Admin Queue, find the new request and click "Traiter" button
- **Copy the "Prompt Suggéré" content** (the system-generated prompt)
- **Execute the prompt myself** to generate actual website content
- **Paste MY GENERATED RESULT** into "Résultat IA" field (textarea with placeholder "Collez ici le contenu généré par Claude/ChatGPT...")
- **Click "✅ Appliquer & Terminer"** to complete the request
- **⚠️ CRITICAL VERIFICATION**: Return to queue and verify button changed from "Traiter" to "Voir Résultat"
- **Status**: ❌ BROKEN - Still shows "Traiter" instead of "Voir Résultat"
- **Actual Result**: Form submission not working properly
- **Notes**: Need to fix form interaction logic

### **STEP 13: ✅ Verify Content Processing Success**
- **Prerequisite**: Execute Steps 1-6 + Steps 10-12 (AI processing completed successfully)
- **Action**: Return to customer wizard at `https://logen.locod-ai.com/`
- Navigate back to our timestamped site's Step 4 "Contenu"
- **EXPECTED RESULTS**:
  - Loading message "⏳ En attente d'un expert..." disappears
  - Success message appears indicating content processing completed
  - Step 4 interface updates with generated content
- **Status**: ⏳ Blocked (waiting for Step 12 to work)
- **Actual Result**: Cannot test until Step 12 is fixed
- **Notes**: Dependent on Step 12 success

### **CYCLE 14: 🎨 V1 IMAGE GENERATION TESTING (3 Variants)**

*Complete image generation workflow testing for GitHub Issue #125*

**⚠️ CRITICAL:** All Cycle 14 variants require **complete Steps 1-13** (full AI content workflow) before testing image generation.

### **CYCLE 14a: "J'ai déjà mes images" (Manual Upload)**
- **Prerequisite**: Execute complete Steps 1-13 (AI content workflow finished)
- **Action**: Navigate to Step 5 "Images & Logo" and test manual upload flow:
  1. Select "J'ai déjà mes images" radio button
  2. Upload placeholder image to ALL image types:
     - Logo navigation
     - Logo footer
     - Image hero/bannière
     - Favicon clair
     - Favicon sombre
     - **Services images** (1 per service defined)
     - **Blog article images** (1 per article defined)
  3. Verify images are saved and displayed in interface
  4. Click Continue to next wizard step
- **EXPECTED RESULT**: All images uploaded successfully, wizard progresses correctly
- **Status**: ⏳ Pending
- **Actual Result**:
- **Notes**: Tests complete manual image workflow

### **CYCLE 14b: "Générer mes images par IA" (AI Generation) - V2.0 CORE REQUIREMENTS**
- **Prerequisite**: Execute complete Steps 1-13 (AI content workflow finished)
- **Action**: Navigate to Step 5 "Images & Logo" and test AI generation flow:
  1. Select "Générer mes images par IA" radio button and style
  2. Click "🎨 Demander la génération de toutes les images" button
  3. **Admin Processing (REAL IMAGE UPLOAD)**:
     - Check `admin.logen.locod-ai.com` queue for image request
     - Click "Traiter" button to view the generated prompt
     - **CRITICAL**: Upload REAL images (not placeholders) to upload fields:
       - Logo navigation: actual image file
       - Logo footer: actual image file
       - Image hero/bannière: actual image file
       - Favicon clair: actual image file
       - Favicon sombre: actual image file
       - Images services: actual image files (1 per service defined)
       - Images blog: actual image files (1 per article defined)
     - Complete admin processing with "✅ Appliquer & Terminer"
     - **VERIFICATION**: Reopen the same request in admin to verify images persist
  4. **Customer Auto-Apply Verification (CORE ISSUE)**:
     - Return to customer portal Step 5
     - **CRITICAL**: Images should automatically appear without manual refresh (like content workflow)
     - **THIS IS THE MAIN PROBLEM**: Auto-apply mechanism from admin to customer interface
     - Verify all uploaded images are displayed and available in customer interface
     - Click Continue to next step
- **EXPECTED RESULT**: AI image workflow works end-to-end with V1.2 enhanced prompt system
- **Status**: 🔧 IN DEVELOPMENT
- **Current Progress**:
  - ✅ **Test Created**: Complete cycle14b-ai-image-generation-v1.2.spec.ts
  - ✅ **V1.2 Backend Enhanced**: Added enhanced blog elements to prompt generation (`/var/apps/logen/apps/backend/src/admin/services/ai-queue.service.ts:580`)
  - ✅ **Button Selector Fixed**: Updated test to find correct "🎨 Demander la génération de toutes les images" button
  - ✅ **V1.2 Verification Logic**: Test validates both basic and enhanced prompt elements
  - ⏳ **Blocked**: nginx reverse proxy issue prevents test execution (lopro-crewai:8080 not found)
- **Actual Result**: Test successfully identifies where it stops - at submit button (now fixed)
- **Notes**: V1.2 enhanced prompt includes `publication d'articles`, `blog articles`, `contenu éditorial`, `articles réguliers` for improved blog image generation
- **Technical Details**:
  - **Test File**: `/var/apps/logen/tests/browser-automation/tests/cycle14b-ai-image-generation-v1.2.spec.ts`
  - **Backend Method**: `generateImagePrompts()` in `ai-queue.service.ts:580`
  - **Enhanced Blog Prompt**:
    ```javascript
    prompts += `Concept: partage de connaissances, expertise, communication, articles informatifs, contenu éditorial, publication d'articles, blog articles. L'image doit évoquer la rédaction d'articles et la publication de contenu pour le blog avec des articles réguliers.`;
    ```
  - **V1.2 Verification**: Test checks for 4 enhanced blog terms in addition to basic elements

### **CYCLE 14c: "Approche Mixte" (Mixed Approach)**
- **Prerequisite**: Execute complete Steps 1-13 (AI content workflow finished)
- **Action**: Navigate to Step 5 "Images & Logo" and test mixed approach:
  1. Select "Approche mixte" radio button
  2. **Mixed Selection**:
     - Upload some images manually with placeholder
     - Select AI generation for other images
  3. **Admin Verification** (for AI-selected images only):
     - Check admin queue for partial image request
     - Verify prompt is for image generation (DALL-E)
     - Verify "Résultat IA" has upload fields for only AI-requested images:
       - Only fields for images selected as "IA" in mixed approach
       - No fields for images selected as "Upload" (manually uploaded)
     - Simulate upload of placeholder images to AI-requested fields only
     - Complete admin processing with "✅ Appliquer & Terminer"
  4. **Customer Verification**:
     - Return to customer portal Step 5
     - **CRITICAL**: Images should automatically appear without manual refresh (like content workflow)
     - Verify both manually uploaded AND AI-generated images displayed
     - Click Continue to next step
- **EXPECTED RESULT**: Mixed approach works with both manual and AI images
- **Status**: ⏳ Pending
- **Actual Result**:
- **Notes**: Tests combination of manual upload + AI generation

---

## 🔍 **KEY VERIFICATION POINTS**

### **Step Mapping Verification**
- [ ] Sites/create page loads correctly
- [ ] "Assistant Classique" → "Commencer" button works
- [ ] Step number mapping is accurate (Step 3 = Informations, Step 4 = Contenu)
- [ ] URL parameters match step numbers correctly
- [ ] Progress indicators show correct step numbers

### **Session Management**
- [ ] Site name update with timestamp works
- [ ] "Quitter" button properly saves progress
- [ ] New site appears in My Sites with correct progress indicator
- [ ] Session data is preserved (site name, progress, etc.)

### **Continue Button Functionality**
- [x] Continue button takes us to Step 4 "Contenu" (not Step 1)
- [x] All form data is preserved when continuing
- [x] Step progress is accurately restored

### **AI Content Generation Workflow**
- [ ] "Générer par IA" button triggers loading state
- [ ] Loading shows proper waiting message and timer
- [ ] AI request appears in admin queue correctly
- [ ] Admin can process request with "Traiter" button
- [ ] Generated content gets applied to all sections
- [ ] Customer wizard updates with processed content
- [ ] All content sections are populated: Principal, Services, À Propos, Témoignages, FAQ, Blog

---

## 🐛 **KNOWN ISSUES TO FIX**

### **1. Step Numbering Mismatch**
- **Issue**: Code uses 0-based indexing but UI shows 1-based
- **Impact**: Confusion between internal step numbers and displayed step numbers
- **Status**: 🔍 Identified
- **Fix Required**: ⏳ Pending

### **2. Step Name Mapping**
- **Issue**: Need to verify actual step names match UI display vs code configuration
- **Current Code Mapping**:
  ```
  step 0: 'Bienvenue' (Welcome)        → UI Step 1
  step 1: 'Modèle' (Template)          → UI Step 2
  step 2: 'Informations' (Business)    → UI Step 3
  step 3: 'Contenu & Services'         → UI Step 4 "Contenu"
  step 4: 'Images & Logo'              → UI Step 5
  step 5: 'Fonctionnalités'            → UI Step 6
  step 6: 'Révision & Création'        → UI Step 7
  ```
- **Status**: 🔍 Needs verification
- **Fix Required**: ⏳ Pending

---

## 📊 **DEBUGGING PROGRESS LOG**

### **Session 1 - September 15, 2025**
- **Fixed**: Continue button API endpoint from `/api/public/wizard-sessions/` to `/customer/wizard-sessions/`
- **Fixed**: Frontend to use authenticated `customerApiClient` instead of fetch
- **Fixed**: My Sites page to use consistent `wizardStep` (numeric) instead of mixed `currentStep` (string)
- **Fixed**: useEffect dependency array to prevent step override
- **Deployed**: Frontend and backend following deployment guide
- **Status**: ✅ Technical fixes complete, ready for end-to-end testing

---

## 📷 **SCREENSHOTS & EVIDENCE**

### **Step 1 - Authentication**
- Screenshot: ⏳ Pending

### **Step 2 - My Sites Page**
- Screenshot: ⏳ Pending

### **Step 3 - Sites Create Page**
- Screenshot: ⏳ Pending

### **Step 4 - Wizard Steps 1-3**
- Screenshot: ⏳ Pending

### **Step 5 - Timestamp Site Name**
- Screenshot: ⏳ Pending

### **Step 6 - Step 4 Contenu**
- Screenshot: ⏳ Pending

### **Step 7 - After Quitter Button**
- Screenshot: ⏳ Pending

### **Step 8 - My Sites with New Entry**
- Screenshot: ⏳ Pending

### **Step 9 - Continue Button Result**
- Screenshot: ⏳ Pending

---

## ✅ **SUCCESS CRITERIA**

### **Test Passes When**:
- ✅ User can complete wizard steps 1-3 successfully
- ✅ Site name can be updated with timestamp in Step 3
- ✅ "Quitter" button saves progress and returns to My Sites
- ✅ New timestamped site appears in My Sites list
- ✅ Continue button takes user to Step 4 "Contenu" (not Step 1)
- ✅ All session data is preserved (site name, form fields, progress)
- ✅ No console errors during the entire flow

### **Test Fails When**:
- ❌ Continue button takes user to Step 1 instead of Step 4
- ❌ Session data is lost (site name resets, form fields empty)
- ❌ Site doesn't appear in My Sites after quitting
- ❌ Step mapping is incorrect (wrong step numbers/names)
- ❌ Console errors occur during the flow

---

## 🔧 **TECHNICAL NOTES**

### **Recent Fixes Applied**:
1. **API Endpoint**: Changed from `/api/public/wizard-sessions/` to `/customer/wizard-sessions/`
2. **Authentication**: Using `customerApiClient` with proper token management
3. **Data Consistency**: Both table and cards view use numeric `wizardStep`
4. **useEffect Fix**: Empty dependency array prevents re-running and step override
5. **Code Cleanup**: Removed 60+ lines of localStorage scanning garbage code

### **Backend Configuration**:
- Database: `logen-postgres` container with `locod_pass_2024`
- Environment: Individual variables (not DATABASE_URL)
- Network: `logen-network` for container communication
- Health: All containers showing healthy status

---

## 📋 **NEXT ACTIONS**

1. **Execute end-to-end test** following the detailed steps above
2. **Document each step** with screenshots and actual results
3. **Identify any remaining issues** during the test execution
4. **Apply fixes** for any discovered problems
5. **Re-test** until Continue button works correctly
6. **Update this document** with final results and conclusions

---

*This document will be updated throughout the debugging process with actual results, screenshots, and findings.*