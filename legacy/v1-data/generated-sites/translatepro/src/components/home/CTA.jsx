import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { loadSiteConfig } from "@/config/config-loader";

const CTA = () => {
  const config = loadSiteConfig();
  const ctaConfig = config.navigation?.cta || {
    text: "Contactez-nous",
    path: "/contact"
  };

  // 🎨 NOUVEAUTÉ : CTA adapté intelligemment au type d'activité
  const getSmartCTA = () => {
    const serviceLink = config.navigation?.links?.find(link => 
      link.path === '/services' || link.path === '/activities'
    );
    const serviceName = serviceLink?.name?.toLowerCase() || 'services';
    const servicePath = serviceLink?.path || '/services';
    
    // Détection du type d'activité
    const brandDescription = (config.brand?.description || '').toLowerCase();
    const isEducational = brandDescription.includes('cours') || brandDescription.includes('formation') || 
                          brandDescription.includes('apprentissage') || serviceName.includes('cours') ||
                          serviceName.includes('formation') || serviceName.includes('ateliers');
    
    const isCreative = brandDescription.includes('calligraphie') || brandDescription.includes('art') ||
                      brandDescription.includes('créatif') || serviceName.includes('créatif') ||
                      serviceName.includes('art');
    
    if (isEducational || isCreative) {
      return {
        title: "Prêt à commencer votre apprentissage ?",
        description: `Contactez-nous dès aujourd'hui pour en savoir plus sur nos ${serviceName} et découvrir comment nous pouvons vous accompagner dans votre parcours.`,
        secondaryButton: `Découvrir nos ${serviceName}`,
        secondaryPath: servicePath
      };
    } else {
      return {
        title: "Prêt à commencer votre projet ?",
        description: "Contactez-nous dès aujourd'hui pour discuter de votre projet et découvrir comment nous pouvons vous aider à atteindre vos objectifs.",
        secondaryButton: `Découvrir nos ${serviceName}`,
        secondaryPath: servicePath
      };
    }
  };

  // 🎨 CTA section avec fallback intelligent
  const ctaSection = config.content?.cta || getSmartCTA();

  // 🎯 NOUVEAUTÉ : Scroll vers le haut pour le bouton secondaire aussi
  const handleSecondaryClick = (e) => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  return (
    <section className="section-cta py-20">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {ctaSection.title}
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">
            {ctaSection.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to={ctaConfig.path}>
              <Button 
                className="btn-primary text-white px-8 py-6 text-lg font-medium rounded-lg transition-all hover:opacity-90"
              >
                {ctaConfig.text}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link to={ctaSection.secondaryPath || "/services"} onClick={handleSecondaryClick}>
              <Button 
                variant="outline"
                className="btn-secondary px-8 py-6 text-lg font-medium rounded-lg transition-all hover:opacity-90"
              >
                {ctaSection.secondaryButton}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;