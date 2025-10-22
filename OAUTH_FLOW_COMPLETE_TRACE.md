# OAuth Flow - Complete Trace and Root Cause Analysis

## Problem Statement
OAuth connection on test66 doesn't persist. After connecting Gmail, clicking "Quitter" and reopening with "Continue" shows OAuth as disconnected.

## Complete OAuth Flow

### 1. User Clicks "Connecter avec Google"
**File**: `apps/frontend/src/components/wizard/steps/advanced-features-step.tsx:116-135`
**Action**: `handleOAuth2Connect()`
```typescript
const authUrl = `${baseUrl}/api/customer/oauth2/authorize?wizardSessionId=${sessionId}`;
window.location.href = authUrl;
```
**sessionId value**: Current wizard sessionId (e.g., "test66")

---

### 2. Backend OAuth Authorization
**File**: `apps/backend/src/customer/controllers/oauth2.controller.ts:36-52`
**Action**: `authorize()`
```typescript
const state = JSON.stringify({ wizardSessionId });
const authUrl = this.oauth2Service.getGoogleAuthUrl(state);
return res.redirect(authUrl);
```
**Redirects to**: Google OAuth consent screen with state containing wizardSessionId

---

### 3. Google OAuth Callback
**File**: `apps/backend/src/customer/controllers/oauth2.controller.ts:59-138`
**Action**: `callback()`
**Steps**:
1. Parse wizardSessionId from state: `JSON.parse(state).wizardSessionId`
2. Find wizard session in DB: `wizardSessionRepository.findOne({ where: { sessionId: wizardSessionId }})`
3. Exchange code for tokens and save: `oauth2Service.handleGoogleCallback(code, userId, wizardSession.id)`
4. **Redirect to frontend**:
```typescript
const redirectUrl = `${frontendUrl}/wizard?continue=${wizardSessionId}&step=5&oauth2Status=success&credentialId=${credential.id}&email=${encodeURIComponent(credential.email)}`;
return res.redirect(redirectUrl);
```

**Example redirect URL**:
```
https://logen.locod-ai.com/wizard?continue=test66&step=5&oauth2Status=success&credentialId=abc123&email=locodai.sas%40gmail.com
```

---

### 4. Frontend Session Resolution
**File**: `apps/frontend/src/components/wizard/wizard-provider.tsx:470-486`
**Action**: useEffect with empty dependency array `[]`
```typescript
const continueId = sp.get('continue'); // "test66"

if (continueId) {
  console.log('🔄 CONTINUE MODE: Using existing session ID from URL:', continueId);
  setSessionId(continueId);        // ✅ Sets sessionId = "test66"
  setSessionExists(true);
  setSessionResolved(true);        // ⚠️ Set IMMEDIATELY - no delay!
  return;
}
```
**Result**: `sessionId` state is set to "test66", `sessionResolved` is true

---

### 5. Frontend Load Session Data
**File**: `apps/frontend/src/components/wizard/wizard-provider.tsx:97-148`
**Action**: useEffect with dependency `[sessionId]`
```typescript
useEffect(() => {
  const loadSession = async () => {
    const response = await fetch(`/api/public/wizard-sessions/${sessionId}`, {
      method: 'GET',
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.session) {
        const sessionData = result.session.data?.wizardData || result.session.wizardData || result.session.data;
        setWizardData(sessionData);  // ✅ Loads data from DB including step6 if exists
        setCurrentStep(targetStep);
      }
    }
  };

  loadSession();
}, [sessionId]);
```
**Expected**: Loads existing wizard data from DB, including `step6.emailConfig.oauth` if previously saved

---

