'use client';

import React, { useState } from 'react';

export type EmailScenario = 'oauth2' | 'locodai-default' | 'no-form';

interface OAuth2Status {
  connected: boolean;
  email?: string;
  oauthCredentialId?: string;
}

interface EmailConfigurationCardProps {
  value?: EmailScenario;
  onChange: (scenario: EmailScenario) => void;
  onOAuth2Connect?: () => void;
  onGDPRAccept?: (accepted: boolean, businessEmail: string) => void;
  oauth2Status?: OAuth2Status;
}

export function EmailConfigurationCard({
  value,
  onChange,
  onOAuth2Connect,
  onGDPRAccept,
  oauth2Status
}: EmailConfigurationCardProps) {
  const [gdprAccepted, setGDPRAccepted] = useState(false);
  const [businessEmail, setBusinessEmail] = useState('');

  const handleScenarioChange = (scenario: EmailScenario) => {
    onChange(scenario);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Configuration Email
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Choisissez comment gérer les emails de contact
      </p>

      <div className="space-y-3">
        {/* Option 1: OAuth2 Gmail */}
        <label
          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
            value === 'oauth2'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="emailScenario"
            value="oauth2"
            checked={value === 'oauth2'}
            onChange={() => handleScenarioChange('oauth2')}
            className="w-4 h-4 text-blue-600"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              Utiliser mon Gmail
              <span className="ml-2 text-xs font-normal text-blue-600">Recommandé</span>
            </div>
            <div className="text-sm text-gray-500">Débloque toutes les fonctions</div>
          </div>
        </label>

        {value === 'oauth2' && (
          <div className="ml-7 pl-4 border-l-2 border-blue-200">
            {oauth2Status?.connected ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-900">Connecté</div>
                  <div className="text-xs text-green-700">{oauth2Status.email}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Déconnecter votre compte Gmail ?')) {
                      // TODO: Implement disconnect
                      console.log('Disconnect OAuth2');
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Déconnecter
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOAuth2Connect?.();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Connecter avec Google</span>
              </button>
            )}
          </div>
        )}

        {/* Option 2: Locod.ai default */}
        <label
          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
            value === 'locodai-default'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="emailScenario"
            value="locodai-default"
            checked={value === 'locodai-default'}
            onChange={() => handleScenarioChange('locodai-default')}
            className="w-4 h-4 text-blue-600"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Email Locod.ai</div>
            <div className="text-sm text-gray-500">Géré par Locod.ai</div>
          </div>
        </label>

        {value === 'locodai-default' && (
          <div className="ml-7 pl-4 border-l-2 border-blue-200 space-y-3">
            <input
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Votre email pour recevoir les messages"
              onClick={(e) => e.stopPropagation()}
            />
            <label className="flex items-start gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={gdprAccepted}
                onChange={(e) => {
                  setGDPRAccepted(e.target.checked);
                  if (e.target.checked && businessEmail) {
                    onGDPRAccept?.(true, businessEmail);
                  }
                }}
                className="mt-0.5"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-gray-600">
                J'accepte que Locod.ai envoie des emails pour mon compte
              </span>
            </label>
          </div>
        )}

        {/* Option 3: No form */}
        <label
          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
            value === 'no-form'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="emailScenario"
            value="no-form"
            checked={value === 'no-form'}
            onChange={() => handleScenarioChange('no-form')}
            className="w-4 h-4 text-blue-600"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Pas de formulaire</div>
            <div className="text-sm text-gray-500">Téléphone et adresse affichés dans la section contact</div>
          </div>
        </label>
      </div>
    </div>
  );
}
