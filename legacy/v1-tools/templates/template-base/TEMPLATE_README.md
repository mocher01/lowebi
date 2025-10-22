# Template de Site Web Paramétrable

Template React basé sur locodai-website, adapté pour la génération automatique de sites personnalisés.

## 🎯 Utilisation

### Build avec configuration
```bash
# Injecter config et builder
./scripts/build-with-config.sh qalyarab

# Ou étape par étape
node scripts/inject-config.js qalyarab
npm run build
```

### Build Docker
```bash
# Builder l'image Docker
docker build -t qalyarab-site .

# Lancer le container
docker run -p 3000:80 qalyarab-site
```

## 🔧 Structure

```
template-base/
├── src/
│   ├── components/    # Composants React (à cloner depuis locodai)
│   ├── pages/         # Pages (à cloner depuis locodai)
│   ├── config/        # Configuration injectée dynamiquement
│   └── lib/           # Utilitaires
├── public/
│   └── assets/        # Assets copiés depuis sites-configs
├── scripts/
│   ├── inject-config.js      # Injection configuration
│   └── build-with-config.sh  # Build avec config
├── docker/
│   └── nginx.conf     # Configuration nginx
└── Dockerfile         # Image de production
```

## 📋 TODO - Prochaines étapes

### ITERATION 2 : Dockerisation
- [ ] Cloner les composants React depuis locodai-website
- [ ] Tester le build sans configuration
- [ ] Valider le container Docker

### ITERATION 3 : Paramétérisation
- [ ] Analyser tous les contenus hardcodés
- [ ] Remplacer par des variables de configuration
- [ ] Système de fallbacks
- [ ] Tests avec config Qalyarab

## 🧪 Tests

```bash
# Test du template original
npm run dev

# Test avec config Qalyarab
./scripts/build-with-config.sh qalyarab
npm run preview

# Test Docker
docker build -t test-site .
docker run -p 3000:80 test-site
```

## 🔗 Liens

- [Configuration Qalyarab](../sites-configs/qalyarab/config.json)
- [Documentation générale](../docs/implementation-plan.md)
- [Site original Locodai](https://github.com/mocher01/locodai-website)
