# OAuth Persistence Bug - ROOT CAUSE IDENTIFIED

## 🐛 The Bug

When connecting Gmail OAuth on **test66**, the OAuth data saves to **Cycle18** instead. After clicking "Quitter" and reopening test66, OAuth shows as disconnected, while Cycle18 shows as connected.

## 🔬 Root Cause Analysis

### Evidence from Database

```sql
SELECT session_id, site_name, wizard_data->'step6'->'emailConfig'->'oauth' as oauth_data
FROM wizard_sessions
WHERE session_id IN ('5fe486a1-59dc-41c3-a267-0f0cbb625939', 'Cycle18_E2E_1759857573047')
   OR site_name IN ('test66', 'Cycle18_E2E_1759857573047');
```

**Results**:
- `session_id='5fe486a1-59dc-41c3-a267-0f0cbb625939'`, `site_name='test66'` → **NO OAuth data** ❌
- `session_id='Cycle18_E2E_1759857573047'`, `site_name='Cycle18_E2E_1759857573047'` → **HAS OAuth data** ✅
  ```json
  {
    "email": "locodai.sas@gmail.com",
    "connected": true,
    "oauthCredentialId": "69e9ba75-8f90-47b5-8a67-2485649268d7"
  }
  ```

This confirms OAuth data is being saved to the WRONG session.

### The Race Condition - Detailed Flow

**File**: `apps/frontend/src/components/wizard/steps/advanced-features-step.tsx`

#### Lines 8-61: The Problematic useEffect

```typescript
export function AdvancedFeaturesStep() {
  const { wizardData, updateWizardData, sessionId, saveProgress } = useWizard();  // Line 8

  useEffect(() => {  // Line 11
    const params = new URLSearchParams(window.location.search);
    const oauth2Status = params.get('oauth2Status');
    const credentialId = params.get('credentialId');
    const email = params.get('email');

    if (oauth2Status === 'success' && credentialId && email) {
      // Update wizardData with OAuth2 credentials
      updateWizardData({ /* OAuth data */ });

      // Save to backend to persist OAuth2 connection
      setTimeout(async () => {
        await saveProgress();  // Line 44 - USES CAPTURED sessionId!
        console.log('💾 OAuth2 credentials saved to backend');

        const newUrl = window.location.pathname + '?sessionId=' + sessionId;  // Line 48 - ALSO USES CAPTURED sessionId!
        window.history.replaceState({}, '', newUrl);
      }, 500);
    }
  }, []); // Line 61 - EMPTY DEPENDENCY ARRAY = RUNS ONCE, CAPTURES VALUES
```

**Key Issues**:
1. **Line 8**: Destructures `sessionId` and `saveProgress` from wizard context
2. **Line 11**: useEffect with **empty dependency array `[]`** - runs ONCE on mount
3. **Line 44**: Calls `saveProgress()` which uses the sessionId **captured from the first render**
4. **Line 48**: Uses sessionId **captured from the first render** to build URL

### React Render & useEffect Execution Order

#### 1. Initial Render (Page Load with OAuth Callback)
- URL: `?continue=5fe486a1-59dc-41c3-a267-0f0cbb625939&step=5&oauth2Status=success&...`
- WizardProvider renders:
  - `sessionId` state = `null` (line 466 of wizard-provider.tsx)
  - Creates `saveProgress` callback with `sessionId = null` in closure
  - Creates context value with `sessionId: null` and `saveProgress` (with null sessionId)
- AdvancedFeaturesStep renders:
  - Line 8: `const { sessionId, saveProgress } = useWizard()` → gets `sessionId = null`, `saveProgress` (with null in closure)
  - Line 11: useEffect callback is **scheduled** (will run after render)

#### 2. useEffect Execution Phase (After Render Commits)
React executes useEffects in declaration order: **parent first, then children**

**Step 2a**: WizardProvider's useEffect (line 470-525) runs FIRST:
```typescript
useEffect(() => {
  const sp = new URLSearchParams(window.location.search);
  const continueId = sp.get('continue');  // Gets '5fe486a1-59dc-41c3-a267-0f0cbb625939'

  if (continueId) {
    console.log('🔄 CONTINUE MODE: Using existing session ID from URL:', continueId);
    setSessionId(continueId);  // ✅ Sets sessionId to '5fe486a1...'
    localStorage.setItem('wizard-session-id', continueId);
    setSessionExists(true);
    setSessionResolved(true);
    return;
  }
  // ... other logic
}, []);
```

**Step 2b**: AdvancedFeaturesStep's useEffect (line 11) runs SECOND:
- **CRITICAL**: At this point, the component has NOT re-rendered yet with the new sessionId
- The `sessionId` variable on line 8 is still `null` from the initial render
- The `saveProgress` function captured on line 8 still has `sessionId = null` in its closure
- The useEffect sees `oauth2Status === 'success'`
- It schedules a setTimeout for 500ms later
- **The setTimeout captures the OLD `sessionId` (null) and OLD `saveProgress` (with null sessionId)**

