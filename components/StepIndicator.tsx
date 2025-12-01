import React from 'react';
import { ResultStep } from '../types';

interface StepIndicatorProps {
  currentStep: ResultStep;
  totalSteps: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div 
            className={`
              w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
              ${step === currentStep ? 'bg-blue-600 text-white shadow-md' : 
                step < currentStep ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}
            `}
          >
            {step < currentStep ? '✓' : step}
          </div>
          {step < totalSteps && (
            <div className={`w-12 h-1 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
};