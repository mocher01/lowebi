'use client';

import React from 'react';

interface WizardProgressProps {
  steps: Array<{ id: string; title: string }>;
  currentStep: number;
}

export function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  return (
    <div className="w-full px-4">
      {/* Desktop Progress Bar */}
      <div className="hidden md:block relative">
        <div className="flex items-start justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center relative flex-1">
              {/* Step Circle */}
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm ${
                  index < currentStep
                    ? 'bg-green-600 border-green-600 text-white shadow-green-200'
                    : index === currentStep
                    ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Step Title */}
              <div className="mt-3 text-center px-1">
                <span
                  className={`text-sm font-medium leading-tight block ${
                    index < currentStep
                      ? 'text-green-700'
                      : index === currentStep
                      ? 'text-blue-700'
                      : 'text-gray-500'
                  }`}
                  style={{ maxWidth: '100px' }}
                >
                  {step.title}
                </span>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-6 left-1/2 h-0.5 transition-all duration-300 -z-10 ${
                    index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                  style={{
                    width: `calc(100% - 24px)`, // Full width minus half circles on each side
                    transform: 'translateX(12px)' // Center and offset to start after circle edge
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="mt-4 block md:hidden">
        <div className="bg-gray-200 rounded-full h-3 shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 text-center">
          <div className="text-sm font-semibold text-gray-900">
            {steps[currentStep]?.title}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Étape {currentStep + 1} sur {steps.length}
          </div>
        </div>
      </div>
    </div>
  );
}