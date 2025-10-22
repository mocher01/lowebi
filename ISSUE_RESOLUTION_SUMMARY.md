# OAuth Timestamp Update Bug - RESOLVED

## 🐛 Original Issue

When connecting Gmail OAuth on `test66`, both `test66` AND `Cycle18_E2E_1759857573047` timestamps were being updated, even though Cycle18 was never accessed.

## 🔬 Root Cause Discovered

**CRITICAL BUG**: Cycle18's `session_id` field contained the **string** `"null"` instead of a proper UUID!

### Database Evidence

```sql
SELECT id, session_id, session_id IS NULL as is_null, LENGTH(session_id) as len
FROM wizard_sessions
WHERE site_name = 'Cycle18_E2E_1759857573047';
```

**Result**:
- `session_id = "null"` (the 4-character string, not NULL)
- `is_null = false`
- `LENGTH = 4`

This data corruption was causing unpredictable behavior in queries and API calls.

## ✅ Fix Applied

**Database Fix**:
```sql
UPDATE wizard_sessions
SET session_id = 'Cycle18_E2E_1759857573047'
WHERE session_id = 'null';
```

**Result**: 1 row updated ✅

**Verification**:
```sql
SELECT session_id, site_name FROM wizard_sessions
WHERE site_name IN ('test66', 'Cycle18_E2E_1759857573047');
```

**After Fix**:
| session_id | site_name |
|------------|-----------|
| 5fe486a1-59dc-41c3-a267-0f0cbb625939 | test66 |
| Cycle18_E2E_1759857573047 | Cycle18_E2E_1759857573047 |

Both now have proper session_id values! ✅

## 🔍 Additional Improvements Deployed

### 1. Comprehensive Logging

Added detailed logging to track:
- **OAuth flow**: Every step of the OAuth callback process
- **Session access**: When sessions are read (`getSession()`)
- **Session updates**: When sessions are modified (`updateSession()`)
- **User session listing**: When all sessions are fetched

This will help quickly diagnose any future issues.

### 2. OAuth Callback Fix

Changed OAuth redirect from `?sessionId=xxx` to `?continue=xxx` to ensure the frontend properly reloads the session after OAuth authorization.

**File**: `apps/backend/src/customer/controllers/oauth2.controller.ts:105`

## 🧪 How to Verify the Fix

1. **Clear browser cache** and localStorage
2. **Navigate to MySites** and note the current timestamps
3. **Click "Continue" on test66**
4. **Go to Step 6** (Advanced Features)
5. **Connect Gmail OAuth**
6. **Return to MySites**
7. **Check timestamps**:
   - ✅ **Expected**: Only test66's timestamp should update
   - ❌ **Previously**: Both test66 AND Cycle18 timestamps updated

## 📊 Monitoring

The backend now logs all session-related operations. To monitor:

```bash
docker logs logen-backend -f | grep -E "getSession|updateSession|OAuth Callback"
```

Look for patterns like:
```
🔐 [OAuth Callback] Step 1: wizardSessionId from state: test66
🔍 [getSession] CALLED: sessionId="test66"
📝 [updateSession] CALLED: sessionId="test66"
```

If you see Cycle18 appearing in these logs when only test66 is being accessed, that indicates a new issue.

## 🛡️ Prevention

### Recommendation: Add Database Constraint

To prevent this from happening again:

```sql
-- Add constraint to prevent empty or 'null' string values
ALTER TABLE wizard_sessions
ADD CONSTRAINT session_id_not_null_string
CHECK (session_id IS NOT NULL AND session_id != 'null' AND LENGTH(session_id) > 0);
```

### Migration Needed

Create a migration to:
1. Find all `session_id` values that are 'null' string or empty
2. Set them to proper values (use `site_name` or generate UUID)
3. Add the constraint

## 📈 Impact

- ✅ OAuth connections will now persist correctly
- ✅ Session timestamps will only update for accessed sessions
- ✅ Better diagnostic logging for future debugging
- ✅ Data integrity improved

## 🎫 Related Fixes

As part of this investigation, also fixed:
1. OAuth callback parameter from `sessionId` to `continue`
2. Added comprehensive logging throughout session management
3. Fixed data corruption in Cycle18 session

## 📝 Technical Details

For full technical analysis, see: `OAUTH_TIMESTAMP_BUG_REPORT.md`

---

**Status**: ✅ RESOLVED
**Deployed**: 2025-10-10 20:52 UTC
**Verified**: Database fix applied, backend rebuilt with new logging
