# 🏗️ N8N Architecture Flow Diagram

## 📊 Complete System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    🌐 WEBSITE FRONTEND                          │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   translatepro  │    │    qalyarab     │    [More Sites...] │
│  │   Contact Form  │    │  Contact Form   │                    │
│  └─────────┬───────┘    └─────────┬───────┘                    │
└───────────┼────────────────────────┼────────────────────────────┘
            │                        │
            │ POST /webhook/         │ POST /webhook/
            │ translatepro-contact   │ qalyarab-contact
            │ X-Webhook-Token: xxx   │ X-Webhook-Token: xxx
            │                        │
┌───────────▼────────────────────────▼────────────────────────────┐
│                   🤖 N8N AUTOMATION SERVER                      │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ TR_FormulaireMail│    │ QA_FormulaireMail│                  │
│  │                 │    │                 │                    │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │                    │
│  │ │🔗 Webhook   │ │    │ │🔗 Webhook   │ │                    │
│  │ │ Node        │ │    │ │ Node        │ │                    │
│  │ │             │ │    │ │             │ │                    │
│  │ │ Auth: 🔐    │◄┼────┼─┤ Auth: 🔐    │ │                    │
│  │ │ HeaderAuth  │ │    │ │ HeaderAuth  │ │                    │
│  │ └─────┬───────┘ │    │ └─────┬───────┘ │                    │
│  │       │         │    │       │         │                    │
│  │ ┌─────▼───────┐ │    │ ┌─────▼───────┐ │                    │
│  │ │📧 Email     │ │    │ │📧 Email     │ │                    │
│  │ │ Send Node   │ │    │ │ Send Node   │ │                    │
│  │ │             │ │    │ │             │ │                    │
│  │ │ SMTP: 📬    │◄┼────┼─┤ SMTP: 📬    │ │                    │
│  │ │ Gmail       │ │    │ │ Gmail       │ │                    │
│  │ └─────────────┘ │    │ └─────────────┘ │                    │
│  └─────────────────┘    └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
            │                        │
            └─────────┬──────────────┘
                      │
        ┌─────────────▼─────────────┐
        │     📧 EMAIL DELIVERY     │
        │  locodai.sas@gmail.com    │
        │          ▼                │
        │  contact@translatepro..   │
        │  contact@qalyarab..       │
        └───────────────────────────┘
