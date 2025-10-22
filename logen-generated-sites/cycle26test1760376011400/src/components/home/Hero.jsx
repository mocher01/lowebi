import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { loadSiteConfig } from "@/config/config-loader";

const Hero = () => {
  const config = loadSiteConfig();
  const navigate = useNavigate();

  // 🔧 FIX: Navigation simple avec React Router
  const handleServiceNavigation = () => {
    navigate('/services');
  };

  const handleContactNavigation = () => {
    navigate('/contact');
  };

  // 🎨 AMÉLIORATION: Textes adaptatifs basés sur la navigation
  const getServiceLinkText = () => {
    const serviceLink = config.navigation?.links?.find(link => 
      link.path === '/services' || link.path === '/activities'
    );
    return serviceLink?.name ? `Découvrir nos ${serviceLink.name.toLowerCase()}` : "Voir nos services";
  };

  return (
    <>
      <Helmet>
        <link rel="canonical" href={`https://${config.meta.domain}/`} />
      </Helmet>
      
      {/* 🔧 ARCHITECTURE CSS PURE v1.1: Utilise uniquement les classes CSS */}
      <section id="hero" className="hero-section">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* 🔧 ARCHITECTURE CSS PURE: Classes CSS automatiques depuis layout-variables.css */}
              <h1>
                {config.content.hero.title}
                {config.content.hero.subtitle && (
                  <span className="gradient-text"> {config.content.hero.subtitle}</span>
                )}
              </h1>
              
              <p className="subtitle">
                {config.content.hero.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* 🔧 ARCHITECTURE CSS PURE: Bouton 1 - Utilise classes CSS */}
                <Button 
                  onClick={handleServiceNavigation}
                  className="btn-primary text-white px-8 py-6 text-lg font-medium rounded-lg transition-all hover:opacity-90"
                >
                  {config.content.hero.cta?.primary || getServiceLinkText()}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                {/* 🔧 ARCHITECTURE CSS PURE: Bouton 2 - Utilise classes CSS */}
                <Button 
                  onClick={handleContactNavigation}
                  className="btn-secondary px-8 py-6 text-lg font-medium rounded-lg transition-all hover:opacity-90"
                  variant="outline"
                >
                  {config.content.hero.cta?.secondary || "Nous contacter"}
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 animate-float">
                <img
                  alt={config.brand.name}
                  className="rounded-xl shadow-2xl"
                  src={config.content.hero.image ? `/assets/${config.content.hero.image}` : "/images/hero.webp"}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;