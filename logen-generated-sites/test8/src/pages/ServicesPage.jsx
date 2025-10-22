import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { loadSiteConfig } from "@/config/config-loader";

const ServicesPage = () => {
  const config = loadSiteConfig();
  const navigate = useNavigate();
  
  // ✅ v1.0.8: Configuration PURE - Aucun hardcode, tout de la config JSON
  const services = config.content.services;
  const pageName = config.navigation?.links?.find(link => link.path === '/services')?.name;
  const servicesPage = config.content.servicesPage;
  const servicesSection = config.sections?.services;
  const colors = config.brand?.colors;
  
  // 🎨 v1.1.1.5.3: Design 100% configurable depuis la nouvelle section design
  const designConfig = config.design?.pageHeaders || {};
  const textColors = config.design?.textColors || {};

  // ✅ v1.0.8: Couleurs PURE - Directement de la config, pas de fallback
  const sectionBg = servicesSection.background;
  const sectionTextColor = servicesSection.textColor;
  const primaryColor = colors.primary;
  const accentColor = colors.accent;

  // 🎨 Header style configurable avec pageHeaders
  const pageHeadersConfig = designConfig.background || {};
  const headerBackgroundStyle = {
    background: pageHeadersConfig.type === 'gradient' 
      ? `linear-gradient(135deg, ${pageHeadersConfig.primary?.color || primaryColor}${Math.round((pageHeadersConfig.primary?.opacity || 0.12) * 255).toString(16).padStart(2, '0')}, ${pageHeadersConfig.accent?.color || accentColor}${Math.round((pageHeadersConfig.accent?.opacity || 0.08) * 255).toString(16).padStart(2, '0')})`
      : pageHeadersConfig.color || primaryColor
  };
  
  const headerTitleColor = designConfig.title?.color || '#ffffff';
  const headerSubtitleColor = designConfig.subtitle?.color || '#f3f4f6';

  // ✅ v1.0.8: FIX Navigation CTA - Compatibilité Firefox améliorée
  const handleCTANavigation = (e) => {
    e?.preventDefault?.();
    console.log('🎯 CTA Navigation vers /contact');
    
    // Force scroll to top puis navigation pour compatibilité Firefox
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    setTimeout(() => {
      navigate('/contact', { replace: false });
    }, 10);
  };

  // 🎯 v1.1.1.5.4: Navigation vers pages détail services CORRIGÉE
  const handleServiceNavigation = (e, service) => {
    e.preventDefault();
    const slug = service.slug || service.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    console.log(`🎯 Navigation vers /service/${slug}`, service.title);
    navigate(`/service/${slug}`);
  };

  // 🎯 v1.1.1.5.2: Gestion des images spécifiques par service
  const getServiceImage = (service, index) => {
    // 🔧 v1.1.1.5.2: PRIORITÉ - Image spécifique du service
    if (service.image) {
      return `/assets/${service.image}`;
    }
    
    // 🔧 v1.1.1.5.2: Fallback avec nommage spécifique services
    return `/assets/services/service-${index + 1}.jpg`;
  };

  // 🎯 v1.1.1.5.4: Compatibilité ARRAY et OBJECT
  const servicesArray = React.useMemo(() => {
    if (Array.isArray(services)) {
      return services;
    }
    
    // Nouveau format object : conversion en array
    if (services && typeof services === 'object') {
      return Object.values(services).map(service => ({
        ...service,
        description: service.shortDescription || service.description
      }));
    }
    
    return [];
  }, [services]);

  // ✅ v1.0.8: Validation configuration requise
  if (!services || !pageName || !servicesPage || !servicesSection || !colors) {
    console.error('❌ Configuration manquante pour ServicesPage');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Configuration Manquante</h2>
          <p className="text-red-600">
            ServicesPage nécessite une configuration complète dans site-config.json
          </p>
          <ul className="mt-4 text-left text-red-600">
            {!services && <li>• content.services</li>}
            {!pageName && <li>• navigation.links (path: /services)</li>}
            {!servicesPage && <li>• content.servicesPage</li>}
            {!servicesSection && <li>• sections.services</li>}
            {!colors && <li>• brand.colors</li>}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{config.brand.name} | {pageName}</title>
        <meta name="description" content={`Découvrez toutes les activités proposées par ${config.brand.name}.`} />
        <link rel="canonical" href={`https://${config.meta.domain}/services`} />
      </Helmet>

      {/* 🎨 v1.1.1.5.3: Header 100% CONFIGURABLE - fond, couleurs, tailles */}
      <section className="page-header" style={headerBackgroundStyle}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className={`${designConfig.title?.size || 'text-3xl md:text-4xl'} ${designConfig.title?.weight || 'font-bold'} ${designConfig.title?.margin || 'mb-4'}`}
              style={{ color: headerTitleColor }}
            >
              {pageName}
            </h1>
            
            <p 
              className={`${designConfig.subtitle?.size || 'text-xl'} ${designConfig.subtitle?.weight || 'font-normal'} max-w-2xl mx-auto`}
              style={{ color: headerSubtitleColor }}
            >
              {servicesPage.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 🔧 v1.1.1.5.2: Section services avec espacement optimisé */}
      <section 
        className="py-8"
        style={{
          backgroundColor: sectionBg,
          color: sectionTextColor
        }}
      >
        <div className="container">
          {/* 🎯 v1.1.1.5.1: Grid spécifique 3 colonnes */}
          <div className="services-grid">
            {servicesArray.map((service, index) => (
              <motion.div
                key={service.slug || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover:-translate-y-1"
                style={{ backgroundColor: config.sections?.services?.cardBackground || '#ffffff' }}
              >
                {/* 🖼️ v1.1.1.5.2: Image avec gestion spécifique par service */}
                <div className="mb-6">
                  <img
                    src={getServiceImage(service, index)}
                    alt={service.title}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      // Fallback en cas d'erreur d'image
                      e.target.src = `/assets/${config.meta.siteId}-placeholder.jpg`;
                      e.target.onerror = null;
                    }}
                  />
                </div>

                <h3 
                  className="text-xl font-semibold mb-3"
                  style={{ color: primaryColor }}
                >
                  {service.title}
                </h3>
                
                <p 
                  className="mb-4 line-clamp-3"
                  style={{ color: textColors.secondary || sectionTextColor }}
                >
                  {service.description}
                </p>
                
                {service.features && service.features.length > 0 && (
                  <div className="mb-6">
                    <h4 
                      className="font-semibold mb-3"
                      style={{ color: textColors.primary || sectionTextColor }}
                    >
                      Points clés :
                    </h4>
                    <ul className="space-y-2">
                      {service.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span 
                            className="text-sm"
                            style={{ color: textColors.secondary || sectionTextColor }}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* 🔗 v1.1.1.5.4: Bouton "En savoir plus" vers page détail CORRIGÉ */}
                <div className="mt-6">
                  <Button 
                    onClick={(e) => handleServiceNavigation(e, service)}
                    variant="outline"
                    className="w-full"
                    style={{ 
                      borderColor: primaryColor,
                      color: primaryColor
                    }}
                  >
                    {config.content.servicesSection?.learnMoreText || "En savoir plus"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ v1.0.8: CTA Section avec config pure + navigation corrigée */}
      <section 
        className="py-20"
        style={{ backgroundColor: config.sections?.cta?.background || '#f8fafc' }}
      >
        <div className="container">
          <div className="text-center">
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6"
              style={{ color: textColors.primary || config.sections?.cta?.textColor || '#374151' }}
            >
              {servicesPage.ctaTitle}
            </h2>
            <p 
              className="text-xl mb-8 max-w-2xl mx-auto"
              style={{ color: textColors.secondary || config.sections?.cta?.textColor || '#6B7280' }}
            >
              {servicesPage.ctaDescription}
            </p>
            {/* ✅ v1.0.8: Bouton CTA avec gradient Qalyarab */}
            <Button 
              onClick={handleCTANavigation}
              className="text-white px-8 py-4 text-lg"
              style={{ 
                background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`
              }}
            >
              {servicesPage.ctaButton}
              <ArrowRight className="ml-2 w-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServicesPage;