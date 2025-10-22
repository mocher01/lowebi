# Template Base

Ce dossier contiendra le template Locod.AI adapté pour la génération automatique.

## Setup

1. Cloner le repository locodai-website ici
2. Adapter le code pour accepter la configuration JSON
3. Créer le Dockerfile pour la containerisation

## Structure cible

```
template-base/
├── src/              # Code React adapté
├── public/           # Assets publics
├── config/           # Configuration dynamique
├── scripts/          # Scripts de build
├── Dockerfile        # Container definition
└── package.json      # Dépendances
```

## Statut

- [ ] Clone locodai-website
- [ ] Analyse du code existant
- [ ] Identification des éléments à paramétrer
- [ ] Dockerisation