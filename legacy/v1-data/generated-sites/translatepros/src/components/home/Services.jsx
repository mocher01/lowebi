import React from "react";
import { motion } from "framer-motion";
import { 
  Zap, Code, Brain, ArrowRight, Database, Workflow,
  PenTool, BookOpen, Users, Award, Palette, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { loadSiteConfig } from "@/config/config-loader";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// 🎨 NOUVEAUTÉ : Icônes étendues incluant celles pour calligraphie/arts
const iconMap = {
  // Icônes génériques (legacy)
  "workflow": <Workflow className="h-10 w-10" />,
  "code": <Code className="h-10 w-10" />,
  "brain": <Brain className="h-10 w-10" />,
  "ai-brain": <Brain className="h-10 w-10" />,
  "digital-transformation": <Zap className="h-10 w-10" />,
  "strategy": <Database className="h-10 w-10" />,
  
  // 🎨 Icônes pour calligraphie et arts créatifs
  "pen-tool": <PenTool className="h-10 w-10" />,
  "calligraphy": <PenTool className="h-10 w-10" />,
  "writing": <PenTool className="h-10 w-10" />,
  "book-open": <BookOpen className="h-10 w-10" />,
  "education": <BookOpen className="h-10 w-10" />,
  "learning": <BookOpen className="h-10 w-10" />,
  "users": <Users className="h-10 w-10" />,
  "group": <Users className="h-10 w-10" />,
  "team": <Users className="h-10 w-10" />,
  "award": <Award className="h-10 w-10" />,
  "certificate": <Award className="h-10 w-10" />,
  "achievement": <Award className="h-10 w-10" />,
  "palette": <Palette className="h-10 w-10" />,
  "art": <Palette className="h-10 w-10" />,
  "creative": <Palette className="h-10 w-10" />,
  "heart": <Heart className="h-10 w-10" />,
  "passion": <Heart className="h-10 w-10" />,
  "love": <Heart className="h-10 w-10" />,
  
  // Fallback
  "default": <PenTool className="h-10 w-10" />
};

// 🎨 Suggestions d'icônes par type d'activité si non configuré
const getSmartIcon = (service) => {
  if (service.icon && iconMap[service.icon]) {
    return iconMap[service.icon];
  }
  
  // Auto-détection basée sur le titre/description
  const text = (service.title + ' ' + service.description).toLowerCase();
  
  if (text.includes('calligraphie') || text.includes('écriture') || text.includes('plume')) {
    return iconMap["pen-tool"];
  }
  if (text.includes('cours') || text.includes('formation') || text.includes('apprentissage')) {
    return iconMap["book-open"];
  }
  if (text.includes('atelier') || text.includes('créatif') || text.includes('art')) {
    return iconMap["palette"];
  }
  if (text.includes('professionnel') || text.includes('certificat') || text.includes('diplôme')) {
    return iconMap["award"];
  }
  if (text.includes('groupe') || text.includes('collectif') || text.includes('équipe')) {
    return iconMap["users"];
  }
  
  return iconMap["default"];
};

const Services = () => {
  const config = loadSiteConfig();
  const services = config.content.services || [];

  // 🎯 Textes configurables
  const sectionTitle = config.navigation?.links?.find(link => link.path === '/services')?.name || 'Nos services';
  const viewAllText = config.content?.servicesSection?.viewAllText || `Voir toutes nos ${sectionTitle.toLowerCase()}`;
  const learnMoreText = config.content?.servicesSection?.learnMoreText || "En savoir plus";

  // 🎯 NOUVEAUTÉ : Scroll vers le haut au clic
  const handleServiceClick = (e) => {
    // Laisser le routeur naviguer d'abord
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  return (
    <>
      <Helmet>
          <link rel="canonical" href={`https://${config.meta.domain}/services`} />
      </Helmet>
      <section className="section-services py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            {sectionTitle}
          </h2>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                variants={item}
                className="service-card group bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="mb-6 text-primary">
                  {getSmartIcon(service)}
                </div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="opacity-80 mb-4">{service.description}</p>
                
                {service.features && service.features.length > 0 && (
                  <ul className="text-sm opacity-70 mb-4 text-left">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="mb-1">• {feature}</li>
                    ))}
                  </ul>
                )}
                
                <Link 
                  to="/services" 
                  onClick={handleServiceClick}
                  className="inline-flex items-center font-medium group-hover:translate-x-1 transition-transform text-primary"
                >
                  <span>{learnMoreText}</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-16 text-center">
            <Link to="/services" onClick={handleServiceClick}>
              <Button 
                className="btn-primary text-white px-8 py-6 text-lg font-medium rounded-lg transition-all hover:opacity-90"
              >
                {viewAllText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Services;