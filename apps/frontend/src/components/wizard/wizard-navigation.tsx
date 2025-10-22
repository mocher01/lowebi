'use client';

import React from 'react';
import { useWizard } from './wizard-provider';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useCustomerAuthStore } from '@/store/customer-auth-store';

export function WizardNavigation() {
  const { currentStep, nextStep, prevStep, isLoading, createSite, wizardData, saveProgress } = useWizard();
  const router = useRouter();
  const { isAuthenticated } = useCustomerAuthStore();
  
  // Step-specific validation
  const canProceed = () => {
    switch (currentStep) {
      case 0: // Welcome step - require terms acceptance
        return wizardData.termsAccepted;
      case 2: // Business Info step - require all fields + no duplicate
        const hasRequiredFields = Boolean(
          wizardData.siteName &&
          wizardData.siteName.length >= 2 &&
          wizardData.businessType &&
          wizardData.businessType.length >= 2 &&
          wizardData.domain &&
          wizardData.contact?.email
        );
        // Check for duplicate site name flag
        const isDuplicate = (wizardData as any).isDuplicateSiteName === true;
        console.log('🔍 Navigation validation - isDuplicateSiteName:', (wizardData as any).isDuplicateSiteName);
        console.log('🔍 Navigation validation - hasRequiredFields:', hasRequiredFields);
        console.log('🔍 Navigation validation - canProceed:', hasRequiredFields && !isDuplicate);
        return hasRequiredFields && !isDuplicate;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === 7) {
      // Final step - create site (now step 8 of 8, index 7)
      try {
        const result = await createSite();
        console.log('Site created:', result);
        // TODO: Redirect to success page or dashboard
        alert(`Site créé avec succès! ID: ${result.siteId}`);
      } catch (error) {
        console.error('Failed to create site:', error);
        alert('Erreur lors de la création du site. Veuillez réessayer.');
      }
    } else {
      nextStep();
    }
  };

  const handleExit = async () => {
    // CRITICAL FIX: Save progress BEFORE exiting (don't delete data!)
    try {
      console.log('💾 Saving wizard progress before exit...');
      await saveProgress();
      console.log('✅ Progress saved successfully');
    } catch (error) {
      console.error('Failed to save wizard progress on exit:', error);
    }

    // Proper fallback: authenticated users go to Sites, anonymous users go to Home
    if (isAuthenticated) {
      router.push('/sites');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex justify-between items-center mt-8 px-6 py-4 bg-white rounded-lg shadow-lg">
      {/* Left: Exit Button */}
      <Button
        variant="outline"
        onClick={handleExit}
        className="text-gray-600 hover:text-gray-800 border-gray-300"
      >
        Quitter
      </Button>

      {/* Center: Step Counter */}
      <div className="text-sm text-gray-500 font-medium">
        Étape {currentStep + 1} sur 7
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex items-center space-x-3">
        {/* Previous Button */}
        {currentStep > 0 && (
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Précédent</span>
          </Button>
        )}

        {/* Next Button - Hidden on Step 6 (Review step has its own "Générer mon site" button) */}
        {currentStep < 6 && (
          <Button
            onClick={handleNext}
            disabled={isLoading || !canProceed()}
            className="flex items-center space-x-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>
              {currentStep === 0 ? 'Commencer' : 'Suivant'}
            </span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}