'use client';

import React from 'react';
import { WizardStep, LabRecordData } from '../types';
import { Check } from 'lucide-react';

interface ProgressHeaderProps {
  steps: WizardStep[];
  currentStepIndex: number;
  data: LabRecordData;
  onSelectStep: (index: number) => void;
}

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  steps,
  currentStepIndex,
  data,
  onSelectStep,
}) => {
  const currentStep = steps[currentStepIndex] || steps[0];
  const totalSteps = steps.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  const isStepCompleted = (step: WizardStep) => {
    const val = step.getValue(data);
    return typeof val === 'string' && val.trim().length > 0;
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Status & Percentage */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
          <span className="text-zinc-400 dark:text-zinc-500">•</span>
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">
            {currentStep.category ? `${currentStep.category} — ` : ''}
            {currentStep.shortLabel}
          </span>
        </div>
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          {progressPercent}% completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Responsive Step Navigation Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar pt-1">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isDone = isStepCompleted(step);

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onSelectStep(idx)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all duration-150 shrink-0 ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : isDone
                  ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
              }`}
              title={`Jump to Step ${idx + 1}: ${step.title}`}
            >
              {isDone && !isActive ? (
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="w-3.5 text-center">{idx + 1}</span>
              )}
              <span className="hidden sm:inline">{step.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
