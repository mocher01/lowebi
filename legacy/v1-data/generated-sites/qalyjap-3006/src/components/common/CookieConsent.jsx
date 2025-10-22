import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CookiePreferences from './CookiePreferences';

/**
 * 🍪 Composant Cookie Consent RGPD - Version minimale réglementaire
 * 
 * Fonctionnalités :
 * - Bannière de consentement cookies
 * - Stockage du choix utilisateur
 * - Conformité RGPD de base
 * - Design adaptatif mobile/desktop
 */

const CookieConsent = ({ config }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Configuration RGPD du site
  const cookieConfig = config?.rgpd?.cookies || {
    enabled: true,
    title: "Utilisation des cookies",
    message: "Ce site utilise des cookies pour améliorer votre expérience de navigation et analyser le trafic. En continuant à utiliser ce site, vous acceptez notre utilisation des cookies.",
    acceptText: "Accepter",
    declineText: "Refuser",
    policyLink: "/mentions-legales",
    policyText: "En savoir plus"
  };

  const siteColors = config?.brand?.colors || {};
  const primaryColor = siteColors.primary || '#8B4513';
  const accentColor = siteColors.accent || '#DAA520';

  useEffect(() => {
    setMounted(true);
    
    // Vérifier si l'utilisateur a déjà fait un choix
    const cookieChoice = localStorage.getItem('cookie-consent');
    
    if (!cookieChoice && cookieConfig.enabled) {
      // Attendre un peu avant d'afficher pour éviter le flash
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else if (cookieChoice === 'custom' || cookieChoice === 'accepted') {
      // Si préférences personnalisées ou tout accepté
      const savedPreferences = localStorage.getItem('cookie-preferences');
      const preferences = savedPreferences ? JSON.parse(savedPreferences) : { necessary: true, analytics: true, functional: true };
      
      if (preferences.analytics && config?.seo?.analytics?.googleAnalytics) {
        // Charger Google Analytics si accepté
        window.gtag = window.gtag || function() { (window.dataLayer = window.dataLayer || []).push(arguments); };
        
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${config.seo.analytics.googleAnalytics}`;
        document.head.appendChild(script);
        
        window.gtag('js', new Date());
        window.gtag('config', config.seo.analytics.googleAnalytics);
        
        console.log('🍪 Cookies analytiques déjà acceptés - Google Analytics chargé');
      }
    } else if (cookieChoice === 'declined') {
      // Si refusé, s'assurer que GA est désactivé
      window['ga-disable-' + config?.seo?.analytics?.googleAnalytics] = true;
    }
  }, [cookieConfig.enabled, config]);

  const handleAccept = () => {
    const allPreferences = {
      necessary: true,
      analytics: true,
      functional: true
    };
    handleSavePreferences(allPreferences);
  };

  const handleSavePreferences = (preferences) => {
    localStorage.setItem('cookie-consent', 'custom');
    localStorage.setItem('cookie-preferences', JSON.stringify(preferences));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
    setShowPreferences(false);
    
    // Gérer Google Analytics selon les préférences
    if (preferences.analytics && config?.seo?.analytics?.googleAnalytics) {
      window.gtag = window.gtag || function() { (window.dataLayer = window.dataLayer || []).push(arguments); };
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
      
      // Charger le script Google Analytics
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${config.seo.analytics.googleAnalytics}`;
      document.head.appendChild(script);
      
      window.gtag('js', new Date());
      window.gtag('config', config.seo.analytics.googleAnalytics);
      
      console.log('🍪 Cookies analytiques acceptés - Google Analytics activé');
    } else if (!preferences.analytics && config?.seo?.analytics?.googleAnalytics) {
      // Désactiver GA si refusé
      window['ga-disable-' + config?.seo?.analytics?.googleAnalytics] = true;
      console.log('🍪 Cookies analytiques refusés');
    }
    
    // Gérer reCAPTCHA selon les préférences
    if (preferences.functional && config?.integrations?.captcha?.enabled) {
      console.log('🍪 Cookies fonctionnels acceptés - reCAPTCHA autorisé');
    }
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setShowBanner(false);
    
    // Désactiver explicitement Google Analytics
    window['ga-disable-' + config?.seo?.analytics?.googleAnalytics] = true;
    
    // Supprimer les cookies existants
    document.cookie.split(";").forEach(function(c) { 
      if (c.includes('_ga') || c.includes('_gid') || c.includes('_gat')) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      }
    });
    
    console.log('🍪 Cookies refusés - Services analytiques désactivés');
  };

  // Ne pas afficher pendant l'hydratation SSR
  if (!mounted || !cookieConfig.enabled) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
          <div className="max-w-6xl mx-auto">
            <div 
              className="bg-white border-2 rounded-lg shadow-2xl p-4 md:p-6"
              style={{ 
                borderColor: primaryColor,
                boxShadow: `0 10px 40px rgba(0,0,0,0.15)`
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Icône et titre */}
                <div className="flex items-center gap-3 mb-2 md:mb-0">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span className="text-white text-sm">🍪</span>
                  </div>
                  <h3 
                    className="font-semibold text-lg"
                    style={{ color: primaryColor }}
                  >
                    {cookieConfig.title}
                  </h3>
                </div>

                {/* Message */}
                <div className="flex-1">
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    {cookieConfig.message}
                    {' '}
                    <button 
                      onClick={() => setShowPreferences(true)}
                      className="underline hover:no-underline font-medium"
                      style={{ color: accentColor }}
                    >
                      {cookieConfig.policyText}
                    </button>
                  </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 flex-shrink-0">
                  <button
                    onClick={handleDecline}
                    className="px-4 py-2 text-sm font-medium border-2 rounded-lg transition-colors hover:bg-gray-50"
                    style={{ 
                      borderColor: '#d1d5db',
                      color: '#6b7280'
                    }}
                  >
                    {cookieConfig.declineText}
                  </button>
                  
                  <button
                    onClick={handleAccept}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:transform hover:scale-105"
                    style={{ 
                      backgroundColor: primaryColor,
                      boxShadow: `0 2px 8px ${primaryColor}40`
                    }}
                  >
                    {cookieConfig.acceptText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Modal de préférences */}
    <CookiePreferences 
      config={config}
      isOpen={showPreferences}
      onClose={() => setShowPreferences(false)}
      onSave={handleSavePreferences}
    />
    </>
  );
};

export default CookieConsent;