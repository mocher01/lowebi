import React from "react";
import { Helmet } from "react-helmet";
import Hero from "@/components/home/Hero";
import Services from "@/components/home/Services";
import About from "@/components/home/About";
import Testimonials from "@/components/home/Testimonials";
import CTA from "@/components/home/CTA";
import FAQ from "@/components/home/FAQ";
import { loadSiteConfig } from "@/config/config-loader";

const HomePage = () => {
  const config = loadSiteConfig();
  
  return (
    <>
      <Helmet>
        <title>{config.seo?.title || `${config.brand.name} | Page d'accueil`}</title>
        <meta name="description" content={config.seo?.description || config.content.hero?.description || `${config.brand.name} - ${config.brand.slogan}`} />
        <link rel="canonical" href={`https://${config.meta.domain}/`} />
        
        {/* Keywords SEO */}
        {config.seo?.keywords && (
          <meta name="keywords" content={config.seo.keywords.join(', ')} />
        )}
        
        {/* Open Graph */}
        <meta property="og:title" content={config.seo?.title || config.brand.name} />
        <meta property="og:description" content={config.seo?.description || config.content.hero?.description} />
        <meta property="og:url" content={`https://${config.meta.domain}/`} />
        {config.seo?.ogImage && (
          <meta property="og:image" content={`https://${config.meta.domain}/assets/${config.seo.ogImage}`} />
        )}
      </Helmet>
      
      <Hero />
      <Services />
      <About />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
};

export default HomePage;