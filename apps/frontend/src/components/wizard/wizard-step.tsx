'use client';

import React from 'react';

interface WizardStepProps {
  children: React.ReactNode;
}

export function WizardStep({ children }: WizardStepProps) {
  return (
    <div className="p-8">
      {children}
    </div>
  );
}