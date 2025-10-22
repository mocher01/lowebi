import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/layout/Navbar";
import NavbarV2 from "@/components/layout/NavbarV2";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/common/CookieConsent";
import HomePage from "@/pages/HomePage";
import ServicesPage from "@/pages/ServicesPage";
import ServiceDetail from "@/pages/ServiceDetail";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import ScrollToTop from "@/components/utils/ScrollToTop";
import ScrollManager from "@/components/utils/ScrollManager";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import BlogPage from "@/pages/blog/BlogPage";
import BlogArticleRouter from "@/pages/blog/BlogArticleRouter";
import NotFound from "@/pages/NotFound";
import useAdaptiveFavicon from "@/hooks/useAdaptiveFavicon";
import useSectionStyles from "@/hooks/useSectionStyles";

/**
 * 🎯 APP V2 - Version de test avec nouveau système de navigation
 * 
 * CONTRÔLE:
 * - USE_NEW_NAVIGATION=true → Nouveau système (NavbarV2 + ScrollManager)
 * - USE_NEW_NAVIGATION=false → Ancien système (Navbar + ScrollToTop)
 * 
 * Permet tests A/B et rollback immédiat
 */
const AppV2 = () => {
  // 🎨 Hooks existants
  useAdaptiveFavicon();
  useSectionStyles();

  // 🔧 Contrôle du système de navigation
  const useNewNavigation = true; // TODO: Mettre en variable d'environnement

  return (
    <Router>
      {/* 🆕 Système de scroll conditionnel */}
      {useNewNavigation ? <ScrollManager /> : <ScrollToTop />}
      
      <div className="flex flex-col min-h-screen">
        {/* 🆕 Navbar conditionnelle */}
        {useNewNavigation ? <NavbarV2 /> : <Navbar />}
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage key={Date.now()} />} />
            <Route path="/service/:slug" element={<ServiceDetail />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogArticleRouter />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <CookieConsent config={window.SITE_CONFIG} />
        <Toaster />
      </div>
    </Router>
  );
};

export default AppV2;