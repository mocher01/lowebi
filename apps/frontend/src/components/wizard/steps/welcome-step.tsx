'use client';

import React from 'react';
import { useWizard } from '../wizard-provider';

export function WelcomeStep() {
  const { wizardData, updateWizardData, nextStep } = useWizard();

  return (
    <div className="text-center max-w-2xl mx-auto">
      {/* Site Language Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Langue de votre site web
        </label>
        <select 
          value={wizardData.siteLanguage} 
          onChange={(e) => updateWizardData({ siteLanguage: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          style={{ color: '#111827' }}
        >
          <option value="fr" style={{ color: '#111827' }}>Français</option>
          <option value="en" style={{ color: '#111827' }}>English</option>
          <option value="es" style={{ color: '#111827' }}>Español</option>
          <option value="de" style={{ color: '#111827' }}>Deutsch</option>
        </select>
      </div>

      {/* Terms and Conditions */}
      <div className="text-left bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="font-semibold mb-2 text-gray-900">Conditions d'utilisation</h3>
        <ul className="text-sm text-gray-800 space-y-1">
          <li>Notre IA génère du contenu personnalisé basé sur vos informations</li>
          <li>Vous êtes responsable de la vérification et modification du contenu généré</li>
          <li>Nous respectons la confidentialité de vos données professionnelles</li>
        </ul>
        <label className="flex items-center mt-4">
          <input 
            type="checkbox" 
            checked={wizardData.termsAccepted}
            onChange={(e) => updateWizardData({ termsAccepted: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm text-gray-900">
            J'accepte les conditions d'utilisation de Locod.AI
          </span>
        </label>
      </div>

    </div>
  );
}