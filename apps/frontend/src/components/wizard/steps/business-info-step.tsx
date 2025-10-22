'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWizard } from '../wizard-provider';
import { DomainSelector } from '../../common/domain-selector';

// --- Small helpers ---------------------------------------------------------
const sanitizeSiteId = (raw: string) =>
  raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9-\s]/g, '') // Keep letters, digits, space, hyphen
    .replace(/\s+/g, '-') // spaces -> hyphen
    .replace(/-+/g, '-') // collapse hyphens
    .replace(/^-+|-+$/g, '') // trim hyphens
    .slice(0, 30);

export function BusinessInfoStep() {
  const { wizardData, updateWizardData, createWizardSession, sessionId } = useWizard();

  const [businessTypes, setBusinessTypes] = useState<
    Array<{ key: string; name: string; description: string; terminology: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  const [showBusinessTypeSuggestions, setShowBusinessTypeSuggestions] = useState(false);
  const [filteredBusinessTypes, setFilteredBusinessTypes] = useState<
    Array<{ key: string; name: string; description: string; terminology: string }>
  >([]);

  const [errors, setErrors] = useState<{ siteName?: string; businessType?: string; domain?: string; email?: string }>({});
  const [duplicateError, setDuplicateError] = useState<{ message?: string; suggestion?: string }>({});
  const [domainType, setDomainType] = useState<'subdomain' | 'custom'>('subdomain');

  // --- Async siteId generation request management --------------------------
  const inFlight = useRef(false);
  const lastSubmittedSiteName = useRef<string | null>(null);
  const duplicateCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load business types (kept async to match your V1 shape exactly)
  useEffect(() => {
    const loadBusinessTypes = async () => {
      try {
        const types = [
          { key: 'translation', name: 'Traduction', description: 'Services de traduction professionnelle', terminology: 'services' },
          { key: 'education', name: 'Éducation', description: 'Formation et enseignement', terminology: 'cours' },
          { key: 'plomberie', name: 'Plomberie', description: 'Services de plomberie et réparations', terminology: 'interventions' },
          { key: 'restaurant', name: 'Restaurant', description: 'Restaurant et gastronomie', terminology: 'spécialités' },
          { key: 'consulting', name: 'Conseil', description: 'Conseil et expertise', terminology: 'services' },
          { key: 'creative', name: 'Services créatifs', description: 'Design et créativité', terminology: 'services' },
          { key: 'healthcare', name: 'Santé', description: 'Services de santé et bien-être', terminology: 'soins' },
          { key: 'legal', name: 'Juridique', description: 'Services juridiques et légaux', terminology: 'services' },
          { key: 'technology', name: 'Technologie', description: 'Services informatiques et techniques', terminology: 'solutions' },
          { key: 'real-estate', name: 'Immobilier', description: 'Services immobiliers', terminology: 'services' },
        ];
        setBusinessTypes(types);
        setFilteredBusinessTypes(types);
      } catch (e) {
        console.error('Failed to load business types:', e);
      } finally {
        setLoading(false);
      }
    };
    loadBusinessTypes();
  }, []);

  // Generate unique Site ID from site name using backend API (with stale-response guard)
  const generateUniqueSiteId = useCallback((siteName: string): string => {
    if (!siteName || siteName.trim().length < 2) return '';
    return sanitizeSiteId(siteName);
  }, []);

  // --- Validation -----------------------------------------------------------
  const validateSiteName = useCallback((siteName: string) => {
    if (!siteName || siteName.trim().length < 2) {
      setErrors((p) => ({ ...p, siteName: 'Le nom du site doit contenir au moins 2 caractères' }));
    } else if (siteName.length > 50) {
      setErrors((p) => ({ ...p, siteName: 'Le nom du site ne peut pas dépasser 50 caractères' }));
    } else {
      setErrors((p) => ({ ...p, siteName: undefined }));
    }
  }, []);

  const validateBusinessType = useCallback((businessType: string) => {
    if (!businessType || businessType.trim().length < 2) {
      setErrors((p) => ({ ...p, businessType: "Le type d'activité est requis" }));
    } else {
      setErrors((p) => ({ ...p, businessType: undefined }));
    }
  }, []);


  const validateEmail = useCallback(() => {
    const email = wizardData.contact?.email?.trim() || '';
    if (!email) return setErrors((p) => ({ ...p, email: 'Email requis' }));
    // Lightweight email check
    const ok = /.+@.+\..+/.test(email);
    setErrors((p) => ({ ...p, email: ok ? undefined : 'Email invalide' }));
  }, [wizardData.contact?.email]);

  // Check for duplicate site names via API
  const checkDuplicate = useCallback(async (siteName: string) => {
    console.log('🔍 checkDuplicate called with:', siteName);

    if (!siteName || siteName.trim().length < 2) {
      console.log('❌ Site name too short, clearing duplicate error');
      setDuplicateError({});
      return;
    }

    try {
      const token = localStorage.getItem('customer_access_token');
      console.log('🔑 Token found:', token ? 'YES' : 'NO');

      console.log('📡 Making API call to /customer/wizard-sessions/check-duplicate...');
      console.log('🔑 Current sessionId:', sessionId);
      const response = await fetch('/customer/wizard-sessions/check-duplicate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          siteName: siteName.trim(),
          excludeSessionId: sessionId || undefined // Exclude current session from duplicate check
        }),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        console.error('❌ Duplicate check failed:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return;
      }

      const data = await response.json();
      console.log('✅ Duplicate check result:', data);

      if (data.isDuplicate) {
        console.log('⚠️ DUPLICATE DETECTED! Setting error...');
        setDuplicateError({
          message: 'Ce nom de site est déjà utilisé. Veuillez en choisir un autre.',
          suggestion: data.suggestion,
        });
        setErrors((p) => ({ ...p, siteName: 'Nom déjà utilisé' }));
        // Store duplicate flag in wizardData so navigation can access it
        updateWizardData({ isDuplicateSiteName: true } as any);
        console.log('✅ Duplicate error state set with suggestion:', data.suggestion);
      } else {
        console.log('✅ Name is unique, clearing error');
        console.log('📤 Setting isDuplicateSiteName to FALSE');
        setDuplicateError({});
        if (errors.siteName === 'Nom déjà utilisé') {
          setErrors((p) => ({ ...p, siteName: undefined }));
        }
        // Clear duplicate flag
        updateWizardData({ isDuplicateSiteName: false } as any);
        console.log('✅ isDuplicateSiteName flag should now be false');
      }
    } catch (error) {
      console.error('❌ Duplicate check error:', error);
    }
  }, [errors.siteName, updateWizardData, sessionId]);

  // --- Handlers -------------------------------------------------------------
  const handleSiteNameChange = useCallback(
    (siteName: string) => {
      // 1) Validate immediately
      validateSiteName(siteName);

      // 2) Clear any existing duplicate error when user types
      setDuplicateError({});

      // 3) Compute auto id from previous name
      const prevAutoId = sanitizeSiteId(wizardData.siteName || '');

      // 4) Update wizard data - this will trigger backend session creation
      // BUT the wizard-provider checks for siteName.length >= 3 before creating session
      const optimistic: any = {
        siteName,
        isDuplicateSiteName: false  // Clear duplicate flag when user types
      };
      if (wizardData.siteId === prevAutoId || !wizardData.siteId) {
        optimistic.siteId = sanitizeSiteId(siteName);
      }
      updateWizardData(optimistic);

      // 5) Debounce duplicate check to avoid blocking UI
      if (duplicateCheckTimeoutRef.current) {
        clearTimeout(duplicateCheckTimeoutRef.current);
      }

      if (siteName.trim().length >= 2) {
        duplicateCheckTimeoutRef.current = setTimeout(() => {
          checkDuplicate(siteName);
        }, 800); // Debounce 800ms
      } else {
        setDuplicateError({});
      }
    },
    [checkDuplicate, updateWizardData, validateSiteName, wizardData.siteId, wizardData.siteName]
  );

  const handleSiteIdChange = useCallback(
    (siteId: string) => {
      updateWizardData({ siteId: sanitizeSiteId(siteId) });
    },
    [updateWizardData]
  );

  const handleDomainChange = useCallback(
    (domain: string, type: 'subdomain' | 'custom') => {
      updateWizardData({ domain });
      setDomainType(type);
      setErrors((p) => ({ ...p, domain: undefined }));
    },
    [updateWizardData]
  );

  const handleBusinessTypeInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      updateWizardData({ businessType: value });

      // Filter suggestions
      if (value.length > 0) {
        const filtered = businessTypes.filter(
          (t) => t.name.toLowerCase().includes(value.toLowerCase()) || t.description.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredBusinessTypes(filtered);
        setShowBusinessTypeSuggestions(true);
      } else {
        setFilteredBusinessTypes(businessTypes);
        setShowBusinessTypeSuggestions(false);
      }

      // Terminology sync if exact match
      const matchingType = businessTypes.find((t) => t.name.toLowerCase() === value.toLowerCase());
      updateWizardData({ terminology: matchingType?.terminology || wizardData.terminology || 'services' });

      validateBusinessType(value);
    },
    [businessTypes, updateWizardData, validateBusinessType, wizardData.terminology]
  );

  const selectBusinessTypeSuggestion = useCallback(
    (key: string, name: string) => {
      const selected = businessTypes.find((t) => t.key === key);
      updateWizardData({ businessType: name, terminology: selected?.terminology || 'services' });
      setShowBusinessTypeSuggestions(false);
      setErrors((p) => ({ ...p, businessType: undefined }));
    },
    [businessTypes, updateWizardData]
  );

  // Keyboard navigation for suggestions
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const onBusinessTypeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showBusinessTypeSuggestions || filteredBusinessTypes.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filteredBusinessTypes.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filteredBusinessTypes.length) % filteredBusinessTypes.length);
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const s = filteredBusinessTypes[activeIndex];
        selectBusinessTypeSuggestion(s.key, s.name);
      } else if (e.key === 'Escape') {
        setShowBusinessTypeSuggestions(false);
      }
    },
    [activeIndex, filteredBusinessTypes, selectBusinessTypeSuggestion, showBusinessTypeSuggestions]
  );

  // Derived state: can proceed
  const canProceedFromStep2 = useMemo(() => {
    const ok = Boolean(
      wizardData.siteName &&
        wizardData.siteName.length >= 2 &&
        wizardData.businessType &&
        wizardData.businessType.length >= 2 &&
        wizardData.domain && // Ensure domain is selected
        wizardData.contact?.email // Ensure email is provided
    );
    const noErrors = !errors.siteName && !errors.businessType && !errors.domain && !errors.email && !duplicateError.message;
    return ok && noErrors;
  }, [
    duplicateError.message,
    errors.businessType,
    errors.domain,
    errors.email,
    errors.siteName,
    wizardData.businessType,
    wizardData.siteName,
    wizardData.domain,
    wizardData.contact?.email,
  ]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement des types d'activités...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-step p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Informations sur votre Entreprise</h2>
      <p className="text-gray-600 mb-8">Parlez-nous de votre entreprise pour personnaliser votre site</p>

      <div className="space-y-6">
        {/* Site Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom de votre site/entreprise *</label>
          <input
            type="text"
            value={wizardData.siteName || ''}
            onChange={(e) => handleSiteNameChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
              errors.siteName || duplicateError.message ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Mon Entreprise"
            maxLength={50}
            aria-invalid={Boolean(errors.siteName || duplicateError.message)}
            aria-describedby={errors.siteName ? 'siteNameError' : duplicateError.message ? 'duplicateError' : undefined}
          />
          {errors.siteName && (
            <div id="siteNameError" className="text-red-500 text-sm mt-1">
              {errors.siteName}
            </div>
          )}
          {duplicateError.message && (
            <div id="duplicateError" className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 font-medium">{duplicateError.message}</p>
                  {duplicateError.suggestion && (
                    <button
                      onClick={() => {
                        handleSiteNameChange(duplicateError.suggestion!);
                        setDuplicateError({});
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Utiliser "{duplicateError.suggestion}"
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Business Type (Free Input with Suggestions) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type d'activité *</label>
          <div className="relative">
            <input
              type="text"
              value={wizardData.businessType || ''}
              onChange={handleBusinessTypeInput}
              onKeyDown={onBusinessTypeKeyDown}
              onFocus={() => setShowBusinessTypeSuggestions(true)}
              onBlur={() => setTimeout(() => setShowBusinessTypeSuggestions(false), 150)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                errors.businessType ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Traduction, Éducation, Plomberie, Restaurant..."
              maxLength={50}
              role="combobox"
              aria-expanded={showBusinessTypeSuggestions}
              aria-controls="bt-suggestions"
              aria-autocomplete="list"
            />

            {/* Suggestions Dropdown */}
            {showBusinessTypeSuggestions && filteredBusinessTypes.length > 0 && (
              <div
                id="bt-suggestions"
                className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                role="listbox"
              >
                {filteredBusinessTypes.map((s, idx) => (
                  <div
                    key={s.key}
                    onMouseDown={(e) => {
                      // Prevent input blur before click handler
                      e.preventDefault();
                      selectBusinessTypeSuggestion(s.key, s.name);
                      setActiveIndex(-1);
                    }}
                    className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      idx === activeIndex ? 'bg-blue-50' : 'hover:bg-blue-50'
                    }`}
                    role="option"
                    aria-selected={idx === activeIndex}
                  >
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <div className="text-sm text-gray-600">{s.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.businessType && <div className="text-red-500 text-sm mt-1">{errors.businessType}</div>}
          <p className="text-sm text-gray-700 mt-1">Tapez librement ou choisissez une suggestion</p>
        </div>

        {/* Business Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description de votre entreprise</label>
          <textarea
            value={wizardData.businessDescription || ''}
            onChange={(e) => updateWizardData({ businessDescription: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Décrivez votre entreprise et vos services en quelques mots"
            maxLength={200}
          />
          <div className="text-sm text-gray-600 mt-1">{(wizardData.businessDescription || '').length}/200 caractères</div>
        </div>

        {/* Terminology */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Terme pour désigner vos prestations *</label>
          <input
            type="text"
            value={wizardData.terminology || 'services'}
            onChange={(e) => updateWizardData({ terminology: e.target.value || 'services' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder={`Ex: ${wizardData.terminology || 'services'}`}
            maxLength={30}
          />
          <p className="text-sm text-gray-700 mt-1">
            Ce terme sera utilisé dans la navigation et les titres (ex: "Services", "Interventions", "Cours", "Spécialités")
          </p>
        </div>

        {/* Domain Selector */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">🌐 Choisissez votre domaine</h3>
          {duplicateError.message ? (
            <div className="p-4 bg-gray-100 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-600">
                ⚠️ Veuillez d'abord choisir un nom de site unique avant de sélectionner un domaine.
              </p>
            </div>
          ) : (
            <DomainSelector
              onDomainChange={handleDomainChange}
              initialDomain={wizardData.domain}
              initialDomainType={domainType}
              siteName={wizardData.siteName}
            />
          )}
        </div>

        {/* Slogan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Slogan/Phrase d'accroche</label>
          <textarea
            value={wizardData.slogan || ''}
            onChange={(e) => updateWizardData({ slogan: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Phrase accrocheuse pour votre site"
            maxLength={100}
          />
          <div className="text-sm text-gray-600 mt-1">{(wizardData.slogan || '').length}/100 caractères</div>
        </div>

        {/* Generated Site ID Preview - EDITABLE */}
        {wizardData.siteName && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Identifiant du site</h3>
            <p className="text-sm text-gray-600 mb-2">Identifiant unique pour votre site :</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={wizardData.siteId || ''}
                onChange={(e) => handleSiteIdChange(e.target.value)}
                className="bg-white px-2 py-1 rounded text-blue-600 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                maxLength={30}
                placeholder="En cours de génération..."
              />
            </div>
            <p className="text-sm text-gray-700 mt-1">Cet identifiant sera utilisé pour créer votre site. Vous pouvez le modifier.</p>
          </div>
        )}

        {/* Contact Information */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">📞 Informations de Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={wizardData.contact?.email || ''}
                onChange={(e) => updateWizardData({ contact: { ...wizardData.contact, email: e.target.value } })}
                onBlur={validateEmail}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="contact@votre-site.com"
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'emailError' : undefined}
              />
              {errors.email && (
                <div id="emailError" className="text-red-500 text-sm mt-1">
                  {errors.email}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <input
                type="tel"
                value={wizardData.contact?.phone || ''}
                onChange={(e) => updateWizardData({ contact: { ...wizardData.contact, phone: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
              <input
                type="text"
                value={wizardData.contact?.address || ''}
                onChange={(e) => updateWizardData({ contact: { ...wizardData.contact, address: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Rue de la Paix, 75001 Paris"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Horaires d'ouverture</label>
              <input
                type="text"
                value={wizardData.contact?.hours || ''}
                onChange={(e) => updateWizardData({ contact: { ...wizardData.contact, hours: e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Lun-Ven 9h-18h"
              />
            </div>
          </div>
        </div>

        {/* (Optional) Surface canProceed for parent via context or props if needed */}
        <div className="pt-4">
          {duplicateError.message ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">
                ⛔ Impossible de continuer: Le nom de site est déjà utilisé. Veuillez choisir un nom unique.
              </p>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${
                canProceedFromStep2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {canProceedFromStep2 ? 'Étape prête' : "Informations manquantes ou invalides"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}