```

## 🔐 Credential Management Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                🔧 WORKFLOW GENERATOR                            │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │  🔑 API Auth    │    │  🍪 Session Auth │                   │
│  │                 │    │                 │                    │
│  │ N8N_API_KEY     │    │ Admin Login:    │                    │
│  │ Used for:       │    │ gestion@locod-  │                    │
│  │ • Create workflows│   │ ai.com         │                    │
│  │ • Create empty   │    │ YouCanMakeITOK  │                   │
│  │   credentials   │    │ 2025            │                    │
│  │ • Activate flows │    │                 │                    │
│  └─────────────────┘    │ Used for:       │                    │
│                         │ • Update creds  │                    │
│                         │ • Store real    │                    │
│                         │   token values  │                    │
│                         └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
            │                        │
            │ Step 1: CREATE         │ Step 2: UPDATE
            │ (API Key)              │ (Session Cookie)
            ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   🗄️  N8N CREDENTIAL STORE                     │
│                                                                 │
│  📧 SMTP Credentials:          🛡️  Webhook Credentials:        │
│  ┌─────────────────┐           ┌─────────────────┐              │
│  │ Locodai Gmail   │           │TRANSLATEPRO_    │              │
│  │ ID: bUu8Wj3f... │           │Webhook_Auth     │              │
│  │ Type: smtp      │           │ID: ZsTliE3O...  │              │
│  │                 │           │Type: httpHeader │              │
│  │ Host: smtp.gmail│           │Header: X-Webhook│              │
│  │ User: locodai...│           │Token: 8f69005d..│              │
│  │ Pass: [App Pass]│           └─────────────────┘              │
│  └─────────────────┘                     │                     │
│           │                   ┌─────────────────┐              │
│  ┌─────────────────┐           │QALYARAB_        │              │
│  │ Qalyarab Gmail  │           │Webhook_Auth     │              │
│  │ ID: Cin4uqrF... │           │ID: LcNtrrOD...  │              │
│  │ (Reused/Shared) │           │Token: 8f69005d..│              │
│  └─────────────────┘           └─────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Credential Creation Process Flow

```
START: Generate Workflow for Site "example"
│
├─ 1️⃣ CREATE WEBHOOK CREDENTIAL
│  │
│  ├─ Step 1A: Create Empty Credential
│  │  ├─ Method: POST /api/v1/credentials
│  │  ├─ Auth: X-N8N-API-KEY
│  │  ├─ Data: { name: "EXAMPLE_Webhook_Auth", 
│  │  │         type: "httpHeaderAuth",
│  │  │         data: { value: "" } }  // ❌ Empty!
│  │  └─ Result: Credential Created ✅ (but blank)
│  │
│  ├─ Step 1B: Get Session Cookie
│  │  ├─ Method: POST /rest/login
│  │  ├─ Body: { emailOrLdapLoginId: "gestion@locod-ai.com",
│  │  │          password: "YouCanMakeITOK2025" }
│  │  └─ Result: Session Cookie ✅
│  │
│  └─ Step 1C: Update with Real Token
│     ├─ Method: PATCH /rest/credentials/{id}
│     ├─ Auth: Cookie: session_cookie
│     ├─ Data: { data: { value: "8f69005d92..." } }
│     └─ Result: Real Token Stored ✅
│
├─ 2️⃣ FIND/CREATE SMTP CREDENTIAL
│  │
│  ├─ Check existing workflows for Gmail credential
│  ├─ If found: Reuse existing credential ID
│  └─ If not found: Create new SMTP credential
│
├─ 3️⃣ CREATE WORKFLOW
│  │
│  ├─ Clone template workflow
│  ├─ Update webhook node:
│  │  ├─ Path: /example-contact
│  │  ├─ Authentication: headerAuth
│  │  └─ Credential: EXAMPLE_Webhook_Auth ✅
│  ├─ Update email node:
│  │  ├─ SMTP Credential: Locodai Gmail ✅
│  │  ├─ TO: recipient@example.com
│  │  └─ FROM: locodai.sas@gmail.com
│  │
│  └─ Save workflow as "EX_FormulaireMail"
│
└─ 4️⃣ ACTIVATE WORKFLOW
   │
   ├─ Method: POST /api/v1/workflows/{id}/activate
   ├─ Auth: X-N8N-API-KEY
   └─ Result: Webhook Ready ✅

END: Webhook https://automation.locod-ai.fr/webhook/example-contact
     Authentication: X-Webhook-Token: 8f69005d92acda2a...
```

## 🔄 Runtime Request Flow

```
Frontend Form Submission
│
├─ User fills contact form
├─ JavaScript captures submit event
├─ Builds JSON payload: { name, email, message }
├─ Adds authentication header: X-Webhook-Token
│
└─ POST Request to N8N
   │
   ├─ URL: https://automation.locod-ai.fr/webhook/site-contact
   ├─ Headers: 
   │  ├─ Content-Type: application/json
   │  └─ X-Webhook-Token: 8f69005d92acda2a...
   │
   └─ N8N Processing:
      │
      ├─ 🔐 AUTHENTICATION CHECK
      │  ├─ Extract X-Webhook-Token header
      │  ├─ Compare with stored credential value
      │  ├─ ✅ Match: Continue workflow
      │  └─ ❌ No match: Return 403 "Authorization data is wrong!"
      │
      ├─ 📝 DATA PROCESSING
      │  ├─ Parse JSON body
      │  ├─ Extract form fields
      │  └─ Prepare email content
      │
      ├─ 📧 EMAIL SENDING
      │  ├─ Use SMTP credential (Locodai Gmail)
      │  ├─ FROM: locodai.sas@gmail.com
      │  ├─ TO: site recipient email
      │  ├─ SUBJECT: [site] Contact from {name}
      │  └─ BODY: Formatted form data
      │
      └─ 📋 RESPONSE
         ├─ ✅ Success: Return 200 OK
         └─ ❌ Error: Return error details
```

This architecture ensures secure, scalable, and maintainable contact form processing across all generated websites!