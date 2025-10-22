import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle } from "lucide-react";
import { loadSiteConfig } from "@/config/config-loader";
import { createN8nService } from "@/services/n8nService";
import Captcha from "@/components/Captcha";

const ContactPage = () => {
  // Try to get config from window first, then fallback to loader
  const config = window.SITE_CONFIG || loadSiteConfig();
  const contact = config.contact || {};

  // Add data-page attribute for CSS targeting
  useEffect(() => {
    document.body.setAttribute('data-page', 'contact');
    return () => document.body.removeAttribute('data-page');
  }, []);

  // Form state management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [submitMessage, setSubmitMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);

  // Initialize n8n service
  const n8nService = createN8nService(config);
  
  // Check if captcha is enabled
  const captchaConfig = config?.integrations?.captcha;
  const isCaptchaEnabled = captchaConfig?.enabled;

  // 🎨 Header style configurable
  const colors = config.brand?.colors || {};
  const primaryColor = colors.primary;
  const accentColor = colors.accent;
  const designConfig = config.design?.pageHeaders || {};
  
  const pageHeadersConfig = designConfig.background || {};
  const headerBackgroundStyle = {
    background: pageHeadersConfig.type === 'gradient' 
      ? `linear-gradient(135deg, ${pageHeadersConfig.primary?.color || primaryColor}${Math.round((pageHeadersConfig.primary?.opacity || 0.12) * 255).toString(16).padStart(2, '0')}, ${pageHeadersConfig.accent?.color || accentColor}${Math.round((pageHeadersConfig.accent?.opacity || 0.08) * 255).toString(16).padStart(2, '0')})`
      : pageHeadersConfig.color || primaryColor
  };
  
  const headerTitleColor = designConfig.title?.color || '#ffffff';
  const headerSubtitleColor = designConfig.subtitle?.color || '#f3f4f6';

  // Validate individual field
  const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors.name = 'Le nom complet est obligatoire';
        } else if (!/^[a-zA-ZÀ-ÿ\s\-\'\.]+$/.test(value.trim())) {
          errors.name = 'Le nom ne doit contenir que des lettres, espaces, tirets et apostrophes';
        }
        break;
      
      case 'email':
        if (!value.trim()) {
          errors.email = 'L\'adresse email est obligatoire';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors.email = 'L\'adresse email n\'est pas valide (exemple: nom@domaine.com)';
        }
        break;
      
      case 'phone':
        if (value.trim() && !/^[\d\s\-\+\(\)\.]{8,}$/.test(value.trim())) {
          errors.phone = 'Le numéro de téléphone n\'est pas valide (utilisez uniquement des chiffres, espaces, tirets, parenthèses)';
        }
        break;
      
      case 'message':
        if (!value.trim()) {
          errors.message = 'Le message est obligatoire';
        } else if (value.trim().length < 10) {
          errors.message = 'Le message doit contenir au moins 10 caractères';
        }
        break;
    }
    
    return errors;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle field blur for validation
  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    const errors = validateField(name, value);
    
    setFieldErrors(prev => ({
      ...prev,
      ...errors
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage('');
    setFieldErrors({});

    try {
      // Check if n8n is available
      if (!n8nService.isAvailable()) {
        throw new Error('Service de contact indisponible. Veuillez réessayer plus tard.');
      }

      // Check if captcha is required but not completed
      if (isCaptchaEnabled && !captchaToken) {
        throw new Error('Veuillez compléter la vérification reCAPTCHA');
      }

      // Submit to n8n webhook with captcha token
      const result = await n8nService.submitContactForm(formData, captchaToken);

      if (result.success) {
        setSubmitStatus('success');
        setSubmitMessage('Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.');
        
        // Scroll to top of form to show success message
        const formElement = document.getElementById('contact-form');
        if (formElement) {
          formElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
        
        // Reset form, errors, and captcha
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          message: ''
        });
        setFieldErrors({});
        setCaptchaToken(null);
        
        // Reset captcha widget
        if (captchaRef.current?.reset) {
          captchaRef.current.reset();
        }
      } else {
        throw new Error(result.message || 'Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
      setSubmitMessage(error.message || 'Erreur lors de l\'envoi du message. Veuillez réessayer.');
      
      // Scroll to top of form to show error message
      const formElement = document.getElementById('contact-form');
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🎯 Configuration couleurs
  const contactSection = config.sections?.contact || {};
  
  const sectionBg = contactSection.background || '#ffffff';
  const sectionTextColor = contactSection.textColor || '#1e293b';

  // 🎨 Textes configurables
  const contactPage = config.content?.contactPage || {
    title: "Contactez-nous",
    description: "Vous avez un projet ? Une question ? N'hésitez pas à nous contacter. Nous sommes là pour vous accompagner.",
    formTitle: "Envoyez-nous un message",
    infoTitle: "Nos coordonnées"
  };

  return (
    <>
      <Helmet>
        <title>{config.brand.name} | Contact</title>
        <meta name="description" content={`Contactez ${config.brand.name} pour discuter de votre projet. Nous sommes à votre disposition.`} />
        <link rel="canonical" href={`https://${config.meta.domain}/contact`} />
      </Helmet>

      {/* 🔧 FIX: SUPPRESSION DE LA NAVBAR EN DUR - Elle est déjà dans App.jsx */}

      {/* 🎯 CLEAN ARCHITECTURE v1.1: Header avec classes CSS EXACTES */}
      <section className="page-header" style={headerBackgroundStyle}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className={`${designConfig.title?.size || 'text-3xl md:text-4xl'} ${designConfig.title?.weight || 'font-bold'} ${designConfig.title?.margin || 'mb-4'}`}
              style={{ color: headerTitleColor }}
            >
              {contactPage.title}
            </h1>
            
            <p 
              className={`${designConfig.subtitle?.size || 'text-xl'} ${designConfig.subtitle?.weight || 'font-normal'} max-w-2xl mx-auto`}
              style={{ color: headerSubtitleColor }}
            >
              {contactPage.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section contact */}
      <section 
        className="py-8"
        style={{
          backgroundColor: sectionBg,
          color: sectionTextColor
        }}
      >
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Informations de contact */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold mb-6">{contactPage.infoTitle}</h2>
              
              <div className="space-y-4">
                {contact.email && (
                  <div className="flex items-start space-x-4">
                    <Mail className="w-6 h-6 mt-1 text-primary" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <p className="text-gray-600">{contact.email}</p>
                    </div>
                  </div>
                )}
                
                {contact.phone && (
                  <div className="flex items-start space-x-4">
                    <Phone className="w-6 h-6 mt-1 text-primary" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Téléphone</h3>
                      <p className="text-gray-600">{contact.phone}</p>
                    </div>
                  </div>
                )}
                
                {contact.address && (
                  <div className="flex items-start space-x-4">
                    <MapPin className="w-6 h-6 mt-1 text-primary" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Adresse</h3>
                      <p className="text-gray-600">
                        {typeof contact.address === 'string' 
                          ? contact.address 
                          : `${contact.address.street || ''}
${contact.address.city}, ${contact.address.country}`
                        }
                      </p>
                    </div>
                  </div>
                )}
                
                {contact.hours && (
                  <div className="flex items-start space-x-4">
                    <Clock className="w-6 h-6 mt-1 text-primary" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Horaires</h3>
                      <p className="text-gray-600">{contact.hours}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Formulaire de contact */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-6" id="contact-form">
                {contactPage.formTitle}
              </h2>
              
              {/* Success/Error Messages */}
              {submitStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg flex items-center space-x-3 ${
                    submitStatus === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {submitStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <p className="text-sm">{submitMessage}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                      disabled={isSubmitting}
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                      disabled={isSubmitting}
                      placeholder="exemple@domaine.com"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                      placeholder="01 23 45 67 89"
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Société (optionnel)
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message * <span className="text-sm text-gray-500">(minimum 10 caractères)</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    rows={5}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      fieldErrors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                    disabled={isSubmitting}
                    placeholder="Décrivez votre projet ou votre demande... (minimum 10 caractères)"
                  ></textarea>
                  {fieldErrors.message && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.message}
                    </p>
                  )}
                  <div className="mt-1 text-xs text-gray-500">
                    {formData.message.length}/10 caractères minimum
                  </div>
                </div>

                {/* reCAPTCHA */}
                {isCaptchaEnabled && (
                  <div className="flex justify-center">
                    <Captcha
                      ref={captchaRef}
                      onVerify={(token) => {
                        console.log('✅ Captcha verified');
                        setCaptchaToken(token);
                      }}
                      onExpired={() => {
                        console.log('⏰ Captcha expired');
                        setCaptchaToken(null);
                      }}
                      theme={captchaConfig.theme || 'light'}
                      size={captchaConfig.size || 'normal'}
                    />
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-primary w-full text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all flex items-center justify-center space-x-2 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Envoyer le message</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactPage;