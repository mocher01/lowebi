import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadSiteConfig, isFeatureEnabled } from "@/config/config-loader";
import { applyAutoNavbarColors } from "@/utils/colorUtils";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const config = loadSiteConfig();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  // 🚀 FIX v1.1.1.9.2.6: Fonction pour gérer TOUTE navigation avec scroll vers le haut - FIX BUILD
  const handleNavigation = React.useCallback((e, path) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    
    // Si on est déjà sur la page cible, scroll vers le haut
    if (location.pathname === path) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      });
    } else {
      // Force scroll to top puis navigation pour compatibilité universelle
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => {
        navigate(path, { replace: false });
      }, 10);
    }
    
    // Fermer le menu mobile si ouvert
    setIsOpen(false);
  }, [location.pathname, navigate]);

  // 🚀 FIX v1.0.5: Fonction spécifique pour home (rétrocompatibilité)
  const handleHomeNavigation = React.useCallback((e) => {
    handleNavigation(e, '/');
  }, [handleNavigation]);

  // Navigation dynamique basée sur la configuration
  const navLinks = config.navigation?.links || [
    { name: "Accueil", path: "/" },
    { name: "Services", path: "/services" },
    { name: "À propos", path: "/about" },
  ];
  
  // Ajouter le blog seulement s'il est activé
  const blogEnabled = isFeatureEnabled('blog');
  const finalNavLinks = navLinks.filter(link => {
    if (link.path === '/blog') return blogEnabled;
    return true;
  });

  // Si le blog est activé mais pas dans la config, l'ajouter
  if (blogEnabled && !navLinks.some(link => link.path === '/blog')) {
    const blogIndex = navLinks.findIndex(link => link.path === '/about');
    if (blogIndex > -1) {
      finalNavLinks.splice(blogIndex, 0, { name: "Blog", path: "/blog" });
    } else {
      finalNavLinks.push({ name: "Blog", path: "/blog" });
    }
  }

  const ctaConfig = config.navigation?.cta || {
    text: "Contactez-nous",
    path: "/contact"
  };

  // 🎨 NOUVEAUTÉ : Couleurs automatiques de la navbar
  const configWithAutoColors = applyAutoNavbarColors(config);
  const navbarBg = configWithAutoColors.navbar?.background || "#f8fafc";
  const navbarText = configWithAutoColors.navbar?.textColor || "#1e293b";
  const navbarAccent = configWithAutoColors.navbar?.accentColor || config.brand?.colors?.primary || "#8B4513";

  // 🎨 Support des logos adaptatifs (clair/sombre)
  const getNavbarLogo = () => {
    // Priorité 1: Logo spécifique navbar (nouveau système)
    if (config.brand?.logos?.navbar) {
      return `/assets/${config.brand.logos.navbar}`;
    }
    // Priorité 2: Logo par défaut (ancien système)
    if (config.brand?.logo) {
      return `/assets/${config.brand.logo}`;
    }
    // Priorité 3: Logo Locodai par défaut
    return "/logo-locodai.png";
  };

  return (
    <header
      className={`navbar fixed top-0 left-0 right-0 transition-all duration-300 ${
        scrolled
          ? "shadow-sm backdrop-blur-md"
          : ""
      }`}
      style={{
        backgroundColor: scrolled ? `${navbarBg}f0` : navbarBg,
        color: navbarText,
        // 🔧 FIX CRITIQUE: Z-index très élevé pour garantir la visibilité
        zIndex: 9999,
        // 🔧 FIX: Forcer la visibilité
        display: 'block',
        position: 'fixed',
        width: '100%'
      }}
    >
      <div className="w-full">
        <div className="container">
          <div className="flex items-center justify-between" style={{ height: '80px' }}>
            <div className="flex flex-col items-start leading-tight">
              {/* 🚀 FIX v1.0.5: Logo avec gestion du scroll */}
              <button 
                onClick={handleHomeNavigation}
                className="flex items-center cursor-pointer"
                aria-label="Retour à l'accueil"
              >
                <img
                  src={getNavbarLogo()}
                  alt={`${config.brand.name} Logo`}
                  className="h-[60px] w-auto object-contain object-left"
                />
              </button>
            </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {finalNavLinks.map((link) => {
              // 🚀 FIX v1.0.5: Traitement spécial pour le lien Accueil
              if (link.path === '/') {
                return (
                  <button
                    key={link.name}
                    onClick={handleHomeNavigation}
                    className="font-medium transition-colors hover:opacity-80 cursor-pointer"
                    style={{ 
                      color: navbarText,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      zIndex: 10000
                    }}
                  >
                    {link.name}
                  </button>
                );
              }
              
              return (
                <button
                  key={link.name}
                  onClick={(e) => handleNavigation(e, link.path)}
                  className="font-medium transition-colors hover:opacity-80 cursor-pointer"
                  style={{ 
                    color: navbarText,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    zIndex: 10000
                  }}
                >
                  {link.name}
                </button>
              );
            })}
            <Button 
              onClick={(e) => handleNavigation(e, ctaConfig.path)}
              className="text-white font-medium px-6 py-2 rounded-lg transition-all hover:opacity-90"
              style={{ 
                backgroundColor: navbarAccent,
                borderColor: navbarAccent,
                zIndex: 10000
              }}
            >
              {ctaConfig.text}
            </Button>
          </nav>

            {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className="hover:bg-transparent"
              style={{ 
                color: navbarText,
                zIndex: 10000
              }}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="md:hidden shadow-lg"
          style={{ 
            backgroundColor: navbarBg, 
            color: navbarText,
            zIndex: 9998
          }}
        >
          <div className="w-full">
            <div className="container py-4">
            <nav className="flex flex-col space-y-4">
              {finalNavLinks.map((link) => {
                // 🚀 FIX v1.0.5: Traitement spécial pour le lien Accueil mobile
                if (link.path === '/') {
                  return (
                    <button
                      key={link.name}
                      onClick={handleHomeNavigation}
                      className="font-medium py-2 transition-colors hover:opacity-80 text-left cursor-pointer"
                      style={{ 
                        color: navbarText,
                        background: 'none',
                        border: 'none',
                        padding: '0.5rem 0'
                      }}
                    >
                      {link.name}
                    </button>
                  );
                }
                
                return (
                  <button
                    key={link.name}
                    onClick={(e) => handleNavigation(e, link.path)}
                    className="font-medium py-2 transition-colors hover:opacity-80 text-left cursor-pointer"
                    style={{ 
                      color: navbarText,
                      background: 'none',
                      border: 'none',
                      padding: '0.5rem 0'
                    }}
                  >
                    {link.name}
                  </button>
                );
              })}
              <Button 
                onClick={(e) => handleNavigation(e, ctaConfig.path)}
                className="text-white font-medium w-full py-2 rounded-lg transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: navbarAccent,
                  borderColor: navbarAccent
                }}
              >
                {ctaConfig.text}
              </Button>
            </nav>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Navbar;