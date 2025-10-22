# OAuth Timestamp Update Bug - Root Cause Analysis

## 🐛 Issue Summary

When connecting Gmail OAuth on `test66`, the timestamp for **both** `test66` AND `Cycle18_E2E_1759857573047` gets updated, even though Cycle18 was not accessed.

## 🔍 Investigation Results

### Database State

Query executed:
```sql
SELECT id, session_id, site_name, last_accessed_at, updated_at
FROM wizard_sessions
WHERE site_name IN ('test66', 'Cycle18_E2E_1759857573047')
ORDER BY last_accessed_at DESC;
```

Results:
| id | session_id | site_name | last_accessed_at | updated_at |
|----|------------|-----------|-----------------|------------|
| ed05513d... | 5fe486a1... | test66 | 2025-10-10 20:24:57.698 | 2025-10-10 20:24:57.699 |
| 81330019... | **NULL** | Cycle18_E2E_1759857573047 | 2025-10-10 20:24:42.713 | 2025-10-10 20:24:42.714 |

### OAuth Credentials

```sql
SELECT c.id, c.email, c.wizard_session_id, ws.session_id as session_string, ws.site_name
FROM oauth2_credentials c
LEFT JOIN wizard_sessions ws ON c.wizard_session_id = ws.id
WHERE c.is_active = true
ORDER BY c.created_at DESC
LIMIT 5;
```

Results:
- **ALL** OAuth credentials point to `wizard_session_id = ed05513d-a3f5-46d3-8ec5-ea55be114da8` (test66's UUID)
- All credentials are for email: `locodai.sas@gmail.com`
- All map to `session_string = 5fe486a1...` and `site_name = test66`

### Key Findings

1. **Cycle18 has NULL session_id**: The `Cycle18_E2E_1759857573047` session has `session_id = NULL` in the database
2. **Both sessions share the same user**: `user_id = 9f51ebc9-157f-4d0d-8b60-c9dff1f21252`
3. **Both timestamps updated sequentially**:
   - Cycle18: 20:24:42 (first)
   - test66: 20:24:57 (15 seconds later)
4. **Both `last_accessed_at` AND `updated_at` changed**: This indicates `updateSession()` was called, not just `getSession()`

## 🎯 Root Cause

**The NULL session_id in Cycle18 is causing issues:**

When Cycle18 was created (via automated test on Oct 7), it was created with a NULL `session_id`. This violates the expected data model where:
- `id` = UUID (primary key)
- `session_id` = String identifier used in URLs and API calls
- `site_name` = Human-readable name

The NULL `session_id` causes unpredictable behavior in queries and updates.

**Secondary Issue:**

Both sessions belong to the same user and OAuth credentials point only to test66. When the frontend performs operations related to OAuth, it may be inadvertently triggering updates to multiple sessions belonging to the same user.

## ✅ Implemented Fix

### 1. Added Diagnostic Logging

Added comprehensive logging to track:
- OAuth callback flow (`oauth2.controller.ts`)
- Session access (`getSession()`)
- Session updates (`updateSession()`)
- User session listing (`getUserSessions()`)

This will help identify exactly which API calls are being made and in what sequence.

### 2. Documented getUserSessions Behavior

Updated `getUserSessions()` to clearly state it does NOT update timestamps - only `getSession()` should update `last_accessed_at`.

## 🔧 Recommended Next Steps

### Immediate Fix

**Fix the NULL session_id in Cycle18:**

```sql
UPDATE wizard_sessions
SET session_id = 'Cycle18_E2E_1759857573047'
WHERE site_name = 'Cycle18_E2E_1759857573047'
  AND session_id IS NULL;
```

### Prevent Future Occurrences

1. **Add database constraint**: Make `session_id` NOT NULL
2. **Add migration**: Set `session_id = site_name` for any existing NULL values
3. **Fix session creation logic**: Ensure `session_id` is always set when creating sessions

### Verify the Fix

After fixing Cycle18's NULL session_id:

1. Connect OAuth on test66
2. Check timestamps:
```sql
SELECT session_id, site_name, last_accessed_at, updated_at
FROM wizard_sessions
WHERE session_id IN ('test66', 'Cycle18_E2E_1759857573047');
```
3. **Expected**: Only test66's timestamp should change
4. **If both still change**: Check backend logs to see which API endpoints are being called

## 📊 Logs to Monitor

With the new logging in place, look for these patterns:

```
🔐 [OAuth Callback] Step 1: wizardSessionId from state: test66
🔐 [OAuth Callback] Step 2: Found wizard session: { sessionId: '5fe486a1...', siteName: 'test66', ... }
🔍 [getSession] CALLED: sessionId="test66", userId="..."
📝 [updateSession] CALLED: sessionId="test66", userId="..."
📝 [updateSession] OAuth data being saved: {...}
```

If you see Cycle18 appearing in these logs when only test66 should be accessed, that indicates where the bug is occurring.

## 🎫 Related Issues

- #140: OAuth persistence issues (partially related)
- Session timestamp management needs review

## 📝 Notes

- Both sessions use the same Google account (`locodai.sas@gmail.com`)
- OAuth credentials are correctly stored pointing to test66's UUID
- The issue is NOT with OAuth credential storage, but with how sessions are being accessed/updated
