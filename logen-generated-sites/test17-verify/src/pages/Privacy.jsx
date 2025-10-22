import React from "react";
import { Helmet } from "react-helmet";
import { loadSiteConfig } from "@/config/config-loader";

const Privacy = () => {
  const config = loadSiteConfig();
  
  return (
    <>
      <Helmet>
        <title>Politique de confidentialité | {config.brand.name}</title>
        <meta name="description" content={`Politique de confidentialité de ${config.brand.name}`} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">
            Politique de confidentialité
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Collecte des informations</h2>
              <p className="text-gray-600 leading-relaxed">
                {config.brand.name} collecte des informations lorsque vous utilisez notre site web,
                nous contactez via nos formulaires, ou interagissez avec nos services.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Utilisation des informations</h2>
              <p className="text-gray-600 leading-relaxed">
                Nous utilisons les informations collectées pour améliorer nos services,
                répondre à vos demandes et vous fournir des informations sur nos produits et services.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Protection des données</h2>
              <p className="text-gray-600 leading-relaxed">
                Nous mettons en place des mesures de sécurité appropriées pour protéger vos informations
                personnelles contre l'accès non autorisé, la modification, la divulgation ou la destruction.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                Pour toute question concernant cette politique de confidentialité, 
                veuillez nous contacter à : {config.contact?.email || 'contact@example.com'}
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;