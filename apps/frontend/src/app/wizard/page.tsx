'use client';

import { useState, useEffect } from 'react';
import CustomerLayout from '@/components/customer/layout/customer-layout';
import { WizardProvider, useWizard } from '@/components/wizard/wizard-provider';
import { WizardStep } from '@/components/wizard/wizard-step';
import { WizardNavigation } from '@/components/wizard/wizard-navigation';
import { WizardProgress } from '@/components/wizard/wizard-progress';

// Import wizard steps - CORRECTED to match V1 structure
import { WelcomeStep } from '@/components/wizard/steps/welcome-step';
import { TemplateSelectionStep } from '@/components/wizard/steps/template-selection-step';
import { BusinessInfoStep } from '@/components/wizard/steps/business-info-step';
import { ImageLogoStep } from '@/components/wizard/steps/image-logo-step';
import { ContentReviewStep } from '@/components/wizard/steps/content-review-step';
import { AdvancedFeaturesStep } from '@/components/wizard/steps/advanced-features-step';
import { ReviewStep } from '@/components/wizard/steps/review-step';

const wizardSteps = [
  { id: 'welcome', title: 'Bienvenue', component: WelcomeStep },
  { id: 'template', title: 'Modèle', component: TemplateSelectionStep },
  { id: 'business', title: 'Informations', component: BusinessInfoStep },
  { id: 'content', title: 'Contenu', component: ContentReviewStep },
  { id: 'images', title: 'Images', component: ImageLogoStep },
  { id: 'advanced', title: 'Fonctionnalités', component: AdvancedFeaturesStep },
  { id: 'review', title: 'Révision & Génération', component: ReviewStep },
];

function WizardContent() {
  const { currentStep, isLoading, error, wizardData } = useWizard();
  const CurrentStepComponent = wizardSteps[currentStep]?.component;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de connexion</h3>
            <p className="text-gray-600 mb-4">{error.message || 'Une erreur est survenue lors du chargement du wizard.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Chargement du wizard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Site Name Display */}
          <div className="mb-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9h9m-9 0l9-9m0 0L12 3m0 0l9 9" />
              </svg>
              <span className={`text-lg font-semibold ${wizardData.siteName ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                {wizardData.siteName || 'Nouveau Site'}
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Assistant de Création de Site Locod.AI
          </h1>
          <p className="text-gray-600">
            Créez votre site web professionnel en quelques étapes simples
          </p>
        </div>

        {/* Progress Indicator */}
        <WizardProgress steps={wizardSteps} currentStep={currentStep} />

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-8">
          <WizardStep>
            {CurrentStepComponent && <CurrentStepComponent />}
          </WizardStep>
        </div>

        {/* Navigation */}
        <WizardNavigation />
      </div>
    </div>
  );
}

export default function WizardPage() {
  return (
    <CustomerLayout>
      <WizardProvider>
        <WizardContent />
      </WizardProvider>
    </CustomerLayout>
  );
}