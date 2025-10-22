# Guide de Sécurité Webhook N8N
*Version 1.1.1.9.3 - Sécurisation des Webhooks*

## 🔒 Configuration d'Authentification

### Étapes de Configuration

#### 1. Dans N8N (Côté Serveur)
1. Ouvrir votre workflow de contact
2. Sélectionner le nœud Webhook
3. Aller dans l'onglet "Authentication" 
4. Choisir le type d'authentification souhaité

#### 2. Types d'Authentification Supportés

##### Option A: Header Authentication (Recommandé)
```json
{
  "integrations": {
    "n8n": {
      "enabled": true,
      "instance": "https://automation.locod-ai.com",
      "workflows": {
        "contactForm": {
          "enabled": true,
          "webhookUrl": "https://automation.locod-ai.com/webhook/563f80d8-bea9-4691-af7c-4234abb78326",
          "method": "POST",
          "auth": {
            "type": "header",
            "headerName": "X-Webhook-Token",
            "headerValue": "your-secret-token-here"
          }
        }
      }
    }
  }
}
```

##### Option B: Basic Authentication
```json
{
  "auth": {
    "type": "basic",
    "username": "webhook-user",
    "password": "secure-password-123"
  }
}
```

##### Option C: Bearer Token
```json
{
  "auth": {
    "type": "bearer",
    "token": "your-bearer-token-here"
  }
}
```

#### 3. Configuration N8N

Dans N8N, configurer l'authentification correspondante :

##### Pour Header Auth:
- Type: Header Auth
- Header Name: `X-Webhook-Token`
- Header Value: `your-secret-token-here`

##### Pour Basic Auth:
- Type: Basic Auth
- Username: `webhook-user`
- Password: `secure-password-123`

##### Pour Bearer Token:
- Type: Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer your-bearer-token-here`

## 🛡️ Sécurité Supplémentaire

### 1. IP Whitelisting dans N8N
```
Votre serveur web IP
Votre IP de développement
```

### 2. Rate Limiting (Optionnel)
- Limiter à 10 requêtes/minute par IP
- Protection contre les attaques DDoS

### 3. HTTPS Obligatoire
- Toujours utiliser HTTPS pour les webhooks
- Éviter l'interception des tokens

## 🧪 Test de Configuration

Utiliser la méthode `testConnection()` du service :

```javascript
import { createN8nService } from '@/services/n8nService';

const n8nService = createN8nService(siteConfig);
const testResult = await n8nService.testConnection();

console.log('Test webhook:', testResult);
```

## 🚨 Bonnes Pratiques

1. **Rotation des Tokens**
   - Changer les tokens régulièrement
   - Utiliser des tokens complexes (32+ caractères)

2. **Monitoring**
   - Surveiller les logs N8N pour tentatives non autorisées
   - Alertes en cas d'échecs d'authentification répétés

3. **Backup de Configuration**
   - Sauvegarder la configuration N8N
   - Documenter les tokens utilisés (de manière sécurisée)

## 🔧 Mise en Production

1. Générer un token sécurisé :
   ```bash
   openssl rand -hex 32
   ```

2. Configurer dans N8N
3. Mettre à jour la configuration du site
4. Tester avec `testConnection()`
5. Déployer

## ⚠️ Avertissements

- **JAMAIS** commiter les tokens dans le code
- Utiliser des variables d'environnement en production
- Surveiller les logs pour détecter les intrusions
- Mettre à jour régulièrement N8N pour les correctifs de sécurité