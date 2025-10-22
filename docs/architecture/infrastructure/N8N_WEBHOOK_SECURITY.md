# 🔐 N8N Webhook Security Guide
**Version: v1.1.1.9.2.3.3.1**

## 🎯 Overview

La sécurité des webhooks N8N est critique pour protéger contre:
- Les soumissions de spam
- Les attaques par déni de service (DoS)
- L'injection de données malveillantes
- L'accès non autorisé aux workflows

## 🛡️ Sécurité Implémentée

### 1. **Token d'Authentification**
Chaque webhook génère un token unique de 256 bits:
```javascript
// Format: {64_chars_hex}_{timestamp_base36}
// Exemple: a7b9c3d5e7f1...8e2d_lkj8n9m2
```

### 2. **Header Authentication**
```json
{
  "auth": {
    "type": "header",
    "headerName": "X-Webhook-Token",
    "headerValue": "a7b9c3d5e7f1...8e2d_lkj8n9m2"
  }
}
```

### 3. **Configuration Webhook Sécurisée**
```javascript
{
  "httpMethod": "POST",
  "authentication": "headerAuth",
  "options": {
    "responseMode": "onReceived",
    "rawBody": false,
    "ignoreBots": true
  }
}
```

## 🔧 Utilisation Côté Client

### Frontend Implementation
```javascript
// src/services/n8nService.js
async submitToWebhook(data) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Ajouter le token de sécurité
  if (this.webhookConfig.auth) {
    headers[this.webhookConfig.auth.headerName] = 
      this.webhookConfig.auth.headerValue;
  }
  
  const response = await fetch(this.webhookConfig.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Webhook submission failed');
  }
}
```

### Protection CORS
```javascript
// Configuration recommandée
{
  "cors": {
    "origins": ["https://monsite.com"],
    "methods": ["POST"],
    "credentials": false
  }
}
```

## 🚨 Validation des Données

### Champs Requis
```javascript
const requiredFields = ['name', 'email', 'message'];
const missingFields = requiredFields.filter(field => !data[field]);

if (missingFields.length > 0) {
  throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
}
```

### Sanitization
```javascript
// Nettoyer les données avant envoi
function sanitizeInput(data) {
  return {
    name: data.name.trim().substring(0, 100),
    email: data.email.trim().toLowerCase(),
    message: data.message.trim().substring(0, 5000),
    // Éviter l'injection HTML/JS
    sanitized: true
  };
}
```

## 📊 Rate Limiting

### Configuration Recommandée
```javascript
{
  "rateLimit": {
    "enabled": true,
    "maxRequests": 100,
    "timeWindow": 60000, // 1 minute
    "blockDuration": 300000 // 5 minutes
  }
}
```

### Implementation Frontend
```javascript
class RateLimiter {
  constructor(maxRequests = 5, timeWindow = 60000) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }
  
  canMakeRequest() {
    const now = Date.now();
    // Nettoyer les anciennes requêtes
    this.requests = this.requests.filter(
      time => now - time < this.timeWindow
    );
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}
```

## 🔍 Monitoring & Logs

### Logs de Sécurité
```javascript
// Enregistrer les tentatives suspectes
function logSecurityEvent(event) {
  console.warn('🚨 Security Event:', {
    type: event.type,
    ip: event.ip,
    timestamp: new Date().toISOString(),
    details: event.details
  });
}
```

### Alertes
- Token invalide → Log + Block
- Rate limit dépassé → Temporary ban
- Payload trop large → Reject
- Content-Type invalide → Reject

## 🛠️ Meilleures Pratiques

### 1. **Rotation des Tokens**
```bash
# Regénérer les tokens périodiquement
node scripts/rotate-webhook-tokens.js
```

### 2. **Environnement de Production**
```javascript
// Production: Tokens depuis variables d'environnement
const WEBHOOK_TOKEN = process.env.N8N_WEBHOOK_TOKEN;

// Jamais de tokens dans le code source!
```

### 3. **HTTPS Obligatoire**
```nginx
# Force HTTPS pour webhooks
if ($scheme != "https") {
  return 301 https://$server_name$request_uri;
}
```

### 4. **Validation Stricte**
```javascript
// Utiliser un schema JSON pour validation
const Ajv = require('ajv');
const ajv = new Ajv();

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', format: 'email' },
    message: { type: 'string', minLength: 1, maxLength: 5000 }
  },
  required: ['name', 'email', 'message'],
  additionalProperties: false
};

const validate = ajv.compile(schema);
```

## 🚀 Test de Sécurité

### Test avec Token Valide
```bash
curl -X POST https://automation.locod-ai.fr/webhook/your-path \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: your-valid-token" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
```

### Test sans Token (doit échouer)
```bash
curl -X POST https://automation.locod-ai.fr/webhook/your-path \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
# Expected: 401 Unauthorized
```

## 📋 Checklist de Sécurité

- [ ] Token généré avec 256+ bits d'entropie
- [ ] Header d'authentification configuré
- [ ] HTTPS activé sur le domaine
- [ ] CORS configuré correctement
- [ ] Rate limiting implémenté
- [ ] Validation des données activée
- [ ] Logs de sécurité en place
- [ ] Tests de pénétration effectués
- [ ] Documentation sécurité à jour
- [ ] Rotation des tokens planifiée

---

*La sécurité est un processus continu. Restez vigilant et mettez à jour régulièrement.*