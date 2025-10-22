'use client';

import React, { useState, useEffect } from 'react';
import { useWizard } from '../wizard-provider';
import { Button } from '@/components/ui/button';

export function ContentServicesStep() {
  const { 
    wizardData, 
    updateWizardData, 
    requestAiContent, 
    getAiRequestStatus, 
    applyAiContent 
  } = useWizard();

  // DEBUG: Track services changes
  useEffect(() => {
    console.log('🔍 ContentServicesStep - wizardData.services changed:', {
      count: wizardData.services?.length || 0,
      services: wizardData.services?.map(s => ({ title: s.title, id: s.id })) || []
    });
  }, [wizardData.services]);

  const [newService, setNewService] = useState({
    title: '',
    description: '',
    features: ['']
  });

  const aiRequest = getAiRequestStatus('content'); // V1 uses 'content' for comprehensive generation

  // DEBUG: Track AI request status changes
  useEffect(() => {
    console.log('🔍 ContentServicesStep - AI request status:', {
      status: aiRequest.status,
      hasContent: !!aiRequest.generatedContent
    });
  }, [aiRequest.status, aiRequest.generatedContent]);

  const handleAddService = () => {
    if (newService.title.trim() && newService.description.trim()) {
      const service = {
        ...newService,
        id: Date.now().toString(),
        name: newService.title,
        features: newService.features.filter(f => f.trim())
      };
      
      updateWizardData({
        services: [...wizardData.services, service]
      });
      
      setNewService({
        title: '',
        description: '',
        features: ['']
      });
    }
  };

  const handleRemoveService = (index: number) => {
    const newServices = wizardData.services.filter((_, i) => i !== index);
    updateWizardData({ services: newServices });
  };

  const handleRequestAi = async () => {
    try {
      await requestAiContent('content', {
        businessType: wizardData.businessType,
        terminology: wizardData.terminology,
        siteName: wizardData.siteName,
        existingServices: wizardData.services
      });
    } catch (error) {
      console.error('Failed to request AI content:', error);
    }
  };

  const handleApplyAi = () => {
    applyAiContent('content');
  };

  const renderAiStatus = () => {
    if (aiRequest.status === 'idle') return null;

    const statusConfig = {
      pending: { 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50', 
        icon: '⏳',
        text: 'Demande créée, en attente de traitement...'
      },
      assigned: { 
        color: 'text-blue-600', 
        bg: 'bg-blue-50', 
        icon: '👨‍💻',
        text: 'Assignée à un expert, traitement en cours...'
      },
      processing: { 
        color: 'text-purple-600', 
        bg: 'bg-purple-50', 
        icon: '🔄',
        text: 'Génération IA en cours...'
      },
      completed: { 
        color: 'text-green-600', 
        bg: 'bg-green-50', 
        icon: '✅',
        text: 'Services générés avec succès!'
      },
      rejected: { 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        icon: '❌',
        text: 'Demande rejetée. Contactez le support.'
      },
      failed: { 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        icon: '🚫',
        text: 'Erreur lors de la génération. Réessayez.'
      }
    };

    const config = statusConfig[aiRequest.status] || statusConfig.pending;

    return (
      <div className={`p-4 rounded-lg border ${config.bg} ${config.color} mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{config.icon}</span>
            <span className="font-medium">{config.text}</span>
          </div>
          
          {aiRequest.status === 'completed' && aiRequest.generatedContent && (
            <Button
              onClick={handleApplyAi}
              className="bg-green-600 text-white hover:bg-green-700"
              size="sm"
            >
              Appliquer les Services
            </Button>
          )}
          
          {aiRequest.elapsedTime && (
            <span className="text-sm opacity-75">
              Temps: {aiRequest.elapsedTime}
            </span>
          )}
        </div>

        {aiRequest.errorMessage && (
          <div className="mt-2 text-sm">
            Erreur: {aiRequest.errorMessage}
          </div>
        )}
      </div>
    );
  };

  // DEBUG: Log render state
  console.log('🎨 ContentServicesStep RENDER:', {
    servicesCount: wizardData.services?.length || 0,
    services: wizardData.services?.map(s => s.title) || [],
    aiStatus: aiRequest.status,
    hasAiContent: !!aiRequest.generatedContent
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Contenu & Services
        </h2>
        <p className="text-gray-600">
          Ajoutez vos {wizardData.terminology} ou utilisez l'IA pour les générer automatiquement
        </p>
      </div>

      {/* AI Status */}
      {renderAiStatus()}

      {/* AI Generation Button */}
      <div className="mb-8 text-center">
        <Button
          onClick={handleRequestAi}
          disabled={aiRequest.status === 'pending' || aiRequest.status === 'processing'}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 px-6 py-3"
        >
          {aiRequest.status === 'pending' || aiRequest.status === 'processing' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Génération IA en cours...
            </>
          ) : (
            <>
              🧠 Générer {wizardData.terminology} avec l'IA
            </>
          )}
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          Notre IA va créer {wizardData.terminology} adaptés à votre secteur d'activité
        </p>
      </div>

      {/* Existing Services */}
      {wizardData.services.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vos {wizardData.terminology} actuels
          </h3>
          <div className="grid gap-4">
            {wizardData.services.map((service, index) => (
              <div key={index} className="bg-gray-50 border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{service.title}</h4>
                    <p className="text-gray-600 mt-1">{service.description}</p>
                    {service.features.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Caractéristiques:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                          {service.features.map((feature, fIndex) => (
                            <li key={fIndex}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRemoveService(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Service */}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ajouter un nouveau {wizardData.terminology.slice(0, -1)}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du {wizardData.terminology.slice(0, -1)}
            </label>
            <input
              type="text"
              value={newService.title}
              onChange={(e) => setNewService({ ...newService, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Ex: Consultation ${wizardData.businessType}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Décrivez ce ${wizardData.terminology.slice(0, -1)}...`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caractéristiques (optionnel)
            </label>
            {newService.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => {
                    const newFeatures = [...newService.features];
                    newFeatures[index] = e.target.value;
                    setNewService({ ...newService, features: newFeatures });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Consultation personnalisée"
                />
                {index > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const newFeatures = newService.features.filter((_, i) => i !== index);
                      setNewService({ ...newService, features: newFeatures });
                    }}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setNewService({ 
                  ...newService, 
                  features: [...newService.features, ''] 
                });
              }}
              className="mt-2"
            >
              + Ajouter une caractéristique
            </Button>
          </div>

          <Button
            onClick={handleAddService}
            disabled={!newService.title.trim() || !newService.description.trim()}
            className="w-full"
          >
            Ajouter ce {wizardData.terminology.slice(0, -1)}
          </Button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informations de Contact
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={wizardData.contact.email}
              onChange={(e) => updateWizardData({
                contact: { ...wizardData.contact, email: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="contact@exemple.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={wizardData.contact.phone}
              onChange={(e) => updateWizardData({
                contact: { ...wizardData.contact, phone: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+33 1 23 45 67 89"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={wizardData.contact.address}
              onChange={(e) => updateWizardData({
                contact: { ...wizardData.contact, address: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="123 Rue de la Paix, Paris"
            />
          </div>
        </div>
      </div>
    </div>
  );
}