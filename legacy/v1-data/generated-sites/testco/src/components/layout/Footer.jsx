import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook } from "lucide-react";
import { loadSiteConfig, isFeatureEnabled } from "@/config/config-loader";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const config = loadSiteConfig();
  const contact = config.contact || {};
  const social = contact.social || {};

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

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Company Info */}
          <div className="flex flex-col items-start gap-4">
            <h3 className="mb-0">
              <Link to="/" onClick={scrollToTop} className="inline-block">
                <img
                  src={getFooterLogo()}
                  alt={`${config.brand.name} Logo`}
                  className="w-[140px] object-contain"
                />
              </Link>
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[275px] mt-1 mb-2">
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
                  className="text-slate-400 hover:opacity-80 transition-opacity"
                  style={{ color: config.brand?.colors?.accent || '#DAA520' }}
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
                  className="text-slate-400 hover:opacity-80 transition-opacity"
                  style={{ color: config.brand?.colors?.accent || '#DAA520' }}
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
                  className="text-slate-400 hover:opacity-80 transition-opacity"
                  style={{ color: config.brand?.colors?.accent || '#DAA520' }}
                >
                  <Facebook size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 uppercase tracking-wider">Liens rapides</h3>
            <ul className="space-y-2">
              {finalQuickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    onClick={scrollToTop} 
                    className="text-slate-400 hover:opacity-80 transition-opacity"
                    style={{ color: config.brand?.colors?.accent || '#DAA520' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services/Activités */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 uppercase tracking-wider">
              {config.navigation?.links?.find(link => link.path === '/services')?.name || 'Nos activités'}
            </h3>
            <ul className="space-y-2">
              {config.content.services?.slice(0, 4).map((service, index) => (
                <li key={index}>
                  <Link 
                    to="/services" 
                    onClick={scrollToTop} 
                    className="text-slate-400 hover:opacity-80 transition-opacity"
                    style={{ color: config.brand?.colors?.accent || '#DAA520' }}
                  >
                    {service.title}
                  </Link>
                </li>
              )) || [
                <li key="1">
                  <Link 
                    to="/services" 
                    onClick={scrollToTop} 
                    className="text-slate-400 hover:opacity-80 transition-opacity"
                    style={{ color: config.brand?.colors?.accent || '#DAA520' }}
                  >
                    {config.navigation?.links?.find(link => link.path === '/services')?.name || 'Nos activités'}
                  </Link>
                </li>
              ]}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3">
              {contact.address && (
                <li className="flex items-start">
                  <MapPin 
                    className="mr-2 h-5 w-5 flex-shrink-0 mt-0.5" 
                    style={{ color: config.brand?.colors?.accent || '#DAA520' }}
                  />
                  <span className="text-slate-400">
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
                    style={{ color: config.brand?.colors?.accent || '#DAA520' }}
                  />
                  <span className="text-slate-400">{contact.phone}</span>
                </li>
              )}
              {contact.email && (
                <li className="flex items-center">
                  <Mail 
                    className="mr-2 h-5 w-5 flex-shrink-0" 
                    style={{ color: config.brand?.colors?.accent || '#DAA520' }}
                  />
                  <span className="text-slate-400">{contact.email}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="border-t border-slate-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-500 text-sm">
              &copy; {currentYear} {config.brand.name}. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                to="/privacy" 
                onClick={scrollToTop} 
                className="text-slate-500 hover:opacity-80 text-sm transition-opacity"
                style={{ color: config.brand?.colors?.accent || '#DAA520' }}
              >
                Politique de confidentialité
              </Link>
              <Link 
                to="/terms" 
                onClick={scrollToTop} 
                className="text-slate-500 hover:opacity-80 text-sm transition-opacity"
                style={{ color: config.brand?.colors?.accent || '#DAA520' }}
              >
                Conditions d'utilisation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;