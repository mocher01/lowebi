'use client';

import React from 'react';

interface FeatureCardProps {
  title: string;
  badge?: string;
  phase?: string;
  available?: boolean;
  blockedReason?: string;
  children: React.ReactNode;
  className?: string;
}

export function FeatureCard({
  title,
  badge,
  phase,
  available = true,
  blockedReason,
  children,
  className = ''
}: FeatureCardProps) {
  return (
    <div
      className={`border rounded-lg p-6 transition-all ${
        !available ? 'opacity-60 bg-gray-50' : 'bg-white'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2">
          {badge && (
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                available
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {badge}
            </span>
          )}
          {phase && (
            <span className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-600">
              {phase}
            </span>
          )}
        </div>
      </div>

      {/* Blocked reason alert */}
      {!available && blockedReason && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ {blockedReason}
          </p>
        </div>
      )}

      {/* Content */}
      <div className={!available ? 'pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
}
