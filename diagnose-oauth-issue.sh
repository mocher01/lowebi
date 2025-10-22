#!/bin/bash

echo "🔍 OAuth Issue Diagnostic Tool"
echo "================================"
echo ""

# Function to run postgres queries inside the container
run_query() {
    docker exec logen-postgres psql -U locod_user -d locod_db -t -A -c "$1" 2>/dev/null
}

echo "1️⃣  Checking wizard sessions (test66 and Cycle18)..."
echo "---------------------------------------------------"

QUERY1="
SELECT
    session_id,
    site_name,
    id as uuid,
    user_id,
    last_accessed_at,
    wizard_data->'step6'->'emailConfig'->'oauth' as oauth_data
FROM wizard_sessions
WHERE session_id IN ('test66', 'Cycle18_E2E_1759857573047')
ORDER BY session_id;
"

run_query "$QUERY1"

echo ""
echo "2️⃣  Checking OAuth2 credentials for these sessions..."
echo "------------------------------------------------------"

QUERY2="
SELECT
    id as credential_id,
    email,
    provider,
    wizard_session_id,
    is_active,
    created_at
FROM oauth2_credentials
WHERE wizard_session_id IN (
    SELECT id FROM wizard_sessions
    WHERE session_id IN ('test66', 'Cycle18_E2E_1759857573047')
)
ORDER BY created_at DESC;
"

run_query "$QUERY2"

echo ""
echo "3️⃣  Checking all OAuth credentials for the user..."
echo "---------------------------------------------------"

QUERY3="
SELECT
    c.id as credential_id,
    c.email,
    c.wizard_session_id,
    ws.session_id as session_string_id,
    ws.site_name,
    c.is_active,
    c.created_at
FROM oauth2_credentials c
LEFT JOIN wizard_sessions ws ON c.wizard_session_id = ws.id
WHERE c.user_id = (
    SELECT user_id FROM wizard_sessions WHERE session_id = 'test66' LIMIT 1
)
ORDER BY c.created_at DESC;
"

run_query "$QUERY3"

echo ""
echo "4️⃣  Analysis Summary..."
echo "------------------------"

# Check if both sessions share the same wizard_session_id in oauth credentials
SHARED_UUID=$(run_query "
SELECT wizard_session_id FROM oauth2_credentials
WHERE wizard_session_id IN (
    SELECT id FROM wizard_sessions WHERE session_id IN ('test66', 'Cycle18_E2E_1759857573047')
)
GROUP BY wizard_session_id
HAVING COUNT(*) > 1;
")

if [ ! -z "$SHARED_UUID" ]; then
    echo "❌ ISSUE FOUND: Multiple OAuth credentials point to the same wizard session UUID!"
    echo "   Shared UUID: $SHARED_UUID"
else
    echo "✅ No shared OAuth credentials found"
fi

# Check if sessions have NULL session_id
NULL_CHECK=$(run_query "
SELECT session_id, site_name FROM wizard_sessions
WHERE session_id IS NULL AND site_name IN ('test66', 'Cycle18_E2E_1759857573047');
")

if [ ! -z "$NULL_CHECK" ]; then
    echo "❌ ISSUE FOUND: Some sessions have NULL session_id!"
    echo "$NULL_CHECK"
fi

echo ""
echo "5️⃣  Checking for duplicate wizardSessionId issues..."
echo "-----------------------------------------------------"

# Find if multiple sessions point to the same OAuth credential
DUPLICATE_OAUTH=$(run_query "
SELECT
    ws.session_id,
    ws.site_name,
    ws.wizard_data->'step6'->'emailConfig'->'oauth'->>'oauthCredentialId' as credential_id_in_data
FROM wizard_sessions ws
WHERE ws.session_id IN ('test66', 'Cycle18_E2E_1759857573047')
  AND ws.wizard_data->'step6'->'emailConfig'->'oauth' IS NOT NULL;
")

echo "$DUPLICATE_OAUTH"

echo ""
echo "================================"
echo "💡 Diagnostic complete!"
echo ""
echo "If you see the same wizard_session_id (UUID) for both test66 and Cycle18"
echo "in the OAuth credentials table, that's the bug - OAuth callback is saving"
echo "to the wrong session's UUID."
