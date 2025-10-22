import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook } from "lucide-react";
import { loadSiteConfig, isFeatureEnabled } from "@/config/config-loader";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const config = loadSiteConfig();
  const contact = config.contact || {};
  const social = contact.social || {};
  const navigate = useNavigate();

  // Navigation universelle compatible Firefox
  const handleUniversalNavigation = (e, path) => {
    e?.preventDefault?.();
    console.log('🎯 Footer Navigation vers:', path);
    
    // Pour les liens avec ancres (comme /#faq)
    if (path.includes('#')) {
      const [basePath, anchor] = path.split('#');
      console.log('🎯 Navigation vers ancre:', basePath, anchor);
      
      // Si on est déjà sur la page de base, juste scroller vers l'ancre
      if (window.location.pathname === basePath || (basePath === '' && window.location.pathname === '/')) {
        const element = document.getElementById(anchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }
      
      // Sinon naviguer puis scroller vers l'ancre
      navigate(basePath || '/', { replace: false });
      setTimeout(() => {
        const element = document.getElementById(anchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return;
    }
    
    // Force scroll to top puis navigation pour compatibilité Firefox
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    setTimeout(() => {
      navigate(path, { replace: false });
    }, 10);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  // Navigation links dynamiques
  const quickLinks = config.navigation?.links || [
    { name: "Accueil", path: "/" },
    { name: "Services", path: "/services" },
    { name: "À propos", path: "/about" },
  ];
  
  // Ajouter le blog seulement s'il est activé
  const blogEnabled = isFeatureEnabled('blog');
  const finalQuickLinks = quickLinks.filter(link => {
    if (link.path === '/blog') return blogEnabled;
    return true;
  });

  // Si le blog est activé mais pas dans la config, l'ajouter
  if (blogEnabled && !quickLinks.some(link => link.path === '/blog')) {
    const blogIndex = quickLinks.findIndex(link => link.path === '/about');
    if (blogIndex > -1) {
      finalQuickLinks.splice(blogIndex, 0, { name: "Blog", path: "/blog" });
    } else {
      finalQuickLinks.push({ name: "Blog", path: "/blog" });
    }
  }

  // Ajouter FAQ si activé
  const faqEnabled = isFeatureEnabled('faq');
  if (faqEnabled) {
    finalQuickLinks.push({ name: "FAQ", path: "/#faq" });
  }
  
  finalQuickLinks.push({ name: "Contact", path: "/contact" });

  // 🎨 NOUVEAUTÉ : Support des logos adaptatifs (clair/sombre)  
  const getFooterLogo = () => {
    // Priorité 1: Logo spécifique footer/sombre (nouveau système)
    if (config.brand?.logos?.footer) {
      return `/assets/${config.brand.logos.footer}`;
    }
    // Priorité 2: Logo par défaut (ancien système)
    if (config.brand?.logo) {
      return `/assets/${config.brand.logo}`;
    }
    // Priorité 3: Logo Locodai sombre par défaut
    return "logo-locodaisombre.png";
  };

  // Couleurs configurables du footer
  const footerBg = config.footer?.background || '#0f172a'; // slate-900
  const footerText = config.footer?.textColor || '#cbd5e1'; // slate-300

  return (
    <footer 
      className="pt-16 pb-8"
      style={{ 
        backgroundColor: footerBg,
        color: footerText 
      }}
    >
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Company Info */}
          <div className="flex flex-col items-start gap-2">
            <h3 className="mb-0">
              <button 
                onClick={(e) => handleUniversalNavigation(e, "/")} 
                className="inline-block hover:opacity-80 transition-opacity"
              >
                <img
                  src={getFooterLogo()}
                  alt={`${config.brand.name} Logo`}
                  className="h-[60px] w-auto object-contain object-center"
                />
              </button>
            </h3>
            <p 
              className="text-sm leading-relaxed max-w-[275px] mt-0 mb-1"
              style={{ color: footerText }}
            >
              {config.content.about?.description || 
               `${config.brand.name} - ${config.brand.slogan || 'Votre partenaire de confiance'}`}
            </p>

            {/* Réseaux sociaux */}
            <div className="flex space-x-4">
              {social.linkedin && (
                <a
                  href={social.linkedin.startsWith('http') ? social.linkedin : `https://linkedin.com/in/${social.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`LinkedIn ${config.brand.name}`}
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: config.brand?.colors?.accent || footerText }}
                >
                  <Linkedin size={20} />
                </a>
              )}
              {social.twitter && (
                <a
                  href={social.twitter.startsWith('http') ? social.twitter : `https://twitter.com/${social.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Twitter ${config.brand.name}`}
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: config.brand?.colors?.accent || footerText }}
                >
                  <Twitter size={20} />
                </a>
              )}
              {social.facebook && (
                <a
                  href={social.facebook.startsWith('http') ? social.facebook : `https://facebook.com/${social.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Facebook ${config.brand.name}`}
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: config.brand?.colors?.accent || footerText }}
                >
                  <Facebook size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 uppercase tracking-wider" style={{ color: footerText }}>Liens rapides</h3>
            <ul className="space-y-2">
              {finalQuickLinks.map((link) => (
                <li key={link.path}>
                  <button 
                    onClick={(e) => handleUniversalNavigation(e, link.path)} 
                    className="hover:opacity-80 transition-opacity text-left"
                    style={{ color: config.brand?.colors?.accent || footerText }}
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services/Activités */}
          <div>
            <h3 className="text-lg font-semibold mb-4 uppercase tracking-wider" style={{ color: footerText }}>
              {config.navigation?.links?.find(link => link.path === '/services')?.name || 'Nos activités'}
            </h3>
            <ul className="space-y-2">
              {config.content.services?.slice(0, 4).map((service, index) => (
                <li key={index}>
                  <button 
                    onClick={(e) => handleUniversalNavigation(e, `/service/${service.slug}`)} 
                    className="hover:opacity-80 transition-opacity text-left"
                    style={{ color: config.brand?.colors?.accent || footerText }}
                  >
                    {service.title}
                  </button>
                </li>
              )) || [
                <li key="1">
                  <button 
                    onClick={(e) => handleUniversalNavigation(e, "/services")} 
                    className="hover:opacity-80 transition-opacity text-left"
                    style={{ color: config.brand?.colors?.accent || footerText }}
                  >
                    {config.navigation?.links?.find(link => link.path === '/services')?.name || 'Nos activités'}
                  </button>
                </li>
              ]}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 uppercase tracking-wider" style={{ color: footerText }}>Contact</h3>
            <ul className="space-y-3">
              {contact.address && (
                <li className="flex items-start">
                  <MapPin 
                    className="mr-2 h-5 w-5 flex-shrink-0 mt-0.5" 
                    style={{ color: config.brand?.colors?.accent || footerText }}
                  />
                  <span style={{ color: footerText }}>
                    {typeof contact.address === 'string' 
                      ? contact.address 
                      : `${contact.address.city}, ${contact.address.country}`
                    }
                  </span>
                </li>
              )}
              {contact.phone && (
                <li className="flex items-center">
                  <Phone 
                    className="mr-2 h-5 w-5 flex-shrink-0" 
                    style={{ color: config.brand?.colors?.accent || footerText }}
                  />
                  <span style={{ color: footerText }}>{contact.phone}</span>
                </li>
              )}
              {contact.email && (
                <li className="flex items-center">
                  <Mail 
                    className="mr-2 h-5 w-5 flex-shrink-0" 
                    style={{ color: config.brand?.colors?.accent || footerText }}
                  />
                  <span style={{ color: footerText }}>{contact.email}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="border-t mt-12 pt-8" style={{ borderTopColor: config.brand?.colors?.accent || footerText }}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm" style={{ color: footerText }}>
              &copy; {currentYear} {config.brand.name}. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button 
                onClick={(e) => handleUniversalNavigation(e, "/privacy")} 
                className="hover:opacity-80 text-sm transition-opacity"
                style={{ color: config.brand?.colors?.accent || footerText }}
              >
                Politique de confidentialité
              </button>
              <button 
                onClick={(e) => handleUniversalNavigation(e, "/terms")} 
                className="hover:opacity-80 text-sm transition-opacity"
                style={{ color: config.brand?.colors?.accent || footerText }}
              >
                Conditions d'utilisation
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;