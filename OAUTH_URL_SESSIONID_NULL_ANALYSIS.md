# OAuth URL sessionId=null - Root Cause Analysis

## Problem Statement
After returning from Google OAuth, the URL shows `https://logen.locod-ai.com/wizard?sessionId=null` instead of `?continue=test66&step=5`.

## All Places Where URL is Modified in Wizard

### 1. Backend OAuth Controller
**File**: `apps/backend/src/customer/controllers/oauth2.controller.ts:125`
**Code**:
```typescript
const redirectUrl = `${frontendUrl}/wizard?continue=${wizardSessionId}&step=5&oauth2Status=success&credentialId=${credential.id}&email=${encodeURIComponent(credential.email)}`;
return res.redirect(redirectUrl);
```
**Result**: Backend redirects with `continue=test66`, NOT `sessionId=null`
**Conclusion**: ✅ Backend is CORRECT

### 2. AdvancedFeaturesStep OAuth Callback Handler
**File**: `apps/frontend/src/components/wizard/steps/advanced-features-step.tsx:70-73`
**Code**:
```typescript
if (continueId) {
  const newUrl = window.location.pathname + '?continue=' + continueId + '&step=5';
  window.history.replaceState({}, '', newUrl);
}
```
**When**: After 500ms delay following OAuth success
**Result**: Should write `?continue=test66&step=5`, NOT `sessionId=null`
**Conclusion**: ✅ Code is CORRECT (if it executes)

### 3. AdvancedFeaturesStep Error Handler
**File**: `apps/frontend/src/components/wizard/steps/advanced-features-step.tsx:80-84`
**Code**:
```typescript
setTimeout(() => {
  if (continueId) {
    const newUrl = window.location.pathname + '?continue=' + continueId + '&step=5';
    window.history.replaceState({}, '', newUrl);
  }
}, 100);
```
**When**: On OAuth error
**Result**: Should write `?continue=test66&step=5`, NOT `sessionId=null`

### 4. WizardNavigation
**File**: `apps/frontend/src/components/wizard/wizard-navigation.tsx`
**Result**: Does NOT modify URL parameters, only uses `router.push('/')` or `router.push('/sites')`

### 5. WizardProvider
**File**: `apps/frontend/src/components/wizard/wizard-provider.tsx`
**Result**: Does NOT modify URL at all

## Where Does `sessionId=null` Come From?

Since I've checked all URL modifications and NONE of them write `sessionId=`, there must be ANOTHER source.

### Theory 1: Old Cached Code
**Problem**: The deployed frontend might be serving old cached code that still uses `sessionId` instead of `continueId`
**Evidence**:
- I recently changed the code to use `continueId` instead of `sessionId`
- Browser might be caching the old JavaScript bundle
**Solution**: Clear browser cache or force reload (Ctrl+Shift+R)

### Theory 2: There's a DIFFERENT URL Modification I Haven't Found
**Problem**: There might be code in another file that modifies the URL
**Search needed**:  Need to search the ENTIRE codebase for any code that writes `sessionId=`

### Theory 3: The useEffect Doesn't Execute At All
**Problem**: The useEffect in advanced-features-step.tsx might not be executing because of the early return
**Current Code Flow**:
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const oauth2Status = params.get('oauth2Status');
  const credentialId = params.get('credentialId');
  const email = params.get('email');
  const continueId = params.get('continue');

  if (oauth2Status === 'success' && credentialId && email && !oauthProcessedRef.current) {
    // Check if sessionId is set
    if (!sessionId) {
      console.log('⏳ SessionId not yet set, waiting for next render...');
      return; // ❌ EARLY RETURN - Nothing is executed
    }

    // ... rest of code that cleans URL
  }
}, [sessionId, updateWizardData, saveProgress, wizardData.step6]);
```

**Problem**: If `sessionId` is `null` on first render, the useEffect returns early and NEVER cleans the URL!
**Why sessionId might be null**:
1. Backend redirects to `/wizard?continue=test66&step=5&oauth2Status=success&...`
2. WizardProvider mounts and starts to process URL parameters
3. AdvancedFeaturesStep mounts BEFORE WizardProvider finishes setting `sessionId`
4. useEffect runs, sees `sessionId = null`, returns early
5. useEffect doesn't run again because `sessionId` doesn't change (stays null?)

### Theory 4: Something ELSE is Writing the URL Before My Code Runs
**Problem**: There might be code that executes BEFORE my useEffect and writes `sessionId=null`
**Need to check**:
- Does wizard-provider or any parent component modify the URL on mount?
- Is there middleware or Next.js code that processes URL params?

## Key Question: Where is `sessionId=null` Actually Written?

I need to find the EXACT line of code that writes `sessionId=null` to the URL.

**Search Strategy**:
1. Search entire frontend codebase for `sessionId=`
2. Check if there's old code that hasn't been cleaned up
3. Add console.log BEFORE and AFTER every `window.history.replaceState` call to trace execution order
4. Check browser Network tab to see what URL the backend actually redirects to

## Execution Order Analysis

When user returns from Google OAuth:

1. **Backend redirect** → `/wizard?continue=test66&step=5&oauth2Status=success&credentialId=abc&email=...`
2. **Page loads** → Next.js loads /wizard page
3. **WizardProvider mounts** → useEffect runs (line 470-486 in wizard-provider.tsx)
   - Sees `continue=test66` parameter
   - Sets `sessionId = "test66"`
   - Sets `sessionResolved = true`
   - **Takes some time to execute**
4. **AdvancedFeaturesStep mounts** → useEffect runs (line 14-87 in advanced-features-step.tsx)
   - Extracts URL params: `oauth2Status`, `credentialId`, `email`, `continueId`
   - Checks if OAuth success
   - **Checks if `sessionId` is set** ← ⚠️ RACE CONDITION
   - If `sessionId` is still `null`, returns early
   - **URL is NEVER cleaned**

## ROOT CAUSE HYPOTHESIS

The URL shows `sessionId=null` because:
1. Something ELSE in the codebase writes `sessionId=` to the URL
2. OR the old cached code still uses `sessionId` instead of `continueId`
3. OR there's a timing issue where the URL cleaning code never executes

## Next Steps

1. **Search entire codebase** for any code that writes `sessionId=` to URL
2. **Add extensive logging** to trace exact execution order
3. **Check browser console** for the logs I added
4. **Check browser cache** - force clear and reload
5. **Verify deployment** - ensure the latest code is actually deployed

## Proposed Fix

If the issue is the early return preventing URL cleanup, I should clean the URL REGARDLESS of whether sessionId is set:

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const oauth2Status = params.get('oauth2Status');
  const continueId = params.get('continue');

  // ALWAYS clean OAuth params from URL if they exist
  if (oauth2Status && continueId) {
    const newUrl = window.location.pathname + '?continue=' + continueId + '&step=5';
    window.history.replaceState({}, '', newUrl);
    console.log('🧹 URL cleaned immediately on mount');
  }

  // Then process OAuth if ready
  if (oauth2Status === 'success' && credentialId && email && !oauthProcessedRef.current) {
    if (!sessionId) {
      console.log('⏳ SessionId not yet set, waiting...');
      return;
    }
    // ... save OAuth data
  }
}, [sessionId, ...]);
```

This way, the URL is cleaned IMMEDIATELY regardless of sessionId state.