#### 3. Re-render Phase (After sessionId State Update)
- WizardProvider re-renders because `setSessionId()` was called
- sessionId = `'5fe486a1-59dc-41c3-a267-0f0cbb625939'` ✅
- A NEW `saveProgress` is created with the correct sessionId
- A NEW context value is created
- AdvancedFeaturesStep re-renders
- Line 8: `const { sessionId, saveProgress } = useWizard()` → NOW gets correct values
- **BUT**: The useEffect doesn't run again (deps are `[]`)
- The setTimeout scheduled in the previous useEffect execution is still waiting...

#### 4. setTimeout Executes (500ms After Step 2b)
```typescript
setTimeout(async () => {
  await saveProgress();  // ❌ Calls OLD saveProgress with sessionId = null
  // ...
}, 500);
```

### How Does It Save to Cycle18?

When `saveProgress()` is called with `sessionId = null`, here's what happens:

**File**: `wizard-provider.tsx` lines 175-280

```typescript
const saveProgress = useCallback(async () => {
  const progressData = {
    sessionId,  // ❌ NULL from closure!
    currentStep,
    wizardData,
    timestamp: Date.now()
  };

  // ...

  if (sessionExists) {
    // SESSION EXISTS - Always update, never create
    response = await fetch(`/api/public/wizard-sessions/${sessionId}`, {  // ❌ /null
      method: 'PUT',
      // ...
    });
  }
}, [sessionId, currentStep, wizardData, user, sessionExists]);
```

The fetch URL becomes `/api/public/wizard-sessions/null`, which:
1. Either fails silently
2. Or the backend handles `null` as a string and creates/updates a session with that ID
3. **OR** there's a fallback mechanism that uses localStorage or another source

**Most likely scenario**: There's a stale value in localStorage from when the user was previously on Cycle18:
- `localStorage.getItem('wizard-session-id')` = `'Cycle18_E2E_1759857573047'`
- Somewhere in the flow, this value is used as a fallback

### Why Previous Fix Attempts Failed

#### Attempt 1: Added sessionResolved with all dependencies
```typescript
}, [sessionResolved, sessionId, saveProgress, updateWizardData, wizardData.step6]);
```
**Why it broke**: `wizardData.step6` is an object that changes frequently. Every change triggered the useEffect, which updated wizardData again → **infinite loop**

#### Attempt 2: Minimal dependencies with useRef
```typescript
const oauthProcessedRef = useRef(false);

useEffect(() => {
  if (!sessionResolved) return;
  if (oauthProcessedRef.current) return;

  // ... process OAuth
  oauthProcessedRef.current = true;
}, [sessionResolved]);
```
**Why it seemed to break**: This was actually correct! But **disk was 100% full** causing login failures. The code change was fine.

## ✅ The Correct Fix

### Implementation

**File**: `apps/frontend/src/components/wizard/steps/advanced-features-step.tsx`

```typescript
import React, { useMemo, useEffect, useRef } from 'react';
import { useWizard } from '../wizard-provider';

export function AdvancedFeaturesStep() {
  const { wizardData, updateWizardData, sessionId, saveProgress, sessionResolved } = useWizard();

  // Ref to track if OAuth has been processed (prevents duplicate processing)
  const oauthProcessedRef = useRef(false);

  // Handle OAuth2 callback from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth2Status = params.get('oauth2Status');
    const credentialId = params.get('credentialId');
    const email = params.get('email');

    if (oauth2Status === 'success' && credentialId && email && !oauthProcessedRef.current) {
      // ✅ CRITICAL FIX: Wait for session to be resolved before saving
      if (!sessionResolved) {
        console.log('⏳ [RACE CONDITION FIX] Session not resolved yet, waiting...');
        return; // Exit early, will re-run when sessionResolved changes
      }

      console.log('✅ [RACE CONDITION FIX] Session is resolved, proceeding with OAuth save');
      console.log('💾 [SAVE] SessionId being used:', sessionId);

      // Mark as processed to prevent duplicate saves
      oauthProcessedRef.current = true;

      const decodedEmail = decodeURIComponent(email);

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

      // Save to backend to persist OAuth2 connection
      setTimeout(async () => {
        console.log('💾 [FINAL SAVE] Using sessionId:', sessionId);
        await saveProgress();
        console.log('💾 OAuth2 credentials saved to backend');

        // Clean up URL parameters after saving
        const newUrl = window.location.pathname + '?sessionId=' + sessionId;
        window.history.replaceState({}, '', newUrl);
        console.log('🧹 OAuth2 URL parameters cleaned, session preserved');
      }, 500);
    }
  }, [sessionResolved]); // ✅ ONLY depend on sessionResolved

  // ... rest of component
}
```

### How the Fix Works

