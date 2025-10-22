'use client';

import React, { useState, useEffect } from 'react';
import { useWizard } from '../wizard-provider';
import { Button } from '@/components/ui/button';

export function TemplateSelectionStep() {
  const { wizardData, updateWizardData } = useWizard();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplateData, setSelectedTemplateData] = useState<any>(null);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectTemplate = (templateName: string) => {
    const template = availableTemplates.find(t => t.name === templateName);
    updateWizardData({ 
      selectedTemplate: templateName,
      templateData: template
    });
  };

  // Load templates from API (matching V1 behavior)
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to fetch from backend API
        const response = await fetch('/api/templates');
        const result = await response.json();
        
        if (result.success && result.templates) {
          setAvailableTemplates(result.templates);
          
          // Auto-select template-base if it exists and no template is selected (V1 behavior)
          if (result.templates.length > 0 && !wizardData.selectedTemplate) {
            const basicTemplate = result.templates.find((t: any) => t.name === 'template-base');
            if (basicTemplate) {
              updateWizardData({ 
                selectedTemplate: basicTemplate.name,
                templateData: basicTemplate
              });
            }
          }
        } else {
          // Fallback to default template if API fails
          const fallbackTemplates = [
            {
              name: 'template-base',
              displayName: 'Modèle de Base',
              description: 'Template polyvalent adapté à tous types d\'entreprises',
              version: '1.0.0',
              businessTypes: ['Services', 'Commerce', 'Conseil'],
              features: ['Design responsive', 'SEO optimisé', 'Formulaires de contact']
            }
          ];
          setAvailableTemplates(fallbackTemplates);
          if (!wizardData.selectedTemplate) {
            updateWizardData({ 
              selectedTemplate: 'template-base',
              templateData: fallbackTemplates[0]
            });
          }
        }
      } catch (error) {
        console.error('Error loading templates:', error);
        setError('Erreur lors du chargement des templates');
        
        // Fallback templates on error
        const fallbackTemplates = [
          {
            name: 'template-base',
            displayName: 'Modèle de Base',
            description: 'Template polyvalent adapté à tous types d\'entreprises',
            version: '1.0.0',
            businessTypes: ['Services', 'Commerce', 'Conseil'],
            features: ['Design responsive', 'SEO optimisé', 'Formulaires de contact']
          }
        ];
        setAvailableTemplates(fallbackTemplates);
        if (!wizardData.selectedTemplate) {
          updateWizardData({ 
            selectedTemplate: 'template-base',
            templateData: fallbackTemplates[0]
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const openPreview = (template: any) => {
    setSelectedTemplateData(template);
    setShowPreview(true);
  };

  const selectedTemplate = availableTemplates.find(t => t.name === wizardData.selectedTemplate);

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sélection de Modèle</h2>
          <p className="text-gray-600 mb-8">Sélectionnez un modèle de base pour votre site</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Chargement des modèles disponibles...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* No Templates Available (V1 Style) */}
        {!isLoading && !error && availableTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-2-2m2 2l2-2M6 5l2-2" />
              </svg>
            </div>
            <p className="text-gray-700">Aucun modèle disponible</p>
          </div>
        )}

        {/* Single Template Display (V1 Style) */}
        {!isLoading && !error && availableTemplates.length > 0 && (
          <div className="max-w-md mx-auto mb-8">
            {availableTemplates.map((template) => (
            <div
              key={template.name}
              className={`template-card p-8 border-2 rounded-lg transition-all duration-300 cursor-pointer hover:shadow-lg mb-4 ${
                wizardData.selectedTemplate === template.name
                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => selectTemplate(template.name)}
            >
              <div className="text-center">
                {/* Template Icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                
                {/* Template Info */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{template.displayName}</h3>
                <p className="text-gray-600 mb-4">{template.description}</p>
                
                {/* Selected Badge */}
                {wizardData.selectedTemplate === template.name && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Sélectionné
                  </div>
                )}
                
                {/* Preview Button */}
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPreview(template);
                  }}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Aperçu
                </Button>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Template Architecture Info (V1 Style) */}
        {!isLoading && selectedTemplate && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="font-semibold mb-4">Architecture du Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Technologies incluses</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>React 18 + Next.js</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Tailwind CSS</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Design Responsive</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fonctionnalités disponibles</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>IA intégrée (Locod.AI)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Blog intégré</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    <span>E-boutique (à venir)</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Les couleurs, logos et contenus seront personnalisés dans les prochaines étapes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal (V1 Style) */}
      {showPreview && selectedTemplateData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowPreview(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-semibold mb-2">{selectedTemplateData.displayName}</h3>
                <p className="text-gray-600 mb-4">{selectedTemplateData.description}</p>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Version:</strong> {selectedTemplateData.version}</div>
                  <div><strong>Adapté pour:</strong> {selectedTemplateData.businessTypes?.join(', ')}</div>
                  <div><strong>Fonctionnalités:</strong></div>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {selectedTemplateData.features?.map((feature: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600">{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={() => {
                    selectTemplate(selectedTemplateData.name);
                    setShowPreview(false);
                  }}
                  className="w-full sm:ml-3 sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  Sélectionner
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}