import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * 🎯 NAVIGATION MANAGER V2 - Système unifié et robuste
 * 
 * Remplace tous les systèmes de navigation fragmentés:
 * - handleNavigation dans Navbar
 * - ScrollToTop component  
 * - Footer navigation
 * 
 * PRINCIPE: Une seule source de vérité pour toute navigation
 */
const useNavigationManager = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Navigation unifiée avec scroll-to-top automatique
   * @param {string} path - Chemin de destination
   * @param {Object} options - Options de navigation
   */
  const navigateTo = useCallback((path, options = {}) => {
    const {
      scrollBehavior = 'auto', // 'auto' | 'smooth' | 'instant'
      replace = false,
      preserveScroll = false
    } = options;

    // 1. Scroll immédiat si on reste sur la même page
    if (location.pathname === path) {
      if (!preserveScroll) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: scrollBehavior === 'auto' ? 'smooth' : scrollBehavior
        });
      }
      return;
    }

    // 2. Pour navigation vers nouvelle page
    if (!preserveScroll) {
      // Scroll instantané AVANT navigation pour éviter conflits
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }

    // 3. Navigation React Router
    navigate(path, { replace });
    
  }, [navigate, location.pathname]);

  /**
   * Navigation avec scroll vers ancre spécifique
   * @param {string} path - Chemin 
   * @param {string} anchor - ID de l'élément cible
   */
  const navigateToAnchor = useCallback((path, anchor, options = {}) => {
    const { scrollBehavior = 'smooth' } = options;

    // Si même page, scroll direct vers ancre
    if (location.pathname === path) {
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ 
          behavior: scrollBehavior === 'auto' ? 'smooth' : scrollBehavior 
        });
      }
      return;
    }

    // Navigation puis scroll vers ancre après chargement
    navigate(path);
    
    // Attendre que la page se charge puis scroller
    setTimeout(() => {
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ 
          behavior: scrollBehavior === 'auto' ? 'smooth' : scrollBehavior 
        });
      }
    }, 100);
    
  }, [navigate, location.pathname]);

  /**
   * Navigation externe (liens externes)
   * @param {string} url - URL externe
   * @param {boolean} newTab - Ouvrir dans nouvel onglet
   */
  const navigateExternal = useCallback((url, newTab = true) => {
    if (newTab) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = url;
    }
  }, []);

  /**
   * Navigation retour (historique)
   */
  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  /**
   * Utilitaire pour Event handlers
   * @param {string} path - Chemin de destination
   * @param {Object} options - Options
   */
  const createNavigationHandler = useCallback((path, options = {}) => {
    return (event) => {
      // Empêcher comportement par défaut
      if (event?.preventDefault) {
        event.preventDefault();
      }
      if (event?.stopPropagation) {
        event.stopPropagation();
      }

      // Fermer menus mobiles si nécessaire
      if (options.closeMobileMenu && typeof options.closeMobileMenu === 'function') {
        options.closeMobileMenu();
      }

      navigateTo(path, options);
    };
  }, [navigateTo]);

  return {
    // Méthodes principales
    navigateTo,
    navigateToAnchor,
    navigateExternal,
    goBack,
    
    // Utilitaires
    createNavigationHandler,
    
    // État actuel
    currentPath: location.pathname,
    currentLocation: location
  };
};

export default useNavigationManager;