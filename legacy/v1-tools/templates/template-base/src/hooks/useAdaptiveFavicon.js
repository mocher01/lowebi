import { useEffect } from 'react';
import { loadSiteConfig } from '@/config/config-loader';

/**
 * 🎨 Hook pour gérer les favicons adaptatifs selon le mode sombre/clair du navigateur
 * 
 * Utilise les préférences système (prefers-color-scheme) pour:
 * - Mode clair → favicon clair
 * - Mode sombre → favicon sombre
 * - Écoute les changements dynamiques
 */
const useAdaptiveFavicon = () => {
  useEffect(() => {
    const config = loadSiteConfig();
    
    // Vérifier si les favicons adaptatifs sont activés
    if (!config.features?.adaptiveFavicons || !config.brand?.favicons) {
      return;
    }

    const { light: lightFavicon, dark: darkFavicon, default: defaultFavicon } = config.brand.favicons;
    
    // Fonction pour mettre à jour le favicon
    const updateFavicon = (isDark) => {
      // Supprimer les anciens favicons
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(link => link.remove());

      // Créer le nouveau favicon
      const faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/png';
      
      // Choisir le bon favicon selon le mode
      if (isDark && darkFavicon) {
        faviconLink.href = `/assets/${darkFavicon}`;
      } else if (!isDark && lightFavicon) {
        faviconLink.href = `/assets/${lightFavicon}`;
      } else if (defaultFavicon) {
        faviconLink.href = `/assets/${defaultFavicon}`;
      } else {
        // Fallback
        faviconLink.href = '/favicon.ico';
      }

      // Ajouter le nouveau favicon
      document.head.appendChild(faviconLink);
      
      // Créer aussi une version PNG 32x32 pour une meilleure compatibilité
      const faviconPng = document.createElement('link');
      faviconPng.rel = 'icon';
      faviconPng.type = 'image/png';
      faviconPng.sizes = '32x32';
      faviconPng.href = faviconLink.href;
      document.head.appendChild(faviconPng);

      console.log(`🎨 Favicon mis à jour: ${isDark ? 'mode sombre' : 'mode clair'} - ${faviconLink.href}`);
    };

    // Détecter le mode initial
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    updateFavicon(mediaQuery.matches);

    // Écouter les changements de préférences
    const handleChange = (e) => {
      updateFavicon(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Nettoyage
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
};

export default useAdaptiveFavicon;