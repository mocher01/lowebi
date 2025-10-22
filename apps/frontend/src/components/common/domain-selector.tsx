'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

export interface DomainSelectorProps {
  onDomainChange: (domain: string, domainType: 'subdomain' | 'custom') => void;
  initialDomain?: string;
  initialDomainType?: 'subdomain' | 'custom';
  siteName?: string;
}

const DOMAIN_BASE = 'logen.locod-ai.com';

export function DomainSelector({
  onDomainChange,
  initialDomain = '',
  initialDomainType = 'subdomain',
  siteName = '',
}: DomainSelectorProps) {
  const [domainType, setDomainType] = useState<'subdomain' | 'custom'>(initialDomainType);
  const [subdomainInput, setSubdomainInput] = useState('');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{
    available?: boolean;
    suggestions?: string[];
    error?: string;
  }>({});

  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from initial values
  useEffect(() => {
    if (initialDomain) {
      if (initialDomainType === 'subdomain') {
        // Extract subdomain from full domain (e.g., "mysite.logen.locod-ai.com" -> "mysite")
        const subdomain = initialDomain.replace(`.${DOMAIN_BASE}`, '');
        setSubdomainInput(subdomain);
      } else {
        setCustomDomainInput(initialDomain);
      }
    }
  }, [initialDomain, initialDomainType]);

  // Track if user has manually edited the subdomain
  const userEditedSubdomainRef = useRef(false);
  const lastSuggestedFromSiteNameRef = useRef<string>('');

  // Auto-suggest subdomain from site name
  useEffect(() => {
    if (siteName && domainType === 'subdomain') {
      const suggested = sanitizeSubdomain(siteName);

      // Only auto-update if:
      // 1. User hasn't manually edited the subdomain OR
      // 2. Current subdomain matches the last auto-suggested value (user accepted it)
      const currentMatchesLastSuggestion = subdomainInput === lastSuggestedFromSiteNameRef.current;

      if (suggested && (!userEditedSubdomainRef.current || currentMatchesLastSuggestion || !subdomainInput)) {
        setSubdomainInput(suggested);
        lastSuggestedFromSiteNameRef.current = suggested;
        userEditedSubdomainRef.current = false; // Reset since we're updating from siteName

        // CRITICAL FIX: Notify parent of auto-suggested domain
        onDomainChange(`${suggested}.${DOMAIN_BASE}`, 'subdomain');
      }
    }
  }, [siteName, subdomainInput, domainType, onDomainChange]);

  // Sanitize subdomain input
  const sanitizeSubdomain = (input: string): string => {
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9-]/g, '') // Keep only alphanumeric and hyphens
      .replace(/--+/g, '-') // Collapse consecutive hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .slice(0, 63); // Max length
  };

  // Check subdomain availability (debounced)
  const checkSubdomainAvailability = useCallback(async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setAvailabilityResult({});
      return;
    }

    setIsCheckingAvailability(true);
    setAvailabilityResult({});

    try {
      const token = localStorage.getItem('customer_access_token');
      const response = await fetch('/customer/domains/check-availability', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ subdomain }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setAvailabilityResult({
          available: false,
          error: errorData.message || 'Erreur lors de la vérification',
        });
        return;
      }

      const data = await response.json();
      setAvailabilityResult({
        available: data.available,
        suggestions: data.suggestions,
      });
    } catch (error) {
      console.error('Availability check error:', error);
      setAvailabilityResult({
        available: false,
        error: 'Impossible de vérifier la disponibilité',
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  }, []);

  // Handle subdomain input change with debouncing
  const handleSubdomainChange = useCallback(
    (value: string) => {
      const sanitized = sanitizeSubdomain(value);
      setSubdomainInput(sanitized);

      // Mark that user has manually edited this field
      userEditedSubdomainRef.current = true;

      // Clear previous timeout
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      // Notify parent immediately with the current value
      if (sanitized) {
        onDomainChange(`${sanitized}.${DOMAIN_BASE}`, 'subdomain');
      }

      // Debounce availability check
      if (sanitized.length >= 3) {
        checkTimeoutRef.current = setTimeout(() => {
          checkSubdomainAvailability(sanitized);
        }, 500);
      } else {
        setAvailabilityResult({});
      }
    },
    [checkSubdomainAvailability, onDomainChange]
  );

  // Handle custom domain input
  const handleCustomDomainChange = useCallback(
    (value: string) => {
      setCustomDomainInput(value);
      if (value) {
        onDomainChange(value, 'custom');
      }
    },
    [onDomainChange]
  );

  // Handle domain type change
  const handleDomainTypeChange = useCallback(
    (type: 'subdomain' | 'custom') => {
      setDomainType(type);
      setAvailabilityResult({});

      if (type === 'subdomain' && subdomainInput) {
        onDomainChange(`${subdomainInput}.${DOMAIN_BASE}`, 'subdomain');
      } else if (type === 'custom' && customDomainInput) {
        onDomainChange(customDomainInput, 'custom');
      }
    },
    [subdomainInput, customDomainInput, onDomainChange]
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setSubdomainInput(suggestion);
      onDomainChange(`${suggestion}.${DOMAIN_BASE}`, 'subdomain');
      checkSubdomainAvailability(suggestion);
    },
    [checkSubdomainAvailability, onDomainChange]
  );

  // Validate subdomain format
  const getSubdomainError = (): string | null => {
    if (!subdomainInput) return null;
    if (subdomainInput.length < 3) return 'Minimum 3 caractères';
    if (subdomainInput.length > 63) return 'Maximum 63 caractères';
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomainInput)) {
      return 'Caractères invalides (a-z, 0-9, -)';
    }
    if (subdomainInput.includes('--')) return 'Pas de tirets consécutifs';
    if (/^\d+$/.test(subdomainInput)) return 'Ne peut pas être que des chiffres';
    return null;
  };

  const subdomainError = getSubdomainError();

  return (
    <div className="space-y-4">
      {/* Domain Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Type de domaine *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Subdomain Option */}
          <button
            type="button"
            onClick={() => handleDomainTypeChange('subdomain')}
            className={`relative p-4 border-2 rounded-lg text-left transition-all ${
              domainType === 'subdomain'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">Sous-domaine</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Gratuit
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Activation instantanée avec SSL inclus
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ex: votresite.{DOMAIN_BASE}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  domainType === 'subdomain'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {domainType === 'subdomain' && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          </button>

          {/* Custom Domain Option */}
          <button
            type="button"
            onClick={() => handleDomainTypeChange('custom')}
            className={`relative p-4 border-2 rounded-lg text-left transition-all ${
              domainType === 'custom'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">Domaine personnalisé</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    Premium
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Nécessite une vérification DNS
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ex: votresite.com
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  domainType === 'custom'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {domainType === 'custom' && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Subdomain Input */}
      {domainType === 'subdomain' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sous-domaine souhaité *
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={subdomainInput}
              onChange={(e) => handleSubdomainChange(e.target.value)}
              placeholder="mon-entreprise"
              maxLength={63}
              className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                subdomainError || (availabilityResult.available === false && !availabilityResult.suggestions)
                  ? 'border-red-500'
                  : availabilityResult.available === true
                  ? 'border-green-500'
                  : 'border-gray-300'
              }`}
            />
            <span className="text-gray-600 whitespace-nowrap">.{DOMAIN_BASE}</span>
          </div>

          {/* Validation feedback */}
          {subdomainError && (
            <p className="text-red-500 text-sm mt-1">{subdomainError}</p>
          )}

          {/* Availability feedback */}
          {!subdomainError && isCheckingAvailability && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Vérification de la disponibilité...</span>
            </div>
          )}

          {!subdomainError && !isCheckingAvailability && availabilityResult.available === true && (
            <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Disponible ! Ce sous-domaine est libre.</span>
            </div>
          )}

          {!subdomainError && !isCheckingAvailability && availabilityResult.available === false && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 font-medium">
                    Ce sous-domaine n'est pas disponible
                  </p>
                  {availabilityResult.suggestions && availabilityResult.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-yellow-700 mb-1">Suggestions disponibles :</p>
                      <div className="flex flex-wrap gap-2">
                        {availabilityResult.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-2 py-1 text-xs bg-white border border-yellow-300 rounded hover:bg-yellow-50 text-yellow-800 font-medium"
                          >
                            {suggestion}.{DOMAIN_BASE}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {availabilityResult.error && (
            <p className="text-red-500 text-sm mt-2">{availabilityResult.error}</p>
          )}

          <p className="text-xs text-gray-600 mt-2">
            Votre site sera accessible à : {subdomainInput || 'votresite'}.{DOMAIN_BASE}
          </p>
        </div>
      )}

      {/* Custom Domain Input */}
      {domainType === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Votre domaine personnalisé *
          </label>
          <input
            type="text"
            value={customDomainInput}
            onChange={(e) => handleCustomDomainChange(e.target.value)}
            placeholder="votresite.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <p className="text-xs text-gray-600 mt-2">
            Format : votresite.com (sans http:// ou https://)
          </p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Vous recevrez un jeton de vérification DNS à configurer chez votre
              registrar. Un sous-domaine temporaire sera créé pour un accès immédiat pendant la
              vérification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
