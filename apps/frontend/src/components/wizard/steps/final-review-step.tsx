'use client';

import React from 'react';
import { useWizard } from '../wizard-provider';

export function FinalReviewStep() {
  const { wizardData } = useWizard();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Révision Finale & Création</h2>
        <p className="text-gray-600">Vérifiez vos informations avant de créer votre site</p>
      </div>

      <div className="space-y-6">
        {/* Site Info */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🏢 Informations du site</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Nom du site:</span>
              <p className="font-medium">{wizardData.siteName || 'Non défini'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Type d'activité:</span>
              <p className="font-medium">{wizardData.businessType || 'Non défini'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm text-gray-500 mb-2 block">Domaine:</span>
              {wizardData.domain ? (
                <>
                  {wizardData.domain.includes('logen.locod-ai.com') ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Sous-domaine (Gratuit)
                        </span>
                        <a
                          href={`https://${wizardData.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {wizardData.domain}
                        </a>
                      </div>
                      <div className="text-sm text-green-800 space-y-1">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Activation instantanée après création
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          HTTPS automatique (certificat SSL inclus)
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Aucune configuration requise
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Domaine personnalisé
                        </span>
                        <p className="font-medium text-gray-900">{wizardData.domain}</p>
                      </div>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Sous-domaine temporaire fourni immédiatement
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Instructions DNS envoyées après création
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Vérification et activation sous 24-48h
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="font-medium text-gray-500">Non défini</p>
              )}
            </div>
            <div>
              <span className="text-sm text-gray-500">Slogan:</span>
              <p className="font-medium">{wizardData.slogan || 'Non défini'}</p>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            🛠️ {wizardData.terminology} ({wizardData.services.length})
          </h3>
          {wizardData.services.length > 0 ? (
            <div className="space-y-2">
              {wizardData.services.map((service, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p className="font-medium">{service.title}</p>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucun service ajouté</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📞 Informations de contact</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-500">Email:</span>
              <p className="font-medium">{wizardData.contact.email || 'Non défini'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Téléphone:</span>
              <p className="font-medium">{wizardData.contact.phone || 'Non défini'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Adresse:</span>
              <p className="font-medium">{wizardData.contact.address || 'Non défini'}</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">⚡ Fonctionnalités activées</h3>
          <div className="flex gap-4">
            <div className={`px-3 py-1 rounded-full text-sm ${
              wizardData.enableBlog ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
            }`}>
              {wizardData.enableBlog ? '✅' : '❌'} Blog
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              wizardData.enableNewsletter ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
            }`}>
              {wizardData.enableNewsletter ? '✅' : '❌'} Newsletter
            </div>
          </div>
        </div>

        {/* Creation Notice */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Prêt à créer votre site !</h3>
          <p className="text-gray-600 mb-4">
            Cliquez sur "Créer le Site" pour lancer la création de votre site web professionnel.
          </p>
          <p className="text-sm text-gray-500">
            ⏱️ La création prend généralement 2-3 minutes
          </p>
        </div>
      </div>
    </div>
  );
}