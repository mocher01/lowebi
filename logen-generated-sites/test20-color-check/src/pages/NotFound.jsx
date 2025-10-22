import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadSiteConfig } from "@/config/config-loader";

const NotFound = () => {
  const config = loadSiteConfig();

  return (
    <>
      <Helmet>
        <title>Page non trouvée | {config.brand.name}</title>
        <meta name="description" content="La page que vous recherchez n'existe pas." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Page non trouvée
          </h2>
          
          <p className="text-gray-600 mb-8">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button className="gradient-bg text-white">
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Page précédente
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;