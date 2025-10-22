import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadSiteConfig, isFeatureEnabled } from "@/config/config-loader";
import { applyAutoNavbarColors } from "@/utils/colorUtils";
import useNavigationManager from "@/hooks/useNavigationManager";

/**
 * 🎯 NAVBAR V2 - Navigation unifiée et robuste
 * 
 * Utilise le nouveau NavigationManager pour:
 * - Navigation cohérente et fiable
 * - Scroll-to-top automatique
 * - Pas de conflits entre systèmes
 * - Mobile/Desktop unifié
 */
const NavbarV2 = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const config = loadSiteConfig();
  
  // 🆕 Nouveau système de navigation unifié
  const { navigateTo, createNavigationHandler, currentPath } = useNavigationManager();

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer menu mobile
  const closeMobileMenu = () => setIsOpen(false);

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

  // 🎨 Couleurs automatiques de la navbar
  const configWithAutoColors = applyAutoNavbarColors(config);
  const navbarBg = configWithAutoColors.navbar?.background || "#f8fafc";
  const navbarText = configWithAutoColors.navbar?.textColor || "#1e293b";
  const navbarAccent = configWithAutoColors.navbar?.accentColor || config.brand?.colors?.primary || "#8B4513";

  // 🎨 Support des logos adaptatifs
  const getNavbarLogo = () => {
    if (config.brand?.logos?.navbar) {
      return `/assets/${config.brand.logos.navbar}`;
    }
    if (config.brand?.logo) {
      return `/assets/${config.brand.logo}`;
    }
    return "/logo-locodai.png";
  };

  return (
    <header
      className={`navbar fixed top-0 left-0 right-0 transition-all duration-300 ${
        scrolled ? "shadow-sm backdrop-blur-md" : ""
      }`}
      style={{
        backgroundColor: scrolled ? `${navbarBg}f0` : navbarBg,
        color: navbarText,
        zIndex: 9999,
        display: 'block',
        position: 'fixed',
        width: '100%'
      }}
    >
      <div className="w-full">
        <div className="container">
          <div className="flex items-center justify-between" style={{ height: '80px' }}>
            <div className="flex flex-col items-start leading-tight">
              {/* 🆕 Logo avec nouveau système de navigation */}
              <button 
                onClick={createNavigationHandler('/', { closeMobileMenu })}
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
              // Déterminer si le lien est actif
              const isActive = currentPath === link.path;
              
              return (
                <button
                  key={link.name}
                  onClick={createNavigationHandler(link.path, { closeMobileMenu })}
                  className={`font-medium transition-colors hover:opacity-80 cursor-pointer ${
                    isActive ? 'opacity-100 font-semibold' : ''
                  }`}
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
              onClick={createNavigationHandler(ctaConfig.path, { closeMobileMenu })}
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
              onClick={() => setIsOpen(!isOpen)}
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
                const isActive = currentPath === link.path;
                
                return (
                  <button
                    key={link.name}
                    onClick={createNavigationHandler(link.path, { closeMobileMenu })}
                    className={`font-medium py-2 transition-colors hover:opacity-80 text-left cursor-pointer ${
                      isActive ? 'opacity-100 font-semibold' : ''
                    }`}
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
                onClick={createNavigationHandler(ctaConfig.path, { closeMobileMenu })}
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

export default NavbarV2;