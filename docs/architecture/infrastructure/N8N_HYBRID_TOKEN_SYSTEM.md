# 🔐 N8N Hybrid Token Security System
**Version: v1.1.1.9.2.3.3.1**

## 🎯 Concept

Un **token master unique** par site, stocké dans `.env` sur le serveur, génère automatiquement des tokens dérivés pour chaque workflow.

```
Master Token (dans .env)
    ├── Token Contact Form (dérivé)
    ├── Token Newsletter (dérivé)
    ├── Token Support (dérivé)
    └── Token Feedback (dérivé)
```

## 🔧 Configuration

### 1. **Génération Initiale**

Lors de la première création d'un workflow N8N :

```bash
node scripts/generators/n8n-workflow-generator.js monsite
```

Le système génère un **token master** :

```
🔐 Generated master site token (64 chars)
🔐 IMPORTANT: Add this to your server .env file:
N8N_SITE_TOKEN=a7b9c3d5e7f1a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2
```

### 2. **Ajout au Serveur**

Sur le serveur de production, ajoutez dans `.env` :

```bash
# Token master pour sécuriser tous les webhooks N8N
N8N_SITE_TOKEN=a7b9c3d5e7f1a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2
```

### 3. **Tokens Dérivés Automatiques**

Le système génère automatiquement des tokens uniques pour chaque workflow :

```javascript
// Token Contact Form = SHA256(master_token + "contactForm")
// Token Newsletter = SHA256(master_token + "newsletter")
// Token Support = SHA256(master_token + "support")
```

## 📋 Workflow Sécurisé

### 1. **Côté Générateur**
```javascript
// Génère ou récupère le token master
const masterToken = process.env.N8N_SITE_TOKEN || generateMasterToken();

// Dérive le token spécifique au workflow
const contactFormToken = deriveToken(masterToken, "contactForm");
```

### 2. **Côté Site Config**
```json
{
  "integrations": {
    "n8n": {
      "security": {
        "tokenSystem": "hybrid",
        "masterTokenRequired": false
      },
      "workflows": {
        "contactForm": {
          "auth": {
            "type": "header",
            "headerName": "X-Webhook-Token",
            "headerValue": "8f7a6b5c4d3e2f1a...",
            "derivedFrom": "master_token_contactForm"
          }
        }
      }
    }
  }
}
```

### 3. **Côté Frontend**
```javascript
// Utilise le token dérivé stocké dans la config
const token = siteConfig.n8n.workflows.contactForm.auth.headerValue;

fetch(webhookUrl, {
  headers: {
    'X-Webhook-Token': token
  }
});
```

## 🚀 Ajout de Nouveaux Flows

Pour ajouter un nouveau workflow (ex: newsletter) :

### 1. **Même Token Master**
Le token master dans `.env` reste inchangé.

### 2. **Token Dérivé Automatique**
```javascript
const newsletterToken = deriveToken(masterToken, "newsletter");
```

### 3. **Configuration Ajoutée**
```json
{
  "workflows": {
    "contactForm": { /* existant */ },
    "newsletter": {
      "auth": {
        "headerValue": "9a8b7c6d5e4f3a2b...",
        "derivedFrom": "master_token_newsletter"
      }
    }
  }
}
```

## 🔒 Avantages de l'Approche Hybride

### ✅ **Simplicité**
- Un seul token à gérer dans `.env`
- Pas besoin de regénérer pour chaque workflow

### ✅ **Sécurité**
- Tokens différents par workflow
- Révocation possible par workflow
- Token master jamais exposé au frontend

### ✅ **Scalabilité**
- Ajout facile de nouveaux workflows
- Pas de limite sur le nombre de flows

### ✅ **Traçabilité**
- On sait quel token appartient à quel workflow
- Logs spécifiques possibles

## 🔄 Rotation des Tokens

### Rotation Complète (tous les workflows)
```bash
# 1. Générer nouveau token master
N8N_SITE_TOKEN=nouveau_token_master_genere

# 2. Regénérer tous les workflows
node scripts/regenerate-n8n-workflows.js
```

### Rotation Spécifique (un workflow)
```bash
# Utilise un salt différent pour ce workflow
const newToken = deriveToken(masterToken, "contactForm_v2");
```

## 🛠️ Commandes Utiles

### Vérifier le Token Master
```bash
# Sur le serveur
echo $N8N_SITE_TOKEN
```

### Tester un Webhook
```bash
# Avec le bon token
curl -X POST https://n8n.example.com/webhook/contact \
  -H "X-Webhook-Token: 8f7a6b5c4d3e2f1a..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'
```

### Débugger les Tokens
```javascript
// Afficher les tokens dérivés (dev only!)
console.log('Contact:', deriveToken(master, 'contactForm'));
console.log('Newsletter:', deriveToken(master, 'newsletter'));
```

## ⚠️ Important

1. **Ne jamais commiter** le token master dans Git
2. **Ne jamais exposer** le token master au frontend
3. **Toujours utiliser HTTPS** pour les webhooks
4. **Documenter** quel workflow utilise quel type de token

---

*Ce système garantit sécurité et simplicité pour tous les workflows N8N actuels et futurs.*