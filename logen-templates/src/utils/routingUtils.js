/**
 * 🧭 Utilitaires pour gérer la navigation et le routing de façon configurée
 * 
 * Centralise la gestion des liens, scroll et navigation
 * pour une expérience utilisateur cohérente
 */

/**
 * Configuration par défaut du routing
 */
const DEFAULT_ROUTING = {
  scrollBehavior: 'smooth',
  scrollOffset: 80, // Offset pour la navbar fixe
  routes: {
    '/': { scroll: 'top' },
    '/services': { scroll: 'top' },
    '/blog': { scroll: 'top' },
    '/contact': { scroll: 'top', anchor: 'contact-form' },
    '/about': { scroll: 'top' }
  }
};

/**
 * Récupère la configuration de routing
 * @param {object} config - Configuration du site
 * @returns {object} Configuration de routing
 */
export function getRoutingConfig(config = {}) {
  const customRouting = config.routing || {};
  
  return {
    ...DEFAULT_ROUTING,
    ...customRouting,
    routes: {
      ...DEFAULT_ROUTING.routes,
      ...customRouting.routes
    }
  };
}

/**
 * Navigue vers une route avec gestion intelligente du scroll
 * @param {string} to - Route de destination
 * @param {object} config - Configuration du site
 * @param {object} options - Options de navigation
 */
export function navigateWithScroll(to, config = {}, options = {}) {
  const routingConfig = getRoutingConfig(config);
  const routeConfig = routingConfig.routes[to] || {};
  
  // Délai pour laisser le routeur faire la navigation
  setTimeout(() => {
    handleScrollBehavior(routeConfig, routingConfig, options);
  }, 50);
}

/**
 * Gère le comportement de scroll selon la configuration
 * @param {object} routeConfig - Configuration de la route
 * @param {object} routingConfig - Configuration globale de routing
 * @param {object} options - Options additionnelles
 */
function handleScrollBehavior(routeConfig, routingConfig, options = {}) {
  const scrollBehavior = options.behavior || routingConfig.scrollBehavior;
  const scrollOffset = options.offset || routingConfig.scrollOffset;
  
  if (routeConfig.anchor) {
    // Scroll vers un élément spécifique
    scrollToElement(routeConfig.anchor, scrollOffset, scrollBehavior);
  } else if (routeConfig.scroll === 'top' || options.scrollToTop) {
    // Scroll vers le haut
    scrollToTop(scrollBehavior);
  }
}

/**
 * Scroll vers le haut de la page
 * @param {string} behavior - Comportement de scroll ('smooth' ou 'instant')
 */
export function scrollToTop(behavior = 'smooth') {
  window.scrollTo({
    top: 0,
    behavior: behavior
  });
}

/**
 * Scroll vers un élément spécifique
 * @param {string} elementId - ID de l'élément cible
 * @param {number} offset - Décalage en pixels
 * @param {string} behavior - Comportement de scroll
 */
export function scrollToElement(elementId, offset = 80, behavior = 'smooth') {
  const element = document.getElementById(elementId);
  if (element) {
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
    const scrollPosition = elementTop - offset;
    
    window.scrollTo({
      top: scrollPosition,
      behavior: behavior
    });
  }
}

/**
 * Génère un handler de clic configuré pour les liens
 * @param {string} to - Route de destination
 * @param {object} config - Configuration du site
 * @param {function} navigate - Fonction de navigation du routeur
 * @returns {function} Handler de clic
 */
export function createLinkHandler(to, config = {}, navigate = null) {
  return (event) => {
    if (navigate) {
      // Utiliser le routeur React
      navigate(to);
    } else {
      // Fallback avec window.location
      window.location.href = to;
    }
    
    // Gérer le scroll
    navigateWithScroll(to, config, { scrollToTop: true });
  };
}

/**
 * Composant wrapper pour les liens avec navigation intelligente
 * @param {object} props - Props du composant
 * @returns {JSX.Element} Élément JSX
 */
export function SmartLink({ to, config, children, className, onClick, ...props }) {
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    
    // Gérer le scroll si c'est un lien interne
    if (to.startsWith('/')) {
      navigateWithScroll(to, config, { scrollToTop: true });
    }
  };
  
  return (
    <a
      href={to}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * Hook pour gérer la navigation configurée
 * @param {object} config - Configuration du site
 * @returns {object} Utilities de navigation
 */
export function useSmartNavigation(config = {}) {
  const routingConfig = getRoutingConfig(config);
  
  return {
    // Navigue vers une route avec scroll
    navigateTo: (to, options = {}) => {
      navigateWithScroll(to, config, options);
    },
    
    // Scroll vers le haut
    scrollToTop: (behavior = routingConfig.scrollBehavior) => {
      scrollToTop(behavior);
    },
    
    // Scroll vers un élément
    scrollToElement: (elementId, offset = routingConfig.scrollOffset, behavior = routingConfig.scrollBehavior) => {
      scrollToElement(elementId, offset, behavior);
    },
    
    // Récupère la config de routing
    getRoutingConfig: () => routingConfig
  };
}

/**
 * Récupère l'URL configurée pour un type de lien
 * @param {string} linkType - Type de lien (services, contact, blog, etc.)
 * @param {object} config - Configuration du site
 * @returns {string} URL du lien
 */
export function getConfiguredLink(linkType, config = {}) {
  const navigation = config.navigation || {};
  
  switch (linkType) {
    case 'services':
    case 'activities':
      const serviceLink = navigation.links?.find(link => 
        link.path === '/services' || link.path === '/activities'
      );
      return serviceLink?.path || '/services';
      
    case 'contact':
      const contactLink = navigation.links?.find(link => link.path === '/contact');
      return contactLink?.path || '/contact';
      
    case 'blog':
      const blogLink = navigation.links?.find(link => link.path === '/blog');
      return blogLink?.path || '/blog';
      
    case 'about':
      const aboutLink = navigation.links?.find(link => link.path === '/about');
      return aboutLink?.path || '/about';
      
    default:
      return '/';
  }
}

/**
 * Génère les props pour un bouton/lien CTA configuré
 * @param {string} ctaType - Type de CTA (contact, services, etc.)
 * @param {object} config - Configuration du site
 * @returns {object} Props pour le composant
 */
export function getCTAProps(ctaType, config = {}) {
  const routingConfig = getRoutingConfig(config);
  const link = getConfiguredLink(ctaType, config);
  
  return {
    to: link,
    onClick: (e) => {
      e.preventDefault();
      navigateWithScroll(link, config, { scrollToTop: true });
    },
    'data-routing': JSON.stringify(routingConfig.routes[link] || {})
  };
}
