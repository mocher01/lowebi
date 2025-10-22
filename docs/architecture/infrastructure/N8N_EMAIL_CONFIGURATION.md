# 📧 N8N Email Configuration Guide
**Version: v1.1.1.9.2.3.3.1**

## 🎯 Overview

Le système N8N Email Flow Full Automation supporte maintenant:
1. **Par défaut**: Utilisation automatique du credential `locodai.sas@gmail.com` existant
2. **Personnalisé**: Création automatique de credentials pour les emails clients

## 🔧 Configuration des Emails

### Option 1: Email par défaut (Recommandé)
```json
{
  "integrations": {
    "n8n": {
      "flows": {
        "contactForm": {
          "config": {
            "recipientEmail": "contact@monsite.fr",
            "senderEmail": "locodai.sas@gmail.com",
            "replyToEmail": "contact@monsite.fr"
          }
        }
      }
    }
  }
}
```

### Option 2: Email personnalisé avec création automatique
```json
{
  "integrations": {
    "n8n": {
      "flows": {
        "contactForm": {
          "config": {
            "recipientEmail": "contact@monsite.fr",
            "senderEmail": "support@monsite.fr",
            "senderAppPassword": "xxxx-xxxx-xxxx-xxxx",
            "replyToEmail": "contact@monsite.fr",
            "credentialName": "MonSite Support Email"
          }
        }
      }
    }
  }
}
```

## 📋 Paramètres de Configuration

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `recipientEmail` | string | ✅ | Email qui reçoit les formulaires de contact |
| `senderEmail` | string | ⚠️  | Email qui envoie les notifications (défaut: locodai.sas@gmail.com) |
| `senderAppPassword` | string | ⚠️  | Mot de passe d'application Gmail (requis si senderEmail != locodai.sas@gmail.com) |
| `replyToEmail` | string | ❌ | Email de réponse (défaut: recipientEmail) |
| `credentialName` | string | ❌ | Nom personnalisé pour le credential N8N |

## 🚀 Fonctionnement Automatique

### 1. Détection de Credential Existant
```bash
🔍 Finding or creating SMTP credential for: contact@monsite.fr
✅ Using existing credential: Locodai Gmail (bUu8Wj3fYXqnn2nZ)
```

### 2. Création Automatique de Credential
```bash
🔍 Finding or creating SMTP credential for: support@monsite.fr
🔧 Creating new SMTP credential for support@monsite.fr...
📤 Creating SMTP credential: support SMTP - Auto Generated
✅ Created new credential: support SMTP - Auto Generated (k76HUxmzwqsNm38N)
```

## 🔐 Configuration des Mots de Passe Gmail

Pour utiliser un email personnalisé Gmail:

1. **Activer l'authentification à 2 facteurs** sur le compte Gmail
2. **Générer un mot de passe d'application**:
   - Aller dans Paramètres Google → Sécurité
   - Sélectionner "Mots de passe des applications"
   - Générer un mot de passe pour "Application personnalisée"
3. **Utiliser ce mot de passe** dans `senderAppPassword`

## ⚠️  Gestion d'Erreurs

### Email personnalisé sans mot de passe
```bash
❌ Failed to setup SMTP credential
   Error: App password required to create new SMTP credential

🔧 SOLUTION: To use a custom email address, please:
1. Add senderAppPassword to your site config
2. Or manually create the SMTP credential in N8N dashboard
3. Or use the default locodai.sas@gmail.com (no action needed)
```

### Solution: Ajouter le mot de passe d'application
```json
{
  "config": {
    "senderEmail": "support@monsite.fr",
    "senderAppPassword": "abcd-efgh-ijkl-mnop"
  }
}
```

## 🏗️ Architecture Technique

### Credentials N8N Connus
```javascript
const knownCredentials = {
  'locodai.sas@gmail.com': {
    id: 'bUu8Wj3fYXqnn2nZ',
    name: 'Locodai Gmail'
  }
};
```

### Format de Création de Credential
```javascript
{
  name: "Custom SMTP - Auto Generated",
  type: "smtp",
  data: {
    user: "email@example.com",
    password: "app-password",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    disableStartTls: false
  }
}
```

## 🎯 Exemples d'Usage

### Site Standard (Locodai par défaut)
```json
{
  "integrations": {
    "n8n": {
      "flows": {
        "contactForm": {
          "config": {
            "recipientEmail": "contact@qalyarab.fr"
          }
        }
      }
    }
  }
}
```
→ Utilise automatiquement `locodai.sas@gmail.com` comme expéditeur

### Site Premium (Email personnalisé)
```json
{
  "integrations": {
    "n8n": {
      "flows": {
        "contactForm": {
          "config": {
            "recipientEmail": "contact@premiumsite.com",
            "senderEmail": "noreply@premiumsite.com",
            "senderAppPassword": "abcd-efgh-ijkl-mnop",
            "credentialName": "Premium Site SMTP"
          }
        }
      }
    }
  }
}
```
→ Crée automatiquement un credential N8N pour `noreply@premiumsite.com`

## 🔄 Workflow de Génération

1. **Lecture de la configuration** du site
2. **Détection de l'email expéditeur** (défaut: locodai.sas@gmail.com)
3. **Recherche de credential existant** dans N8N
4. **Création automatique** si nécessaire et mot de passe fourni
5. **Génération du workflow** avec le credential approprié
6. **Activation automatique** du workflow

---

*Cette architecture respecte le cahier des charges: support par défaut de locodai.sas@gmail.com avec possibilité de personnalisation automatique.*