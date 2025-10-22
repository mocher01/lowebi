import React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle, Users, Target, Lightbulb, Award, Heart, 
  PenTool, BookOpen, Star, Calendar, Clock, Smile
} from "lucide-react";
import { loadSiteConfig } from "@/config/config-loader";

// 🎨 NOUVEAUTÉ : Icônes étendues pour les stats
const statsIconMap = {
  "users": <Users className="h-8 w-8 mx-auto mb-2" />,
  "clients": <Users className="h-8 w-8 mx-auto mb-2" />,
  "target": <Target className="h-8 w-8 mx-auto mb-2" />,
  "projects": <Target className="h-8 w-8 mx-auto mb-2" />,
  "lightbulb": <Lightbulb className="h-8 w-8 mx-auto mb-2" />,
  "experience": <Lightbulb className="h-8 w-8 mx-auto mb-2" />,
  "check-circle": <CheckCircle className="h-8 w-8 mx-auto mb-2" />,
  "satisfaction": <CheckCircle className="h-8 w-8 mx-auto mb-2" />,
  "award": <Award className="h-8 w-8 mx-auto mb-2" />,
  "certificate": <Award className="h-8 w-8 mx-auto mb-2" />,
  "heart": <Heart className="h-8 w-8 mx-auto mb-2" />,
  "passion": <Heart className="h-8 w-8 mx-auto mb-2" />,
  "pen-tool": <PenTool className="h-8 w-8 mx-auto mb-2" />,
  "calligraphy": <PenTool className="h-8 w-8 mx-auto mb-2" />,
  "book-open": <BookOpen className="h-8 w-8 mx-auto mb-2" />,
  "courses": <BookOpen className="h-8 w-8 mx-auto mb-2" />,
  "star": <Star className="h-8 w-8 mx-auto mb-2" />,
  "quality": <Star className="h-8 w-8 mx-auto mb-2" />,
  "calendar": <Calendar className="h-8 w-8 mx-auto mb-2" />,
  "years": <Calendar className="h-8 w-8 mx-auto mb-2" />,
  "clock": <Clock className="h-8 w-8 mx-auto mb-2" />,
  "hours": <Clock className="h-8 w-8 mx-auto mb-2" />,
  "smile": <Smile className="h-8 w-8 mx-auto mb-2" />,
  "happiness": <Smile className="h-8 w-8 mx-auto mb-2" />,
  "default": <Star className="h-8 w-8 mx-auto mb-2" />
};

const About = () => {
  const config = loadSiteConfig();
  const about = config.content.about || {};
  const values = about.values || [];

  // 🎨 NOUVEAUTÉ : Valeurs par défaut plus génériques
  const getDefaultValues = () => {
    const brandName = config.brand?.name || 'Notre équipe';
    const activityName = config.navigation?.links?.find(link => 
      link.path === '/services' || link.path === '/activities'
    )?.name?.toLowerCase() || 'services';
    
    return [
      {
        title: "Passion",
        description: `Nous sommes passionnés par nos ${activityName} et nous nous efforçons de transmettre cette passion à nos clients.`
      },
      {
        title: "Qualité", 
        description: `Chaque prestation est réalisée avec le plus haut niveau de qualité et d'attention aux détails.`
      },
      {
        title: "Accompagnement",
        description: `Nous accompagnons chacun de nos clients dans leur parcours pour atteindre leurs objectifs personnels.`
      }
    ];
  };

  const displayValues = values.length > 0 ? values : getDefaultValues();

  // 🎨 NOUVEAUTÉ : Stats configurables avec valeurs par défaut intelligentes
  const getDefaultStats = () => {
    const activityName = config.navigation?.links?.find(link => 
      link.path === '/services' || link.path === '/activities'
    )?.name?.toLowerCase() || 'services';
    
    // Détecter le type d'activité pour des stats appropriées
    const brandDescription = (config.brand?.description || '').toLowerCase();
    const isEducational = brandDescription.includes('cours') || brandDescription.includes('formation') || 
                          brandDescription.includes('apprentissage') || activityName.includes('cours');
    
    if (isEducational) {
      return [
        { icon: "users", value: "50+", label: "Élèves formés" },
        { icon: "courses", value: "100+", label: "Heures de cours" },
        { icon: "years", value: "3+", label: "Années d'expérience" },
        { icon: "satisfaction", value: "95%", label: "Satisfaction élèves" }
      ];
    } else {
      return [
        { icon: "users", value: "30+", label: "Clients satisfaits" },
        { icon: "projects", value: "80+", label: `${activityName} réalisées` },
        { icon: "years", value: "2+", label: "Années d'expérience" },
        { icon: "quality", value: "100%", label: "Satisfaction clients" }
      ];
    }
  };

  const stats = about.stats || getDefaultStats();

  return (
    <section className="section-about py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Contenu texte */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {about.title || `À propos de ${config.brand.name}`}
            </h2>
            <h3 className="text-xl mb-4 text-primary">
              {about.subtitle || "Notre mission"}
            </h3>
            <p className="text-lg leading-relaxed mb-8 opacity-80">
              {about.description || `${config.brand.name} vous accompagne avec passion et expertise pour vous offrir la meilleure expérience possible.`}
            </p>

            {/* Valeurs */}
            <div className="space-y-4">
              {displayValues.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-3"
                >
                  <CheckCircle 
                    className="h-6 w-6 mt-1 flex-shrink-0 text-primary"
                  />
                  <div>
                    <h4 className="font-semibold">{value.title}</h4>
                    <p className="opacity-80">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats configurables */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white bg-opacity-50 p-6 rounded-lg text-center shadow-lg">
                  <div className="text-primary">
                    {statsIconMap[stat.icon] || statsIconMap.default}
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;