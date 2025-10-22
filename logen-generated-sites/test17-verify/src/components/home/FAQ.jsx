import React from "react";
import { motion } from "framer-motion";
import { loadSiteConfig, isFeatureEnabled } from "@/config/config-loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const config = loadSiteConfig();
  const faqs = config.content.faq || [];

  // Si pas de FAQ configurée, ne pas afficher la section
  if (!isFeatureEnabled('faq') || faqs.length === 0) {
    return null;
  }

  return (
    <section id="faq" className="section-faq py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Questions fréquemment posées
          </h2>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Trouvez les réponses aux questions les plus courantes sur nos services
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger 
                  className="text-left text-lg font-medium hover:no-underline"
                  style={{ color: config.brand?.colors?.primary || '#1e293b' }}
                >
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base opacity-80 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-lg opacity-80 mb-6">
            Vous avez d'autres questions ?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
            style={{ 
              backgroundColor: config.brand?.colors?.primary || '#3B82F6',
              color: '#ffffff'
            }}
          >
            Contactez-nous
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;