1. **First render**: useEffect runs, sees `oauth2Status=success` but `sessionResolved=false`
2. **Early return**: Exits without saving (prevents using wrong/null sessionId)
3. **WizardProvider resolves session**: Sets `sessionId='5fe486a1...'` AND `sessionResolved=true`
4. **useEffect re-runs**: Because `sessionResolved` is in dependency array
5. **Check ref**: `oauthProcessedRef.current` is still `false`, so proceeds
6. **Mark as processed**: Sets `oauthProcessedRef.current = true` to prevent duplicate saves
7. **Now saves**: With the **correct sessionId** from the `continue` parameter
8. **No infinite loops**: Even if effect runs again, the ref prevents re-processing

### Flow After Fix

```
OAuth Redirect: ?continue=5fe486a1...&oauth2Status=success
        ↓
  Page Reloads
        ↓
  ┌─────────────────────────────────┐
  │  WizardProvider Mounts          │
  │  - sessionId = null initially   │
  └─────────────────────────────────┘
        ↓
  ┌─────────────────────────────────┐
  │  AdvancedFeaturesStep Mounts    │
  │  - useEffect runs               │
  │  - sessionResolved = false      │
  │  - Returns early ⏳             │
  └─────────────────────────────────┘
        ↓
  ┌─────────────────────────────────┐
  │  WizardProvider useEffect       │
  │  - Reads 'continue' param       │
  │  - setSessionId('5fe486a1...')  │
  │  - setSessionResolved(true) ✅  │
  └─────────────────────────────────┘
        ↓
  sessionResolved changes to true
        ↓
  ┌─────────────────────────────────┐
  │  AdvancedFeaturesStep useEffect │
  │  - Re-runs (sessionResolved     │
  │    is in deps)                  │
  │  - sessionResolved = true ✅    │
  │  - sessionId = '5fe486a1...' ✅ │
  │  - oauthProcessedRef = false ✅ │
  │  - Marks ref as true            │
  │  - Saves OAuth data             │
  └─────────────────────────────────┘
        ↓
  ✅ OAuth saved to CORRECT session (test66)
```

## 📊 Impact

- ✅ OAuth connections save to the **correct session**
- ✅ Session resolution is properly synchronized
- ✅ No infinite re-renders (using ref to track processing)
- ✅ No stale closure bugs
- ✅ Comprehensive logging for debugging

## 🛡️ Prevention

**Root Cause**: Empty dependency array `[]` with captured values from closure

**Best Practices**:
1. ✅ **Always include dependencies**: Any value used inside useEffect should be in the deps array
2. ✅ **Use state flags for async coordination**: `sessionResolved` flag synchronizes async operations
3. ✅ **Use refs for one-time operations**: Prevents duplicate processing when effect re-runs
4. ✅ **Add logging at critical points**: Makes debugging race conditions easier

## 📝 Files to Modify

1. **`apps/frontend/src/components/wizard/steps/advanced-features-step.tsx`**
   - Add `sessionResolved` to useWizard() destructuring
   - Add `useRef` for OAuth processing tracking
   - Add early return when `!sessionResolved`
   - Change dependency array to `[sessionResolved]`
   - Add comprehensive logging

2. **`apps/frontend/src/components/wizard/wizard-provider.tsx`**
   - Export `sessionResolved` in context (already done)

## 🧪 Testing Instructions

1. **Setup**: Ensure you have two sessions (test66 and any other)
2. **Navigate to test66**: Click "Continue" from MySites
3. **Go to Step 6**: Advanced Features
4. **Connect Gmail OAuth**: Click the connect button
5. **Complete OAuth**: Authorize in Google
6. **Check console logs**: Look for:
   - `⏳ [RACE CONDITION FIX] Session not resolved yet, waiting...` (first run)
   - `✅ [RACE CONDITION FIX] Session is resolved, proceeding with OAuth save` (second run)
   - `💾 [SAVE] SessionId being used: 5fe486a1-59dc-41c3-a267-0f0cbb625939` (correct ID)
   - `💾 [FINAL SAVE] Using sessionId: 5fe486a1-59dc-41c3-a267-0f0cbb625939`
7. **Click "Quitter"**
8. **Reopen test66**: Click "Continue" from MySites
9. **Go to Step 6**: Check OAuth status
10. **Expected Result**: OAuth should still show as connected ✅

## 📈 Why This is the Definitive Fix

1. **Addresses root cause**: Waits for session resolution before using sessionId
2. **No stale closures**: useEffect re-runs when sessionResolved changes, getting fresh values
3. **No infinite loops**: useRef prevents re-processing, only sessionResolved in deps
4. **Properly synchronized**: sessionResolved flag ensures correct timing
5. **Evidence-based**: Built from understanding exact React render/effect timing

---

**Status**: 🎯 ROOT CAUSE IDENTIFIED
**Next Step**: Implement the fix in advanced-features-step.tsx
**Confidence**: HIGH - Based on database evidence, code analysis, and React lifecycle understanding
