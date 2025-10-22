'use client';

import React, { useMemo, useEffect } from 'react';
import { useWizard } from '../wizard-provider';
import { EmailConfigurationCard, EmailScenario } from './advanced-features/email-configuration-card';

export function AdvancedFeaturesStep() {
  const { wizardData, updateWizardData, sessionId, saveProgress } = useWizard();

  // Handle OAuth2 callback from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth2Status = params.get('oauth2Status');
    const credentialId = params.get('credentialId');
    const email = params.get('email');
    const errorMessage = params.get('message');
    const continueId = params.get('continue'); // Get session ID from URL

    if (oauth2Status === 'success' && credentialId && email) {
      console.log('🔐 OAuth2 success callback - updating wizardData with credentials:', {
        credentialId,
        email: decodeURIComponent(email)
      });

      const decodedEmail = decodeURIComponent(email);

      // Prepare updated data with OAuth credentials
      const updatedData = {
        step6: {
          ...wizardData.step6,
          emailConfig: {
            ...wizardData.step6?.emailConfig,
            scenario: 'oauth2' as const,
            oauth: {
              connected: true,
              email: decodedEmail,
              oauthCredentialId: credentialId,
            }
          }
        }
      };

      // Update local state
      updateWizardData(updatedData);

      // CRITICAL FIX: Wait longer for state to propagate, then save
      setTimeout(async () => {
        console.log('💾 Saving OAuth2 credentials to backend...');
        await saveProgress();
        console.log('✅ OAuth2 credentials saved to backend');

        // Clean up URL parameters after saving - use continueId from URL
        const cleanSessionId = continueId || sessionId;
        const newUrl = window.location.pathname + '?continue=' + cleanSessionId + '&step=5';
        window.history.replaceState({}, '', newUrl);
        console.log('🧹 OAuth2 URL parameters cleaned, session preserved');
      }, 1500); // Increased to 1500ms to ensure updateWizardData completes and propagates
    } else if (oauth2Status === 'error') {
      console.error('🔐 OAuth2 error callback:', errorMessage || 'Échec de la connexion');

      // Clean up URL parameters
      setTimeout(() => {
        const cleanSessionId = continueId || sessionId;
        const newUrl = window.location.pathname + '?continue=' + cleanSessionId + '&step=5';
        window.history.replaceState({}, '', newUrl);
      }, 100);
    }
  }, []); // Empty deps - run once on mount

  // Get email scenario from wizardData
  const emailScenario = wizardData.step6?.emailConfig?.scenario;

  // Calculate feature availability based on email scenario
  const availability = useMemo(() => ({
    n8n: emailScenario !== 'no-form',
    analytics: emailScenario === 'oauth2',
    recaptcha: emailScenario !== 'no-form'
  }), [emailScenario]);

  const handleEmailScenarioChange = (scenario: EmailScenario) => {
    updateWizardData({
      step6: {
        ...wizardData.step6,
        emailConfig: {
          ...wizardData.step6?.emailConfig,
          scenario
        }
      }
    });
  };

  const handleOAuth2Connect = async () => {
    try {
      if (!sessionId) {
        console.error('No session ID found');
        alert('Erreur: Session non trouvée');
        return;
      }

      // Build full URL for OAuth2 authorization endpoint
      // The Next.js rewrite will proxy this to the backend
      const baseUrl = window.location.origin;
      const authUrl = `${baseUrl}/api/customer/oauth2/authorize?wizardSessionId=${sessionId}`;

      console.log('🔐 Redirecting to OAuth2:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('OAuth2 connection error:', error);
      alert('Erreur lors de la connexion OAuth2');
    }
  };

  const handleGDPRAccept = (accepted: boolean, businessEmail: string) => {
    updateWizardData({
      step6: {
        ...wizardData.step6,
        emailConfig: {
          ...wizardData.step6?.emailConfig,
          locodaiDefault: {
            enabled: accepted,
            businessEmail,
            gdprConsent: {
              accepted,
              acceptedAt: new Date().toISOString(),
              ipAddress: '', // Will be filled by backend
              policyVersion: '1.0'
            }
          }
        }
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Fonctionnalités avancées
        </h2>
        <p className="text-gray-600">
          Configurez les fonctionnalités professionnelles
          <span className="ml-2 text-sm text-gray-500">(100% OPTIONNEL)</span>
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Configuration */}
        <EmailConfigurationCard
          value={emailScenario}
          onChange={handleEmailScenarioChange}
          onOAuth2Connect={handleOAuth2Connect}
          onGDPRAccept={handleGDPRAccept}
          oauth2Status={wizardData.step6?.emailConfig?.oauth}
        />

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Automatic Features Section */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Fonctionnalités automatiques
          </h3>

          <div className="space-y-3">
            {/* N8N Automation */}
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <div>
                    <div className="font-medium text-gray-900">Automatisation workflows</div>
                    <div className="text-sm text-gray-500">
                      {availability.n8n ? (
                        <span className="text-green-600">✓ Disponible</span>
                      ) : (
                        <span className="text-gray-400">Nécessite: Email configuré</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                disabled={!availability.n8n}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  availability.n8n
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {availability.n8n ? 'Activer' : 'Activer'}
              </button>
            </div>

            {/* Google Analytics */}
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <div>
                    <div className="font-medium text-gray-900">Google Analytics</div>
                    <div className="text-sm text-gray-500">
                      {availability.analytics ? (
                        <span className="text-green-600">✓ Disponible</span>
                      ) : (
                        <span className="text-gray-400">Nécessite: Gmail OAuth2</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                disabled={!availability.analytics}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  availability.analytics
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {availability.analytics ? 'Activer' : 'Activer'}
              </button>
            </div>

            {/* reCAPTCHA */}
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <div>
                    <div className="font-medium text-gray-900">Protection anti-spam</div>
                    <div className="text-sm text-gray-500">
                      {availability.recaptcha ? (
                        <span className="text-green-600">✓ Disponible</span>
                      ) : (
                        <span className="text-gray-400">Nécessite: Formulaire actif</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                disabled={!availability.recaptcha}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  availability.recaptcha
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {availability.recaptcha ? 'Activer' : 'Activer'}
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Coming Soon Section - Collapsed */}
        <details className="bg-gray-50 border border-gray-200 rounded-lg">
          <summary className="px-4 py-3 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-700">
              🚀 Bientôt Disponible
              <span className="ml-2 text-sm text-gray-500">(Newsletter, Chat, Paiements...)</span>
            </span>
          </summary>
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>💌</span>
              <span>Newsletter (Mailchimp/Brevo)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>💬</span>
              <span>Chat en direct (Crisp/Intercom)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>💳</span>
              <span>Paiements (Stripe)</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
