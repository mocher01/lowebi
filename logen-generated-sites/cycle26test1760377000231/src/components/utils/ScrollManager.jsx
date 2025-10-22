import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 🎯 SCROLL MANAGER V2 - Gestionnaire global de scroll
 * 
 * Remplace l'ancien ScrollToTop.jsx avec:
 * - Gestion intelligente du scroll
 * - Support des ancres
 * - Configuration par route
 * - Pas de conflits avec NavigationManager
 */
const ScrollManager = () => {
  const location = useLocation();

  useEffect(() => {
    // Extraire l'ancre de l'URL (#section)
    const hash = location.hash;
    
    if (hash) {
      // Navigation vers ancre
      setTimeout(() => {
        const element = document.getElementById(hash.slice(1));
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    } else {
      // Navigation normale - scroll to top SEULEMENT si pas déjà fait par NavigationManager
      // On vérifie si c'est une navigation "naturelle" React Router
      const isNaturalNavigation = !window.__NAVIGATION_MANAGER_ACTIVE__;
      
      if (isNaturalNavigation) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto' // Pas de smooth pour éviter conflits
        });
      }
    }

    // Reset du flag après traitement
    window.__NAVIGATION_MANAGER_ACTIVE__ = false;
    
  }, [location.pathname, location.hash]);

  return null;
};

export default ScrollManager;