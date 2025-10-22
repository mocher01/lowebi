import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Euro, 
  CheckCircle, 
  Star,
  Calendar,
  Award,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadSiteConfig } from "@/config/config-loader";

const ServiceDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const config = loadSiteConfig();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const colors = config.brand?.colors;
  const primaryColor = colors?.primary || '#8B4513';
  const accentColor = colors?.accent || '#DAA520';
  
  // Récupération du service depuis la config (compatible array ET object)
  let service = null;
  if (Array.isArray(config.content?.services)) {
    service = config.content.services.find(s => s.slug === slug);
  } else if (config.content?.services && typeof config.content.services === 'object') {
    service = config.content.services[slug];
  }
  
  const handleContactNavigation = () => {
    navigate('/contact');
  };

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
            Service introuvable
          </h1>
          <p className="text-gray-600 mb-6">
            Le service "{slug}" n'existe pas ou a été déplacé.
          </p>
          <Link to="/services">
            <Button 
              variant="outline"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux services
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{config.brand.name} | {service.title}</title>
        <meta name="description" content={service.description} />
        <link rel="canonical" href={`https://${config.meta.domain}/service/${slug}`} />
      </Helmet>

      {/* 🔗 Breadcrumb Navigation */}
      <div className="bg-gray-50 py-4 border-b">
        <div className="container">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-600 hover:text-gray-900">Accueil</Link>
            <span className="text-gray-400">/</span>
            <Link to="/services" className="text-gray-600 hover:text-gray-900">{config.navigation?.links?.find(link => link.path === '/services')?.name || 'Services'}</Link>
            <span className="text-gray-400">/</span>
            <span style={{ color: primaryColor }}>{service.title}</span>
          </nav>
        </div>
      </div>

      {/* 🎨 Hero Section - Impactant */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div 
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4"
                style={{ 
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor 
                }}
              >
                <Award className="w-4 h-4 mr-2" />
                {config.navigation?.links?.find(link => link.path === '/services')?.name?.slice(0, -1) || 'Service'} populaire
              </div>

              <h1 
                className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
                style={{ color: primaryColor }}
              >
                {service.title}
              </h1>
              
              <p className="text-xl text-gray-600 mb-4 leading-relaxed">
                Découvrez notre approche unique
              </p>
              
              <p className="text-gray-700 mb-8 text-lg leading-relaxed">
                {service.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleContactNavigation}
                  className="text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` 
                  }}
                >
                  Réserver maintenant
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                
                <Link to="/services">
                  <Button 
                    variant="outline"
                    className="px-8 py-4 text-lg"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voir tous nos {config.navigation?.links?.find(link => link.path === '/services')?.name?.toLowerCase() || 'services'}
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="order-1 lg:order-2"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={`/assets/${service.image}`}
                  alt={service.title}
                  className="w-full h-64 lg:h-80 object-cover"
                  onError={(e) => {
                    e.target.src = `/assets/${config.meta.siteId}-placeholder.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 📋 Main Content */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Main Content - 2/3 */}
            <div className="lg:col-span-2">
              
              {/* Description détaillée */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-12"
              >
                <h2 className="text-3xl font-bold mb-6" style={{ color: primaryColor }}>
                  Pourquoi choisir ce {config.navigation?.links?.find(link => link.path === '/services')?.name?.toLowerCase().slice(0, -1) || 'service'} ?
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  {service.description}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Notre approche personnalisée vous garantit une progression optimale dans un environnement 
                  bienveillant et professionnel. Rejoignez une communauté passionnée et découvrez 
                  tout votre potentiel artistique.
                </p>
              </motion.div>

              {/* Points clés */}
              {service.features && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-12"
                >
                  <h2 className="text-3xl font-bold mb-8" style={{ color: primaryColor }}>
                    Ce qui est inclus
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {service.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start">
                          <div 
                            className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center mr-4"
                            style={{ backgroundColor: `${primaryColor}15` }}
                          >
                            <CheckCircle 
                              className="w-6 h-6"
                              style={{ color: primaryColor }}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg mb-2" style={{ color: primaryColor }}>
                              Inclus
                            </h3>
                            <p className="text-gray-700">
                              {feature}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Témoignage fictif */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-12"
              >
                <h2 className="text-3xl font-bold mb-8" style={{ color: primaryColor }}>
                  Témoignage d'élève
                </h2>
                <div className="p-6 bg-white border-2 border-gray-100 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className="w-4 h-4 fill-current"
                        style={{ color: accentColor }}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic leading-relaxed">
                    "Une expérience transformatrice ! L'enseignement est de qualité exceptionnelle 
                    et l'ambiance très chaleureuse. Je recommande vivement ce {config.navigation?.links?.find(link => link.path === '/services')?.name?.toLowerCase().slice(0, -1) || 'service'} à tous ceux 
                    qui souhaitent se découvrir une nouvelle passion."
                  </p>
                  <div>
                    <p className="font-semibold" style={{ color: primaryColor }}>
                      Marie L.
                    </p>
                    <p className="text-sm text-gray-600">
                      Élève depuis 6 mois
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar - 1/3 Sticky */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-lg"
                >
                  <h3 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
                    Informations pratiques
                  </h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-3" style={{ color: primaryColor }} />
                      <span className="text-gray-700">Durée flexible selon niveau</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-3" style={{ color: primaryColor }} />
                      <span className="text-gray-700">Cours individuels ou collectifs</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3" style={{ color: primaryColor }} />
                      <span className="text-gray-700">Planning flexible</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="w-5 h-5 mr-3" style={{ color: primaryColor }} />
                      <span className="text-gray-700">Certificat inclus</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <h4 className="font-semibold mb-3" style={{ color: primaryColor }}>
                      Tarifs
                    </h4>
                    <p className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
                      À partir de 50€
                    </p>
                    <p className="text-sm text-gray-600">
                      Prix dégressif selon formule choisie
                    </p>
                  </div>

                  <Button
                    onClick={handleContactNavigation}
                    className="w-full text-white py-3 font-semibold shadow-lg hover:shadow-xl transition-all"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` 
                    }}
                  >
                    Réserver maintenant
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Premier cours d'essai offert
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 CTA Final */}
      <section 
        className="py-20"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <div className="container text-center">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-6"
            style={{ color: primaryColor }}
          >
            {config.content?.serviceDetail?.ctaTitle || "Prêt à démarrer votre projet ?"}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-600">
            {config.content?.serviceDetail?.ctaDescription || "Contactez-nous dès aujourd'hui pour discuter de vos besoins et obtenir un devis personnalisé."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleContactNavigation}
              className="text-white px-8 py-4 text-lg font-semibold"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` 
              }}
            >
              Réserver mon cours d'essai
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Link to="/services">
              <Button 
                variant="outline"
                className="px-8 py-4 text-lg"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Voir tous nos {config.navigation?.links?.find(link => link.path === '/services')?.name?.toLowerCase() || 'services'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServiceDetail;