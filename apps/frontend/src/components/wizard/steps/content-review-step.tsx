'use client';

import React, { useState, useEffect } from 'react';
import { useWizard } from '../wizard-provider';
import { Button } from '@/components/ui/button';

export function ContentReviewStep() {
  const { wizardData, updateWizardData, requestAiContent, getAiRequestStatus } = useWizard();
  const [activeContentTab, setActiveContentTab] = useState('principal');

  // Initialize default data if not present
  useEffect(() => {
    const defaultData: Partial<typeof wizardData> = {};
    
    if (!wizardData.hero) {
      defaultData.hero = {
        title: '',
        subtitle: '',
        description: ''
      };
    }
    if (!wizardData.about) {
      defaultData.about = {
        title: '',
        subtitle: '',
        description: '',
        values: []
      };
    }
    if (!wizardData.contact) {
      defaultData.contact = {
        email: '',
        phone: '',
        address: '',
        hours: ''
      };
    }
    if (!wizardData.testimonials) {
      defaultData.testimonials = [];
    }
    if (!wizardData.faq) {
      defaultData.faq = [];
    }
    if (!wizardData.blog) {
      defaultData.blog = {
        articles: []
      };
    }

    // Only update if we have default data to set
    if (Object.keys(defaultData).length > 0) {
      updateWizardData(defaultData);
    }
  }, [wizardData.hero, wizardData.about, wizardData.contact, wizardData.testimonials, wizardData.faq, wizardData.blog]);

  // Service management functions - V1 Simple Structure
  const addService = () => {
    const newService = {
      id: Date.now().toString(),
      name: '',
      title: '', // Keep for compatibility
      description: '',
      features: [] // Keep for compatibility
    };
    updateWizardData({
      services: [...(wizardData.services || []), newService]
    });
  };

  const removeService = (index: number) => {
    const updatedServices = wizardData.services?.filter((_, i) => i !== index) || [];
    updateWizardData({ services: updatedServices });
  };

  const updateService = (index: number, field: string, value: string) => {
    const updatedServices = [...(wizardData.services || [])];
    if (updatedServices[index]) {
      (updatedServices[index] as any)[field] = value;
      updateWizardData({ services: updatedServices });
    }
  };

  // FAQ management functions
  const addFaq = () => {
    const newFaq = {
      question: '',
      answer: ''
    };
    updateWizardData({
      faq: [newFaq, ...(wizardData.faq || [])] // Add at the top
    });
  };

  const removeFaq = (index: number) => {
    const updatedFaq = wizardData.faq?.filter((_, i) => i !== index) || [];
    updateWizardData({ faq: updatedFaq });
  };

  // Blog management functions
  const addBlogArticle = () => {
    const newArticle = {
      title: '',
      excerpt: '',
      content: '',
      category: '',
      tags: []
    };
    const updatedArticles = [newArticle, ...(wizardData.blog?.articles || [])]; // Add at the top
    updateWizardData({
      blog: { ...wizardData.blog, articles: updatedArticles }
    });
  };

  const removeBlogArticle = (index: number) => {
    const updatedArticles = wizardData.blog?.articles?.filter((_, i) => i !== index) || [];
    updateWizardData({
      blog: { ...wizardData.blog, articles: updatedArticles }
    });
  };

  // Testimonial management functions
  const addTestimonial = () => {
    const newTestimonial = {
      text: '',
      name: '',
      position: '',
      rating: 5
    };
    updateWizardData({
      testimonials: [newTestimonial, ...(wizardData.testimonials || [])] // Add at the top
    });
  };

  const removeTestimonial = (index: number) => {
    const updatedTestimonials = wizardData.testimonials?.filter((_, i) => i !== index) || [];
    updateWizardData({ testimonials: updatedTestimonials });
  };

  // Complete AI generation request
  const generateCompleteContent = async () => {
    try {
      await requestAiContent('content', {
        siteName: wizardData.siteName,
        businessType: wizardData.businessType,
        businessDescription: wizardData.businessDescription,
        terminology: wizardData.terminology,
        services: wizardData.services || []
      });
    } catch (error) {
      console.error('Failed to request complete content generation:', error);
    }
  };

  const aiRequest = getAiRequestStatus('content');

  const contentTabs = [
    { id: 'principal', label: '🎯 Principal', icon: '🎯' },
    { id: 'services', label: `📋 ${wizardData.terminology || 'Services'}`, icon: '📋' },
    { id: 'about', label: '📖 À Propos', icon: '📖' },
    { id: 'testimonials', label: '💬 Témoignages', icon: '💬' },
    { id: 'faq', label: '❓ FAQ', icon: '❓' },
    { id: 'blog', label: '📝 Blog', icon: '📝' }
  ];

  return (
    <div className="wizard-step p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Contenu de votre site</h2>
      <p className="text-gray-700 mb-4">Générez et éditez tout le contenu textuel de votre site</p>
      
      {/* AI Generation Button and Content Tabs */}
      <div className="flex justify-between items-center mb-6">
        {/* Content Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
            {contentTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveContentTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeContentTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <button
          onClick={generateCompleteContent}
          disabled={aiRequest.status === 'processing'}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {aiRequest.status !== 'processing' ? (
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          ) : (
            <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>{aiRequest.status !== 'processing' ? 'Générer par IA' : 'Génération...'}</span>
        </button>

      </div>

      {/* AI Request Status */}
      {aiRequest.id && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            {aiRequest.status === 'processing' && (
              <div className="flex-shrink-0">
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                </svg>
              </div>
            )}
            {aiRequest.status === 'completed' && (
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
            <div className="flex-1">
              {(aiRequest.status === 'pending' || aiRequest.status === 'assigned' || aiRequest.status === 'processing') && (
                <div>
                  <p className="text-sm font-medium">
                    {aiRequest.status === 'pending' && '⏳ En attente d\'un expert...'}
                    {aiRequest.status === 'assigned' && '👨‍💼 Expert assigné...'}
                    {aiRequest.status === 'processing' && '🧠 Génération IA en cours...'}
                  </p>
                  {aiRequest.elapsedTime && (
                    <p className="text-xs text-gray-600 mt-1">
                      ⏱️ Temps: {aiRequest.elapsedTime}
                    </p>
                  )}
                </div>
              )}
              {aiRequest.status === 'completed' && (
                <div className="text-green-800">
                  <p className="text-sm font-medium">✅ Contenu généré avec succès!</p>
                  <p className="text-xs mt-1">📝 Vérifiez et éditez le contenu dans chaque tab.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      <div className="mt-6">
        {/* Tab: Principal (Hero Content) */}
        {activeContentTab === 'principal' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">🎯 Contenu Principal de la Page d'Accueil</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre Principal</label>
                <input
                  type="text"
                  value={wizardData.hero?.title || ''}
                  onChange={(e) => updateWizardData({
                    hero: { ...wizardData.hero, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Titre accrocheur pour votre page d'accueil"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre</label>
                <input
                  type="text"
                  value={wizardData.hero?.subtitle || ''}
                  onChange={(e) => updateWizardData({
                    hero: { ...wizardData.hero, subtitle: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sous-titre descriptif"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={wizardData.hero?.description || ''}
                  onChange={(e) => updateWizardData({
                    hero: { ...wizardData.hero, description: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description engageante de votre activité (2-3 phrases)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Services - V1 Exact Match */}
        {activeContentTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Vos {wizardData.terminology || 'Services'}
              </h3>
              <button 
                onClick={addService}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
              >
                + Ajouter
              </button>
            </div>

            {/* Services List - V1 Simple Structure */}
            {wizardData.services && wizardData.services.map((service, index) => (
              <div key={service.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titre du Service</label>
                      <input
                        type="text"
                        value={service.title || ''}
                        onChange={(e) => updateService(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Ex: ${wizardData.businessType === 'restaurant' ? 'Consultation Nutritionnelle Personnalisée' : 'Solutions de Traduction Professionnelle'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={service.description || ''}
                        onChange={(e) => updateService(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Ex: ${wizardData.businessType === 'restaurant' ? 'Conseils personnalisés en nutrition...' : 'Traduction de documents techniques...'}`}
                      />
                    </div>
                  </div>
                  {wizardData.services && wizardData.services.length > 1 && (
                    <button
                      onClick={() => removeService(index)}
                      className="text-red-600 hover:text-red-800 mt-6"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: About */}
        {activeContentTab === 'about' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">📖 À Propos de votre Entreprise</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre de la Section</label>
                <input
                  type="text"
                  value={wizardData.about?.title || ''}
                  onChange={(e) => updateWizardData({
                    about: { ...wizardData.about, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`À propos de ${wizardData.siteName}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre</label>
                <input
                  type="text"
                  value={wizardData.about?.subtitle || ''}
                  onChange={(e) => updateWizardData({
                    about: { ...wizardData.about, subtitle: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sous-titre de la section"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description de l'Entreprise</label>
                <textarea
                  value={wizardData.about?.description || ''}
                  onChange={(e) => updateWizardData({
                    about: { ...wizardData.about, description: e.target.value }
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez votre entreprise, son histoire, sa mission..."
                />
              </div>
            </div>
          </div>
        )}


        {/* Tab: Testimonials */}
        {activeContentTab === 'testimonials' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">💬 Témoignages Clients</h3>
              <button
                onClick={addTestimonial}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
              >
                + Ajouter
              </button>
            </div>
            {wizardData.testimonials && wizardData.testimonials.length > 0 ? (
              <div className="space-y-4">
                {wizardData.testimonials.map((testimonial, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1 space-y-3">
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Témoignage</label>
                        <textarea
                          value={testimonial.text || ''}
                          onChange={(e) => {
                            const updated = [...(wizardData.testimonials || [])];
                            updated[index] = { ...updated[index], text: e.target.value };
                            updateWizardData({ testimonials: updated });
                          }}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Témoignage du client..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                          <input
                            type="text"
                            value={testimonial.name || ''}
                            onChange={(e) => {
                              const updated = [...(wizardData.testimonials || [])];
                              updated[index] = { ...updated[index], name: e.target.value };
                              updateWizardData({ testimonials: updated });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Prénom Nom"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                          <input
                            type="text"
                            value={testimonial.position || ''}
                            onChange={(e) => {
                              const updated = [...(wizardData.testimonials || [])];
                              updated[index] = { ...updated[index], position: e.target.value };
                              updateWizardData({ testimonials: updated });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Poste, Entreprise"
                          />
                        </div>
                      </div>
                    </div>
                      {wizardData.testimonials && wizardData.testimonials.length > 1 && (
                        <button
                          onClick={() => removeTestimonial(index)}
                          className="text-red-600 hover:text-red-800 mt-6"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Aucun témoignage. Cliquez sur "Générer par IA" pour créer des témoignages.
              </div>
            )}
          </div>
        )}

        {/* Tab: FAQ */}
        {activeContentTab === 'faq' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">❓ Questions Fréquemment Posées</h3>
              <button
                onClick={addFaq}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
              >
                + Ajouter
              </button>
            </div>
            {wizardData.faq && wizardData.faq.length > 0 ? (
              <div className="space-y-4">
                {wizardData.faq.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                          <input
                            type="text"
                            value={item.question || ''}
                            onChange={(e) => {
                              const updated = [...(wizardData.faq || [])];
                              updated[index] = { ...updated[index], question: e.target.value };
                              updateWizardData({ faq: updated });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Question fréquente?"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Réponse</label>
                          <textarea
                            value={item.answer || ''}
                            onChange={(e) => {
                              const updated = [...(wizardData.faq || [])];
                              updated[index] = { ...updated[index], answer: e.target.value };
                              updateWizardData({ faq: updated });
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Réponse détaillée..."
                          />
                        </div>
                      </div>
                      {wizardData.faq && wizardData.faq.length > 1 && (
                        <button
                          onClick={() => removeFaq(index)}
                          className="text-red-600 hover:text-red-800 mt-6"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Aucune FAQ. Cliquez sur "Générer par IA" pour créer des questions fréquentes.
              </div>
            )}
          </div>
        )}

        {/* Tab: Blog */}
        {activeContentTab === 'blog' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📝 Articles de Blog</h3>
              <button
                onClick={addBlogArticle}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
              >
                + Ajouter
              </button>
            </div>
            {/* DEBUG: Log blog data */}
            {(() => {
              console.log('🔍 DEBUG Blog data:', wizardData.blog);
              console.log('🔍 DEBUG Articles array:', wizardData.blog?.articles);
              console.log('🔍 DEBUG Articles length:', wizardData.blog?.articles?.length);
              return null;
            })()}
            {wizardData.blog?.articles && wizardData.blog.articles.length > 0 ? (
              <div className="space-y-4">
                {wizardData.blog.articles.map((article, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                          <input
                            type="text"
                            value={article.title || ''}
                            onChange={(e) => {
                              const updated = [...(wizardData.blog?.articles || [])];
                              updated[index] = { ...updated[index], title: e.target.value };
                              updateWizardData({
                                blog: { ...wizardData.blog, articles: updated }
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Titre de l'article"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Résumé</label>
                          <textarea
                            value={article.excerpt || ''}
                            onChange={(e) => {
                              const updated = [...(wizardData.blog?.articles || [])];
                              updated[index] = { ...updated[index], excerpt: e.target.value };
                              updateWizardData({
                                blog: { ...wizardData.blog, articles: updated }
                              });
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Résumé accrocheur de l'article..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
                          <textarea
                            value={article.content || ''}
                            onChange={(e) => {
                              const updated = [...(wizardData.blog?.articles || [])];
                              updated[index] = { ...updated[index], content: e.target.value };
                              updateWizardData({
                                blog: { ...wizardData.blog, articles: updated }
                              });
                            }}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Contenu de l'article..."
                          />
                        </div>
                      </div>
                      {wizardData.blog?.articles && wizardData.blog.articles.length > 1 && (
                        <button
                          onClick={() => removeBlogArticle(index)}
                          className="text-red-600 hover:text-red-800 mt-6"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Aucun article. Cliquez sur "Générer par IA" pour créer des articles de blog.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}