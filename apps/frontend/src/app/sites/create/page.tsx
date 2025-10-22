'use client';

import { motion } from 'framer-motion';
import CustomerProtectedRoute from '@/components/auth/customer-protected-route';
import CustomerLayout from '@/components/customer/layout/customer-layout';
import Link from 'next/link';

export default function CreateSitePage() {
  const wizardOptions = [
    {
      id: 'wizard-classic',
      title: 'Assistant Classique',
      description: 'Notre wizard traditionnel pour créer des sites étape par étape',
      features: [
        '📝 Configuration guidée',
        '🎯 Processus étape par étape',
        '🧠 Génération IA intégrée',
        '⚙️ Contrôle complet',
        '💾 Sauvegarde automatique',
      ],
      href: '/wizard?new=true',
      status: 'recommended',
      badgeText: 'Recommandé',
      badgeColor: 'bg-green-100 text-green-800',
      buttonColor: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
      icon: (
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      ),
    },
    {
      id: 'quick-method',
      title: 'Méthode Rapide',
      description: 'Création rapide en remplissant tout sur un seul écran',
      features: [
        '⚡ Formulaire unique',
        '🚀 Création instantanée',
        '📋 Paramètres essentiels',
        '🎯 Configuration rapide',
        '💫 Déploiement immédiat',
      ],
      href: '/quick-create?new=true',
      status: 'quick',
      badgeText: 'Rapide',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      icon: (
        <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'template-basic',
      title: 'Modèle Basic',
      description: 'Utiliser le modèle de base prêt à l\'emploi',
      features: [
        '🎯 Modèle professionnel',
        '📱 Design responsive',
        '🎨 Personnalisation facile',
        '⭐ Structure éprouvée',
        '🚀 Déploiement rapide',
      ],
      href: '/templates',
      status: 'template',
      badgeText: 'Modèle',
      badgeColor: 'bg-purple-100 text-purple-800',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      icon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  return (
    <CustomerProtectedRoute>
      <CustomerLayout>
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Créer un Nouveau Site
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choisissez la méthode qui vous convient le mieux pour créer votre site web professionnel
              </p>
            </div>

            {/* Wizard Options */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {wizardOptions.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                    option.status === 'recommended' ? 'border-blue-300 shadow-blue-100' : 'border-gray-200 hover:border-gray-300'
                  } relative overflow-hidden`}
                >
                  {/* Status Badge */}
                  {option.status === 'recommended' && (
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${option.badgeColor}`}>
                        ⭐ {option.badgeText}
                      </span>
                    </div>
                  )}
                  {option.status !== 'recommended' && (
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${option.badgeColor}`}>
                        {option.badgeText}
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-16 h-16 bg-gray-50 rounded-xl mb-6 mx-auto">
                      {option.icon}
                    </div>

                    {/* Title & Description */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{option.title}</h3>
                      <p className="text-gray-600 text-base leading-relaxed">{option.description}</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      {option.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-gray-700">
                          <span className="mr-3">{feature.split(' ')[0]}</span>
                          <span>{feature.split(' ').slice(1).join(' ')}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Link
                      href={option.href}
                      className={`block w-full py-4 px-6 text-center text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${option.buttonColor} shadow-lg hover:shadow-xl`}
                    >
                      {option.status === 'recommended' && '🚀 '}
                      {option.status === 'browse' && '👀 '}
                      Commencer
                      {option.status === 'recommended' && ' (Recommandé)'}
                    </Link>

                    {/* Additional info for Classic */}
                    {option.status === 'recommended' && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700 text-center">
                          🧠 Intégration avec Queue IA pour génération de contenu automatique
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Help Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 text-center"
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 max-w-4xl mx-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  🤔 Besoin d'aide pour choisir ?
                </h3>
                <div className="grid md:grid-cols-3 gap-6 text-left">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">📋 Assistant Classique pour :</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Configuration guidée étape par étape</li>
                      <li>• Génération IA de contenu</li>
                      <li>• Contrôle complet du processus</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">⚡ Méthode Rapide pour :</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Création immédiate sans guidance</li>
                      <li>• Formulaire unique complet</li>
                      <li>• Déploiement instantané</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">🎯 Modèle Basic pour :</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Démarrage avec modèle professionnel</li>
                      <li>• Personnalisation simple</li>
                      <li>• Structure éprouvée</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 text-center"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour au Dashboard
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </CustomerLayout>
    </CustomerProtectedRoute>
  );
}