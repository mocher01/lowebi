import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HomePage from "@/pages/HomePage";
import ServicesPage from "@/pages/ServicesPage";
import ServiceDetail from "@/pages/ServiceDetail";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import ScrollToTop from "@/components/utils/ScrollToTop";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import BlogPage from "@/pages/blog/BlogPage";
import BlogArticleRouter from "@/pages/blog/BlogArticleRouter";
import NotFound from "@/pages/NotFound";
import useAdaptiveFavicon from "@/hooks/useAdaptiveFavicon";
import useSectionStyles from "@/hooks/useSectionStyles";

const App = () => {
  // 🎨 NOUVEAUTÉ : Gestion automatique des favicons adaptatifs selon le mode sombre/clair
  useAdaptiveFavicon();
  
  // 🎨 FIX: Injection des styles de sections depuis la configuration
  useSectionStyles();

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Navbar />
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
        <Toaster />
      </div>
    </Router>
  );
};

export default App;