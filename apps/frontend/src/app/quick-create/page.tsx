'use client';

import { useState, useCallback } from 'react';
import CustomerProtectedRoute from '@/components/auth/customer-protected-route';
import CustomerLayout from '@/components/customer/layout/customer-layout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DomainSelector } from '@/components/common/domain-selector';

export default function QuickCreatePage() {
  const [formData, setFormData] = useState({
    siteName: '',
    businessType: '',
    domain: '',
    domainType: 'subdomain' as 'subdomain' | 'custom',
    slogan: '',
    email: '',
    phone: '',
    address: '',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981'
    },
    services: ['', '', ''],
    description: ''
  });

  const [isCreating, setIsCreating] = useState(false);
  const [domainValidated, setDomainValidated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      // TODO: Implement quick site creation API call
      console.log('Quick site creation:', formData);
      
      // Simulate creation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to site management or success page
      // router.push('/sites');
    } catch (error) {
      console.error('Quick creation failed:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateService = (index: number, value: string) => {
    const newServices = [...formData.services];
    newServices[index] = value;
    updateFormData('services', newServices);
  };

  const handleDomainChange = useCallback((domain: string, domainType: 'subdomain' | 'custom') => {
    setFormData(prev => ({ ...prev, domain, domainType }));
    setDomainValidated(Boolean(domain));
  }, []);

  return (
    <CustomerProtectedRoute>
      <CustomerLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Méthode Rapide</h1>
            <p className="text-gray-600">
              Créez votre site rapidement en remplissant tous les champs sur cette page
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Site Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations du Site</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du site *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.siteName}
                    onChange={(e) => updateFormData('siteName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Mon Entreprise"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'activité *
                  </label>
                  <select
                    required
                    value={formData.businessType}
                    onChange={(e) => updateFormData('businessType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="plomberie">Plomberie</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="coiffure">Coiffure</option>
                    <option value="consulting">Conseil</option>
                    <option value="education">Éducation</option>
                    <option value="sante">Santé</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slogan
                  </label>
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={(e) => updateFormData('slogan', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Votre partenaire de confiance"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description de l'entreprise
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Décrivez brièvement votre activité..."
                />
              </div>
            </div>

            {/* Domain Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🌐 Choisissez votre domaine *</h2>
              <DomainSelector
                onDomainChange={handleDomainChange}
                initialDomain={formData.domain}
                initialDomainType={formData.domainType}
                siteName={formData.siteName}
              />
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations de Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contact@monentreprise.fr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="01 23 45 67 89"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Rue de la Paix, 75001 Paris"
                />
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Services Principaux</h2>
              <p className="text-sm text-gray-600 mb-4">Listez vos 3 services principaux</p>
              {formData.services.map((service, index) => (
                <div key={index} className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service {index + 1} {index === 0 && '*'}
                  </label>
                  <input
                    type="text"
                    required={index === 0}
                    value={service}
                    onChange={(e) => updateService(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Ex: ${index === 0 ? 'Dépannage urgent' : index === 1 ? 'Installation' : 'Maintenance'}`}
                  />
                </div>
              ))}
            </div>

            {/* Colors */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Couleurs du Site</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur principale
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.colors.primary}
                      onChange={(e) => updateFormData('colors', { ...formData.colors, primary: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded-md"
                    />
                    <span className="text-sm text-gray-600">{formData.colors.primary}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur secondaire
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.colors.secondary}
                      onChange={(e) => updateFormData('colors', { ...formData.colors, secondary: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded-md"
                    />
                    <span className="text-sm text-gray-600">{formData.colors.secondary}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Link
                href="/sites/create"
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour aux options
              </Link>
              
              <Button
                type="submit"
                loading={isCreating}
                className="px-8 py-3"
                disabled={!formData.siteName || !formData.businessType || !formData.domain || !formData.email || !formData.services[0]}
              >
                {isCreating ? 'Création en cours...' : '🚀 Créer le Site'}
              </Button>
            </div>
          </form>
        </div>
      </CustomerLayout>
    </CustomerProtectedRoute>
  );
}