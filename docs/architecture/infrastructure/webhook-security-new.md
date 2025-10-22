# 🛡️ New Webhook Security Model

## 🚨 Problem Solved

The previous N8N credential-based authentication system had a critical bug where programmatically created credentials would contain `__n8n_BLANK_VALUE_` placeholders instead of real tokens, causing all webhook requests to return **403 "Authorization data is wrong!"** errors.

After extensive testing and research, we discovered this is a known limitation in N8N for multi-user programmatic credential management.

## ✅ New Solution: IP Whitelist + Simple Secret

### Security Model
1. **IP Whitelist**: Only the server IP (162.55.213.90) can access webhooks
2. **Simple Secret**: Request body must contain `_token` field with correct value
3. **No N8N Credentials**: Bypasses the problematic credential system entirely

### How It Works

#### Backend (N8N Workflow)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Webhook Node   │───▶│ Validation Node │───▶│   Email Node    │
│  (No Auth)       │    │ Check _token    │    │  Send Email     │
│ IP: Server Only  │    │ from body       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Frontend (Website)
```javascript
// Contact form submission
const formData = {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello!',
  _token: 'derived_secret_token_here'  // ← Security token
};

fetch('https://automation.locod-ai.fr/webhook/sitename-contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(formData)
});
```

### Security Benefits

✅ **Server-Only Access**: Only server IP can reach webhooks
✅ **Simple Validation**: Token checked in workflow logic, not N8N credentials
✅ **No Credential Bugs**: Bypasses N8N's problematic credential system
✅ **Traceable**: Clear workflow logic for debugging
✅ **Scalable**: Works for any number of sites

### Configuration

#### Environment Variables
```bash
# Server IP for webhook access
SERVER_IP=162.55.213.90

# Master token for deriving site-specific secrets
N8N_SITE_TOKEN=generated_master_token_here
```

#### Site Config
```json
{
  "integrations": {
    "n8n": {
      "workflows": {
        "contactForm": {
          "webhookUrl": "https://automation.locod-ai.fr/webhook/sitename-contact",
          "auth": {
            "type": "ip_whitelist_plus_secret",
            "description": "Server IP whitelist + secret validation in request body",
            "secretField": "_token",
            "secretValue": "derived_token_from_master",
            "allowedIPs": ["162.55.213.90"]
          }
        }
      }
    }
  }
}
```

### Implementation Details

#### N8N Workflow Structure
1. **Webhook Node**: No authentication, accepts POST requests
2. **Validation Node**: IF node checking `{{ $json._token }}` equals expected value
3. **Email Node**: Only executes if token validation passes

#### Token Generation
- **Master Token**: Stored in `N8N_SITE_TOKEN` environment variable
- **Site Token**: `SHA256(master_token + "_contactForm")`  
- **Frontend**: Includes token in `_token` field of request body

#### IP Configuration
N8N instance should be configured to only accept webhook requests from:
- Server IP: `162.55.213.90`
- Localhost: `127.0.0.1` (for testing)

### Migration from Old System

#### What Changed
- ❌ **Removed**: N8N httpHeaderAuth credentials
- ❌ **Removed**: X-Webhook-Token headers
- ✅ **Added**: Token validation node in workflow
- ✅ **Added**: `_token` field in request body
- ✅ **Added**: IP whitelist configuration

#### Frontend Update Required
```diff
// OLD: Header-based authentication
- headers: {
-   'X-Webhook-Token': 'token_here'
- }

// NEW: Body-based token + IP whitelist
+ body: JSON.stringify({
+   ...formData,
+   _token: 'derived_token_here'
+ })
```

This new approach is more secure, reliable, and bypasses N8N's credential management issues entirely!