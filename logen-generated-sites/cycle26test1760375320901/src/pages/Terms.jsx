import React from "react";
import { Helmet } from "react-helmet";
import { loadSiteConfig } from "@/config/config-loader";

const Terms = () => {
  const config = loadSiteConfig();
  
  return (
    <>
      <Helmet>
        <title>Conditions d'utilisation | {config.brand.name}</title>
        <meta name="description" content={`Conditions d'utilisation de ${config.brand.name}`} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">
            Conditions d'utilisation
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Acceptation des conditions</h2>
              <p className="text-gray-600 leading-relaxed">
                En accédant et en utilisant le site web de {config.brand.name}, 
                vous acceptez d'être lié par ces conditions d'utilisation.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Utilisation du site</h2>
              <p className="text-gray-600 leading-relaxed">
                Vous vous engagez à utiliser ce site conformément aux lois applicables
                et à ne pas l'utiliser à des fins illégales ou non autorisées.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Propriété intellectuelle</h2>
              <p className="text-gray-600 leading-relaxed">
                Le contenu de ce site, y compris les textes, images, logos et autres matériaux,
                est protégé par les droits d'auteur et autres droits de propriété intellectuelle.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                Pour toute question concernant ces conditions d'utilisation, 
                veuillez nous contacter à : {config.contact?.email || 'contact@example.com'}
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;