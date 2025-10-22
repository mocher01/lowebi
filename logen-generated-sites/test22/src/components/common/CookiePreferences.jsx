import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const CookiePreferences = ({ config, isOpen, onClose, onSave }) => {
  const [preferences, setPreferences] = useState({
    necessary: true, // Toujours activé
    analytics: false,
    functional: false,
  });

  const primaryColor = config?.brand?.colors?.primary || '#8B4513';
  const hasAnalytics = !!config?.seo?.analytics?.googleAnalytics;
  const hasRecaptcha = !!config?.integrations?.captcha?.enabled;

  const handleToggle = (category) => {
    if (category === 'necessary') return; // Les cookies nécessaires ne peuvent pas être désactivés
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      functional: true,
    };
    setPreferences(allAccepted);
    onSave(allAccepted);
  };

  const handleSavePreferences = () => {
    onSave(preferences);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: primaryColor }}>
            Paramètres des cookies
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-600 mb-6">
            Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
            Vous pouvez choisir quels types de cookies vous acceptez ci-dessous.
          </p>

          {/* Cookie Categories */}
          <div className="space-y-4">
            {/* Cookies nécessaires */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Cookies nécessaires
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés.
                  </p>
                  <details className="text-sm text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">
                      Détails
                    </summary>
                    <ul className="mt-2 ml-4 list-disc">
                      <li>cookie-consent : Mémorise vos préférences de cookies</li>
                      <li>Session : Maintient votre session active</li>
                    </ul>
                  </details>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-600"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Cookies analytiques */}
            {hasAnalytics && (
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Cookies analytiques
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site.
                    </p>
                    <details className="text-sm text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">
                        Détails
                      </summary>
                      <ul className="mt-2 ml-4 list-disc">
                        <li>Google Analytics (_ga, _gid, _gat) : Analyse du trafic et comportement des visiteurs</li>
                        <li>Durée : _ga (2 ans), _gid (24h), _gat (1 minute)</li>
                      </ul>
                    </details>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={() => handleToggle('analytics')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-green-600 peer-focus:ring-2 peer-focus:ring-green-300"></div>
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Cookies fonctionnels */}
            {hasRecaptcha && (
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Cookies fonctionnels
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Ces cookies permettent des fonctionnalités avancées comme la protection contre le spam.
                    </p>
                    <details className="text-sm text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">
                        Détails
                      </summary>
                      <ul className="mt-2 ml-4 list-disc">
                        <li>Google reCAPTCHA (_GRECAPTCHA) : Protection contre le spam sur les formulaires</li>
                        <li>Durée : 6 mois</li>
                      </ul>
                    </details>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={() => handleToggle('functional')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-green-600 peer-focus:ring-2 peer-focus:ring-green-300"></div>
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Informations supplémentaires */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Vos droits :</strong> Vous pouvez modifier vos préférences à tout moment. 
              Pour plus d'informations sur l'utilisation de vos données, consultez notre{' '}
              <a 
                href="/privacy" 
                className="underline hover:no-underline"
                style={{ color: primaryColor }}
              >
                politique de confidentialité
              </a>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={handleSavePreferences}
            className="px-4 py-2 text-sm font-medium border-2 rounded-lg transition-colors hover:bg-gray-50"
            style={{ 
              borderColor: '#d1d5db',
              color: '#6b7280'
            }}
          >
            Enregistrer mes préférences
          </button>
          
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:transform hover:scale-105"
            style={{ 
              backgroundColor: primaryColor,
              boxShadow: `0 2px 8px ${primaryColor}40`
            }}
          >
            Accepter tous les cookies
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CookiePreferences;