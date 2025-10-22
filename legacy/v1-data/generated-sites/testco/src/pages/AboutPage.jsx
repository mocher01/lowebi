import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Users, Target, Award, TrendingUp } from "lucide-react";
import { loadSiteConfig } from "@/config/config-loader";
import Navbar from "@/components/layout/Navbar";

const AboutPage = () => {
  const config = loadSiteConfig();
  const about = config.content.about || {};
  const values = about.values || [];

  // 🎯 Configuration couleurs
  const aboutSection = config.sections?.about || {};
  const colors = config.brand?.colors || {};
  
  const sectionBg = aboutSection.background || '#ffffff';
  const sectionTextColor = aboutSection.textColor || '#1e293b';
  const primaryColor = colors.primary || '#3B82F6';
  const accentColor = colors.accent || '#60A5FA';

  // 🎨 NOUVEAUTÉ : Section CTA About configurable
  const aboutCta = config.content?.aboutCta || {
    title: "Travaillons ensemble",
    description: `Vous souhaitez en savoir plus sur ${config.brand.name} ? Contactez-nous pour discuter de votre projet.`,
    buttonText: "Nous contacter"
  };

  const defaultStats = [
    { icon: <Users className="w-8 h-8" />, number: "100+", label: "Clients satisfaits" },
    { icon: <Target className="w-8 h-8" />, number: "200+", label: "Projets réalisés" },
    { icon: <Award className="w-8 h-8" />, number: "5+", label: "Années d'expérience" },
    { icon: <TrendingUp className="w-8 h-8" />, number: "98%", label: "Taux de satisfaction" }
  ];

  return (
    <>
      <Helmet>
        <title>{config.brand.name} | À propos</title>
        <meta name="description" content={about.description || `Découvrez l'histoire et les valeurs de ${config.brand.name}.`} />
        <link rel="canonical" href={`https://${config.meta.domain}/about`} />
      </Helmet>

      {/* 🎯 NAVBAR OBLIGATOIRE */}
      <Navbar />

      {/* 🎯 CLEAN ARCHITECTURE v1.1: About Header avec classes CSS EXACTES */}
      <section className="about-header">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1>
                {about.title || `À propos de ${config.brand.name}`}
              </h1>
              
              <h2 
                className="text-xl font-medium mb-6"
                style={{ color: primaryColor }}
              >
                {about.subtitle || config.brand.slogan}
              </h2>
              
              <p className="subtitle">
                {about.description || 
                 `${config.brand.name} est dédié à l'excellence et à l'innovation. 
                  Nous accompagnons nos clients avec passion et expertise, 
                  en proposant des solutions sur mesure adaptées à leurs besoins spécifiques.`}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                {defaultStats.map((stat, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-lg text-center">
                    <div className="mb-2 flex justify-center" style={{ color: primaryColor }}>
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section valeurs */}
      {values.length > 0 && (
        <section 
          className="py-20"
          style={{ backgroundColor: '#f8fafc' }}
        >
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {config.content?.valuesSection?.title || "Nos Valeurs"}
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {config.content?.valuesSection?.description || "Les principes qui guident notre travail et nos relations avec nos clients."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                >
                  <h3 
                    className="text-xl font-bold mb-3"
                    style={{ color: primaryColor }}
                  >
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section 
        className="py-16"
        style={{
          backgroundColor: sectionBg,
          color: sectionTextColor
        }}
      >
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {aboutCta.title}
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {aboutCta.description}
          </p>
          <a 
            href="/contact" 
            className="inline-flex items-center px-8 py-4 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
            style={{ 
              background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`
            }}
          >
            {aboutCta.buttonText}
          </a>
        </div>
      </section>
    </>
  );
};

export default AboutPage;