# 📚 Standards de Documentation

## 🎯 Objectif
Maintenir une documentation propre et éviter le "bordel" dans les fichiers.

## 📁 Structure Obligatoire

### Documentation Principale (racine `/docs/`)
- `README.md` - Vue d'ensemble du projet
- `VERSIONS.md` - Historique des versions
- `CHANGELOG.md` - Changelog principal (pas de versions spécifiques)
- `IMPROVEMENTS.md` - Améliorations futures
- `ARCHITECTURE.md` - Architecture technique

### Documentation Spécialisée
- `N8N_INTEGRATION_ROADMAP.md` - Roadmap intégrations
- `ASSETS_GUIDE.md` - Guide assets
- `USER_GUIDE.md` - Guide utilisateur

### Archive (`/docs/archive/`)
- Changelogs spécifiques à des versions (ex: `CHANGELOG-v1117.md`)
- Documentation obsolète
- Notes temporaires de développement

## 🚫 INTERDICTIONS

### ❌ NE PAS créer :
- Fichiers README multiples dans sous-dossiers
- Changelogs spécifiques à des versions dans la racine
- Fichiers temporaires avec des noms comme `temp-fix.md`
- Documentation dupliquée

### ❌ NE PAS placer dans la racine :
- Fichiers de documentation temporaires
- Notes de développement personnelles
- Fichiers de test (`.txt`, `.temp`)

## ✅ BONNES PRATIQUES

### 📝 Nommage
- Noms descriptifs en MAJUSCULES pour docs importantes
- Préfixe par sujet (ex: `N8N_`, `ASSETS_`)
- Pas de versions dans les noms (sauf dans `/archive/`)

### 📄 Contenu
- Toujours maintenir `VERSION.txt` à jour
- Une seule source de vérité pour chaque information
- Références croisées avec liens relatifs

### 🗂️ Organisation
- Documentation active dans `/docs/`
- Documentation historique dans `/docs/archive/`
- Scripts organisés dans `/scripts/` avec sous-dossiers

## 🔄 Processus de Nettoyage Régulier

### À chaque version majeure :
1. Archiver les changelogs spécifiques
2. Vérifier cohérence des versions
3. Supprimer fichiers temporaires
4. Mettre à jour les références

### Avant chaque commit :
1. Pas de fichiers `.temp`, `.test`, `.backup` dans la racine
2. Vérifier que `VERSION.txt` correspond au code
3. Pas de doublons de documentation

## 📋 Checklist Pré-Commit

- [ ] `VERSION.txt` à jour
- [ ] Pas de fichiers temporaires dans la racine  
- [ ] Documentation cohérente
- [ ] Scripts organisés dans bons dossiers
- [ ] Pas de doublons de README