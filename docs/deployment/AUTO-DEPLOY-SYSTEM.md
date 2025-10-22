# 🚀 Auto-Deploy System Documentation

## Overview

Le système d'auto-déploiement permet de déployer automatiquement les changements de code vers le serveur de production sans intervention manuelle.

## Architecture

```
Local Development → GitHub → Production Server
        ↓              ↓            ↓
   auto-deploy.sh → git pull → auto-restart-portal.sh
```

## Components

### 1. `scripts/deploy/auto-deploy.sh`
Script principal qui orchestre le déploiement complet.

**Étapes automatiques :**
1. Commit des changements locaux
2. Push vers GitHub
3. Pull sur le serveur de production
4. Détection des fichiers critiques modifiés
5. Auto-restart du portal si nécessaire
6. Vérification de santé

### 2. `scripts/deploy/auto-restart-portal.sh`
Script de redémarrage intelligent du portal sur le serveur.

**Fonctionnalités :**
- Gestion propre des processus avec PID file
- Arrêt en douceur de l'ancien processus
- Démarrage automatique du nouveau processus
- Vérification de santé après démarrage
- Logging détaillé

## Usage

### Déploiement standard
```bash
./scripts/deploy/auto-deploy.sh
```

### Déploiement avec message personnalisé
```bash
./scripts/deploy/auto-deploy.sh "feat: Add new wizard step"
```

## Configuration

### Variables d'environnement (auto-deploy.sh)
```bash
PRODUCTION_SERVER="root@162.55.213.90"
PROJECT_PATH="/var/apps/website-generator"
PORTAL_SERVICE="customer-portal"
```

### Fichiers surveillés pour auto-restart
Le système redémarre automatiquement le portal si ces dossiers sont modifiés :
- `api/` - Code du serveur API
- `scripts/` - Scripts de génération
- `database/` - Schémas et migrations

## Processus de Redémarrage

### Fichiers système
- **PID File**: `/var/apps/website-generator/portal.pid`
- **Log File**: `/var/apps/website-generator/portal.log`

### Étapes du restart
1. Lecture du PID existant
2. Arrêt propre du processus (kill + vérification)
3. Nettoyage des processus orphelins
4. Démarrage du nouveau processus
5. Sauvegarde du nouveau PID
6. Test de connectivité (curl localhost:3080)

## Monitoring

### Vérifications automatiques
- **API Health**: `http://162.55.213.90:3080/api/health`
- **Wizard Access**: `http://162.55.213.90:3080/wizard`
- **Portal Status**: `http://162.55.213.90:3080/`

### Logs
```bash
# Voir les logs du portal
ssh root@162.55.213.90 "tail -f /var/apps/website-generator/portal.log"

# Vérifier le processus
ssh root@162.55.213.90 "cat /var/apps/website-generator/portal.pid"
```

## Tests automatiques (optionnel)

Le script propose d'exécuter des tests après déploiement :
```bash
🧪 Run quick tests? (y/N): y
```

Execute : `tests/specs/wizard-complete-flow.spec.js`

## Troubleshooting

### Portal ne démarre pas
1. Vérifier les logs : `tail -20 /var/apps/website-generator/portal.log`
2. Vérifier les dépendances : `npm install`
3. Redémarrage manuel : `node api/customer-portal-db.js`

### Permissions SSH
```bash
# Vérifier la connexion SSH
ssh root@162.55.213.90 "echo 'Connected successfully'"

# Vérifier les permissions
ssh root@162.55.213.90 "ls -la /var/apps/website-generator/"
```

### Processus bloqué
```bash
# Forcer l'arrêt de tous les processus portal
ssh root@162.55.213.90 "pkill -f customer-portal-db.js"

# Nettoyer le PID file
ssh root@162.55.213.90 "rm -f /var/apps/website-generator/portal.pid"
```

## Sécurité

- **SSH Key Authentication** : Pas de mots de passe
- **Restricted Commands** : Scripts en lecture seule sur le serveur
- **Process Isolation** : Chaque portal a son propre PID

## URLs de Production

- **Portal Principal** : http://162.55.213.90:3080/
- **Wizard** : http://162.55.213.90:3080/wizard  
- **API Health** : http://162.55.213.90:3080/api/health
- **Templates API** : http://162.55.213.90:3080/api/templates

## Historique des Changements

### v1.0 - Initial Release
- Script auto-deploy.sh basique
- Redémarrage manuel requis

### v1.1 - Auto-Restart System  
- Ajout auto-restart-portal.sh
- Gestion PID automatique
- Détection intelligente des changements
- Vérifications de santé automatiques

## Future Enhancements

- [ ] Support Docker containers
- [ ] Blue-green deployment
- [ ] Rollback automatique en cas d'échec
- [ ] Notifications Slack/Discord
- [ ] Métriques de déploiement