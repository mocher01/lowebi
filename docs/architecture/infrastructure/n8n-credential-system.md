# 🔐 N8N Credential System Documentation

## Overview
The N8N integration uses multiple types of credentials for different purposes. Here's a complete breakdown:

## 1. 🔑 API Authentication Credentials

### N8N API Key
- **Purpose**: Access N8N REST API for workflow management
- **Environment Variable**: `N8N_API_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Used For**:
  - Creating workflows
  - Managing credentials (initial creation)
  - Activating/deactivating workflows
  - Reading workflow configurations

### N8N Admin Session
- **Purpose**: Access N8N REST API for credential updates
- **Environment Variables**: 
  - `N8N_ADMIN_EMAIL`: `gestion@locod-ai.com`
  - `N8N_ADMIN_PASSWORD`: `YouCanMakeITOK2025`
- **Used For**:
  - Session-based authentication to `/rest/` endpoints
  - Updating credential values (solving the `__n8n_BLANK_VALUE_` issue)
  - PATCH operations on credentials

## 2. 📧 SMTP Credentials (Email Sending)

### Gmail SMTP Account
- **Purpose**: Send emails from contact forms
- **Environment Variables**:
  - `SMTP_USER`: `locodai.sas@gmail.com`
  - `SMTP_PASS`: Gmail App Password
- **N8N Credential Name**: `Locodai Gmail` or site-specific (e.g., `Qalyarab Gmail`)
- **Used For**:
  - Sending contact form submissions via email
  - FROM address in emails
  - SMTP authentication

## 3. 🛡️ Webhook Security Credentials

### Header Authentication Tokens
- **Purpose**: Secure webhook endpoints from unauthorized access
- **Master Token**: `8f69005d92acda2a48b4ce0b04f11ed7a3ec478bb92a87a412e00da34399b724`
- **N8N Credential Type**: `httpHeaderAuth`
- **Header Name**: `X-Webhook-Token`
- **Used For**:
  - Authenticating incoming webhook requests
  - Preventing spam/unauthorized form submissions
  - Each site gets its own credential instance

## 4. 🔄 Credential Creation Flow

### The Two-Step Process
Due to N8N API limitations, we use a two-step approach:

#### Step 1: Create Empty Credential (API Key)
```javascript
POST /api/v1/credentials
Headers: { 'X-N8N-API-KEY': API_KEY }
Body: {
  name: 'SITE_Webhook_Auth',
  type: 'httpHeaderAuth',
  nodesAccess: [{ nodeType: 'n8n-nodes-base.webhook' }],
  data: { name: 'X-Webhook-Token', value: '' } // Empty initially
}
```

#### Step 2: Update with Real Token (Session Auth)
```javascript
PATCH /rest/credentials/{id}
Headers: { 'Cookie': session_cookie }
Body: {
  name: credential_name,
  type: 'httpHeaderAuth',
  nodesAccess: [...],
  data: { name: 'X-Webhook-Token', value: 'real_token_here' }
}
```

## 5. 🏭 Per-Site Workflow Structure

### Each Site Gets:
1. **One Webhook Credential**: `{SITE}_Webhook_Auth`
   - Contains the webhook security token
   - Used by webhook node for authentication

2. **One SMTP Credential Reference**: 
   - Reuses existing Gmail credentials
   - Or creates site-specific if needed

3. **One Complete Workflow**: `{SITE}_FormulaireMail`
   - Webhook node (with Header Auth)
   - Email node (with SMTP credentials)

### Example for "translatepro":
```
🔧 TR_FormulaireMail Workflow
├── 🔗 Webhook Node
│   ├── URL: /webhook/translatepro-contact
│   ├── Auth: httpHeaderAuth
│   └── Credential: TRANSLATEPRO_Webhook_Auth
└── 📧 Email Node
    ├── SMTP: Locodai Gmail
    ├── TO: contact@translatepro.example.com
    └── FROM: locodai.sas@gmail.com
```

## 6. 🔐 Security Model

### Layered Security:
1. **API Access**: N8N API Key restricts who can manage workflows
2. **Admin Access**: Session authentication for sensitive operations
3. **Webhook Security**: Each webhook has unique token authentication
4. **Email Security**: SMTP credentials secured with app passwords

### Token Distribution:
- **Master Token**: Used for all sites currently (`8f69005d92acda2a48b4ce0b04f11ed7a3ec478bb92a87a412e00da34399b724`)
- **Per-Site Tokens**: Can be generated uniquely per site if needed
- **Frontend Integration**: Sites include token in webhook requests

## 7. 🚀 How It All Works Together

### Contact Form Submission Flow:
1. **User submits form** on website
2. **Frontend sends POST** to N8N webhook with `X-Webhook-Token` header
3. **N8N validates token** using stored Header Auth credential
4. **If valid**, workflow executes:
   - Processes form data
   - Sends email via SMTP credential
   - Returns success response
5. **If invalid**, returns 403 "Authorization data is wrong!"

### Credential Management Flow:
1. **Generator creates** empty credential via API key
2. **Generator logs in** to N8N admin account
3. **Generator updates** credential with real token via session
4. **Generator assigns** credential to webhook node
5. **Workflow activated** and ready to receive authenticated requests

## 8. 🛠️ Environment Variables Summary

```bash
# N8N Instance
N8N_INSTANCE_URL=https://automation.locod-ai.fr

# API Authentication
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Admin Authentication (for credential updates)
N8N_ADMIN_EMAIL=gestion@locod-ai.com
N8N_ADMIN_PASSWORD=YouCanMakeITOK2025

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=locodai.sas@gmail.com
SMTP_PASS=[Gmail App Password]

# Security
WEBHOOK_MASTER_TOKEN=8f69005d92acda2a48b4ce0b04f11ed7a3ec478bb92a87a412e00da34399b724
```

## 9. 🎯 Key Success Factors

### Session Authentication Solution
- **Problem**: N8N API masks credential values with `__n8n_BLANK_VALUE_`
- **Solution**: Use session authentication to update credentials after creation
- **Result**: Real token values properly stored and functional

### Credential Reuse Strategy
- **SMTP**: Reuse existing Gmail credentials across sites
- **Webhooks**: Create unique credentials per site for security
- **API**: Single API key for all management operations

### Error Handling
- **Graceful Fallback**: If session auth fails, credentials created but require manual setup
- **Clear Messaging**: System reports exactly what worked and what needs attention
- **Validation**: Multi-step verification ensures everything is properly configured

This architecture provides a secure, scalable, and maintainable N8N integration system!