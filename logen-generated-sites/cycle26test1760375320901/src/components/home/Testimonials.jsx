import React from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { loadSiteConfig, isFeatureEnabled } from "@/config/config-loader";

const Testimonials = () => {
  const config = loadSiteConfig();
  const testimonials = config.content.testimonials || [];

  // Si pas de témoignages configurés, ne pas afficher la section
  if (!isFeatureEnabled('testimonials') || testimonials.length === 0) {
    return null;
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'fill-current' : ''
        }`}
        style={{ 
          color: index < rating ? (config.brand?.colors?.accent || '#DAA520') : '#d1d5db'
        }}
      />
    ));
  };

  return (
    <section id="testimonials" className="section-testimonials py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Ce que disent nos clients
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card-secondary rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Quote 
                className="w-8 h-8 mb-4 mx-auto" 
                style={{ color: config.brand?.colors?.primary || '#3B82F6' }}
              />
              
              <p className="mb-6 italic opacity-80">
                "{testimonial.text}"
              </p>
              
              {testimonial.rating && (
                <div className="flex justify-center mb-4">
                  {renderStars(testimonial.rating)}
                </div>
              )}
              
              <div className="border-t pt-4" style={{ borderColor: `${config.brand?.colors?.primary || '#3B82F6'}20` }}>
                <p className="font-semibold">
                  {testimonial.name}
                </p>
                <p className="text-sm opacity-70">
                  {testimonial.position}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Message par défaut si pas assez de témoignages */}
        {testimonials.length < 3 && (
          <div className="mt-8 opacity-70">
            <p>D'autres témoignages clients arrivent bientôt...</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;