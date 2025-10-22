# Configuration Template

Ce dossier contient la configuration injectée dynamiquement pour chaque site.

## Fichiers générés automatiquement :

- `site.json` - Configuration complète du site injectée par le script
- `config-loader.js` - Utilitaire pour charger la configuration

## Utilisation dans les composants :

```jsx
import { loadSiteConfig } from '@/config/config-loader';

const MyComponent = () => {
  const config = loadSiteConfig();
  
  return (
    <h1>{config.brand.name}</h1>
  );
};
```

## Variables disponibles :

- `config.brand.name` - Nom de l'entreprise
- `config.brand.slogan` - Slogan
- `config.brand.colors` - Couleurs du thème
- `config.content.hero` - Contenu section hero
- `config.content.services` - Liste des services
- `config.contact` - Informations de contact

Voir le schéma complet dans `sites-configs/schemas/config-schema.json`