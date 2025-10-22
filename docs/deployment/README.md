# 🚀 Deployment Documentation

Documentation complète du système de déploiement pour le website-generator.

## 📋 Index

### Core Systems
- [**Auto-Deploy System**](./AUTO-DEPLOY-SYSTEM.md) - Système de déploiement automatique complet

### Quick Reference

#### Déploiement standard
```bash
./scripts/deploy/auto-deploy.sh
```

#### URLs de production
- Portal: http://162.55.213.90:3080/
- Wizard: http://162.55.213.90:3080/wizard
- API Health: http://162.55.213.90:3080/api/health

#### Monitoring
```bash
# Logs en temps réel
ssh root@162.55.213.90 "tail -f /var/apps/website-generator/portal.log"

# Status du processus
ssh root@162.55.213.90 "cat /var/apps/website-generator/portal.pid"
```

## 🔄 Architecture

```
Développement Local → GitHub → Serveur Production
        ↓                ↓            ↓
   auto-deploy.sh → git pull → auto-restart-portal.sh
        ↓                              ↓
    Tests E2E    →    Vérification santé API
```

## 🛠️ Scripts disponibles

| Script | Description | Usage |
|--------|-------------|-------|
| `auto-deploy.sh` | Déploiement complet | `./scripts/deploy/auto-deploy.sh` |
| `auto-restart-portal.sh` | Redémarrage portal | Automatique via auto-deploy |
| `quick-deploy.bat` | Windows quick deploy | `scripts\deploy\quick-deploy.bat` |

## 🔧 Configuration

### Variables d'environnement
```bash
PRODUCTION_SERVER="root@162.55.213.90"
PROJECT_PATH="/var/apps/website-generator"
PORTAL_PORT="3080"
```

### Fichiers système
- **PID**: `/var/apps/website-generator/portal.pid`
- **Logs**: `/var/apps/website-generator/portal.log`
- **Config**: `/var/apps/website-generator/configs/`

## 🧪 Tests automatiques

### Playwright E2E
```bash
# Tests du wizard complet
cd tests
npx playwright test specs/wizard-complete-flow.spec.js

# Tests spécifiques
npx playwright test specs/wizard-step0.spec.js
```

### API Health Checks
```bash
curl http://162.55.213.90:3080/api/health
```

## 📊 Monitoring & Maintenance

### Status checks
- ✅ Portal accessibility
- ✅ API health endpoint  
- ✅ Wizard functionality
- ✅ Process PID validation

### Troubleshooting commun
1. **Portal down** → Auto-restart via deploy script
2. **SSH issues** → Vérifier clés SSH
3. **Port conflicts** → Nettoyer processus orphelins
4. **Dependency issues** → `npm install` sur serveur

## 🔄 Workflow de déploiement

1. **Développement local** → Modifications code
2. **Auto-deploy** → `./scripts/deploy/auto-deploy.sh`
3. **GitHub sync** → Commit + Push automatique
4. **Production pull** → Git pull sur serveur
5. **Auto-restart** → Redémarrage intelligent si nécessaire
6. **Health checks** → Vérification automatique
7. **Ready** → Portal accessible immédiatement

## 📈 Métriques de performance

- **Deploy time**: ~30-60 secondes
- **Downtime**: <5 secondes pendant restart
- **Success rate**: 99%+ avec auto-restart
- **Rollback**: Manuel via git revert

## 🔐 Sécurité

- **SSH Key Auth** uniquement
- **Process isolation** avec PID files
- **Log rotation** automatique
- **Port restrictions** via firewall