### 6. Frontend OAuth Callback Processing
**File**: `apps/frontend/src/components/wizard/steps/advanced-features-step.tsx:16-92`
**Action**: useEffect with dependency `[sessionId]` ⚠️ **CHANGED IN LAST FIX**
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const oauth2Status = params.get('oauth2Status');      // "success"
  const credentialId = params.get('credentialId');      // "abc123"
  const email = params.get('email');                    // "locodai.sas@gmail.com"
  const continueId = params.get('continue');            // "test66"

  if (oauth2Status === 'success' && credentialId && email && !oauthProcessedRef.current) {
    // ⚠️ NEW FIX: Verify sessionId matches
    if (!sessionId) {
      console.log('⏳ [RACE CONDITION FIX] SessionId not set yet, waiting...');
      return;  // ❌ BLOCKS if sessionId is not yet set
    }

    // Store URL sessionId on first run
    if (!urlSessionIdRef.current && continueId) {
      urlSessionIdRef.current = continueId;  // "test66"
    }

    // Verify current sessionId matches URL sessionId
    if (urlSessionIdRef.current && sessionId !== urlSessionIdRef.current) {
      console.log('⚠️ [RACE CONDITION FIX] SessionId mismatch!');
      return;  // ❌ BLOCKS if sessionId doesn't match
    }

    oauthProcessedRef.current = true;

    // Update wizardData with OAuth2 credentials
    updateWizardData({
      step6: {
        ...wizardData.step6,
        emailConfig: {
          ...wizardData.step6?.emailConfig,
          scenario: 'oauth2',
          oauth: {
            connected: true,
            email: decodedEmail,
            oauthCredentialId: credentialId,
          }
        }
      }
    });

    // Save to backend
    setTimeout(async () => {
      await saveProgress();

      // Clean up URL - ⚠️ REPLACES continue with sessionId
      const newUrl = window.location.pathname + '?sessionId=' + sessionId;
      window.history.replaceState({}, '', newUrl);
    }, 500);
  }
}, [sessionId]);  // ⚠️ Depends on sessionId instead of sessionResolved
```

---

### 7. Frontend Display OAuth Status
**File**: `apps/frontend/src/components/wizard/steps/advanced-features/email-configuration-card.tsx:72-93`
**Props**: `oauth2Status={wizardData.step6?.emailConfig?.oauth}`
```typescript
{oauth2Status?.connected ? (
  <div>Connecté - {oauth2Status.email}</div>
) : (
  <button onClick={onOAuth2Connect}>Connecter avec Google</button>
)}
```
**Displays**: "Connecté" if `oauth2Status.connected === true`

---

## Root Cause Analysis

### Issue 1: Dependency on `sessionId` Instead of `sessionResolved`
**Problem**: The useEffect in step 6 now depends on `[sessionId]`:
- When the page loads with OAuth callback params, the useEffect runs
- It checks if `sessionId` is set
- **But**: Even though `sessionResolved` is set to `true` immediately (step 4), the `sessionId` state might not have propagated yet
- **Result**: The early return `if (!sessionId) { return; }` might block the OAuth save

### Issue 2: sessionId Verification Logic
**Problem**: The fix verifies that `sessionId === urlSessionIdRef.current`:
```typescript
if (urlSessionIdRef.current && sessionId !== urlSessionIdRef.current) {
  return;  // BLOCKS
}
```
- If there's any mismatch or timing issue, this blocks the save
- **Hypothesis**: Maybe `sessionId` from wizard context is different from `continueId` from URL?

### Issue 3: Possible Race Condition
**Timeline**:
1. Page loads with URL params: `continue=test66&oauth2Status=success&...`
2. wizard-provider useEffect (step 4) runs: Sets `sessionId = "test66"`, `sessionResolved = true`
3. advanced-features-step useEffect (step 6) runs: Checks if `sessionId` is set
4. **Race**: If step 6's useEffect runs BEFORE step 4's state update propagates, `sessionId` is still `null`
5. **Result**: Early return blocks OAuth save

### Issue 4: `updateWizardData` Might Be Overwritten
**Problem**: Two competing data sources:
1. `loadSession()` (step 5) loads data from DB → calls `setWizardData(sessionData)`
2. OAuth callback processing (step 6) adds OAuth data → calls `updateWizardData({ step6: {...} })`

**Race condition**:
- If `loadSession()` runs AFTER OAuth callback processing completes
- It overwrites wizardData with DB data (which doesn't have OAuth yet)
- **Result**: OAuth data is lost

---

## Why "Connecté" Doesn't Appear Anymore

After the last fix (changing dependency from `[sessionResolved]` to `[sessionId]`):

**Scenario A - First OAuth Connection**:
1. User clicks "Connecter avec Google"
2. OAuth flow completes, redirects to `/wizard?continue=test66&step=5&oauth2Status=success&...`
3. wizard-provider sets `sessionId = "test66"`
4. advanced-features-step useEffect runs
5. **BLOCKS** because either:
   - `sessionId` is not yet set (race condition)
   - OR `sessionId` doesn't match `urlSessionIdRef.current` (verification fails)
6. OAuth data is never saved to wizardData
7. "Connecté" never appears

**Scenario B - After "Quitter" and "Continue"**:
1. User clicks "Continue" on test66
2. Redirects to `/wizard?continue=test66&step=5`
3. `loadSession()` loads data from DB
4. DB doesn't have OAuth data (because it was never saved)
5. "Connecté" doesn't appear

---

## Fix Strategies

### Strategy 1: Remove sessionId Verification (Simplest)
Remove the sessionId matching logic since we already have `oauthProcessedRef` to prevent duplicates:
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const oauth2Status = params.get('oauth2Status');
  const credentialId = params.get('credentialId');
  const email = params.get('email');

  if (oauth2Status === 'success' && credentialId && email && !oauthProcessedRef.current) {
    oauthProcessedRef.current = true;

    updateWizardData({
      step6: {
        ...wizardData.step6,
        emailConfig: {
          ...wizardData.step6?.emailConfig,
          scenario: 'oauth2',
          oauth: {
            connected: true,
            email: decodeURIComponent(email),
            oauthCredentialId: credentialId,
          }
        }
      }
    });

    setTimeout(async () => {
      await saveProgress();
      const newUrl = window.location.pathname + '?continue=' + sessionId;  // ✅ Use continue not sessionId
      window.history.replaceState({}, '', newUrl);
    }, 500);
  }
}, [sessionId, updateWizardData, saveProgress, wizardData.step6]);  // ✅ Add all dependencies
```

### Strategy 2: Wait for sessionResolved AND sessionId
```typescript
useEffect(() => {
  if (!sessionId) return;  // Wait for sessionId to be set
  // ... rest of OAuth processing
}, [sessionId, sessionResolved]);
```

### Strategy 3: Don't Clean Up URL (Keep OAuth Params)
Don't replace URL with sessionId - keep the continue parameter:
```typescript
// Don't do this:
// const newUrl = window.location.pathname + '?sessionId=' + sessionId;

// Keep continue parameter:
const newUrl = window.location.pathname + '?continue=' + sessionId + '&step=5';
window.history.replaceState({}, '', newUrl);
```

---

## Recommended Fix

**Use Strategy 1** - Simplify the logic and add proper dependencies:
1. Remove sessionId verification (rely on `oauthProcessedRef` for duplicate prevention)
2. Add ALL dependencies to useEffect to satisfy React hooks rules
3. Change URL replacement to use `continue` parameter instead of `sessionId`
4. Ensure `saveProgress()` uses the correct sessionId from context

This should fix the issue while maintaining proper React patterns.
