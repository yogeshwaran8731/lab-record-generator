'use client';

import React, { useState, useMemo } from 'react';
import { LabRecordData } from '../types';
import { INITIAL_DATA, DEMO_DATA, getWizardSteps } from '../lib/steps';
import { ProgressHeader } from '../components/ProgressHeader';
import { StepField } from '../components/StepField';
import { ReviewModal } from '../components/ReviewModal';
import { downloadLabRecordDocx } from '../lib/docx-generator';
import {
  FileDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  RotateCcw,
  CheckCircle,
  Eye,
  FileText,
} from 'lucide-react';

export default function LabRecordGeneratorPage() {
  const [data, setData] = useState<LabRecordData>(INITIAL_DATA);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Compute dynamic steps based on current number of questions
  const steps = useMemo(() => getWizardSteps(data), [data.numQuestions, data.questions.length]);

  // Ensure current step index remains valid if question count decreases
  const safeStepIndex = Math.min(currentStepIndex, steps.length - 1);
  const currentStep = steps[safeStepIndex] || steps[0];
  const isFirstStep = safeStepIndex === 0;
  const isLastStep = safeStepIndex === steps.length - 1;

  // Update field value using the current step's setter
  const handleFieldChange = (val: string) => {
    setData((prev) => currentStep.setValue(prev, val));
    if (error) setError(null);
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const val = currentStep.getValue(data);
    if (!val || val.trim().length === 0) {
      setError(`"${currentStep.title}" is required.`);
      return false;
    }
    if (currentStep.key === 'numQuestions') {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) {
        setError('Number of questions must be at least 1.');
        return false;
      }
    }
    setError(null);
    return true;
  };

  // Navigate to Next step
  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (isLastStep) {
      handleDownload();
    } else {
      setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  // Navigate to Previous step
  const handlePrevious = () => {
    setError(null);
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  // Jump to specific step
  const handleSelectStep = (idx: number) => {
    setError(null);
    setCurrentStepIndex(idx);
  };

  // Download Word (.docx) file
  const handleDownload = async () => {
    if (!validateCurrentStep()) return;

    try {
      setIsDownloading(true);
      const filename = await downloadLabRecordDocx(data);
      setDownloadSuccess(filename);
      setTimeout(() => setDownloadSuccess(null), 8000);
    } catch (err) {
      console.error('Failed to generate document:', err);
      alert('An error occurred while generating the Word file. Please check your inputs.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Load sample demo data
  const handleLoadDemo = () => {
    setData(DEMO_DATA);
    setCurrentStepIndex(0);
    setError(null);
  };

  // Reset form
  const handleReset = () => {
    if (confirm('Are you sure you want to clear all fields and start over?')) {
      setData(INITIAL_DATA);
      setCurrentStepIndex(0);
      setError(null);
      setDownloadSuccess(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
      {/* Top Bar / Header */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-xs">
            LR
          </div>
          <div>
            <h1 className="font-semibold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-100">
              Lab Record Generator
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Matches Reference Template &amp; Multi-Question Flow
            </p>
          </div>
        </div>

        {/* Header Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors shadow-xs"
            title="Populate with the reference Multithreading lab demo (2 questions)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Load Sample</span>
            <span className="sm:hidden">Sample</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Reset form"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Wizard Card Container */}
      <main className="max-w-2xl w-full mx-auto my-6 flex-1 flex flex-col justify-center">
        {/* Success Banner */}
        {downloadSuccess && (
          <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm shadow-xs animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Document Generated Successfully!</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Downloaded as <strong className="font-mono">{downloadSuccess}</strong>
              </p>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
          {/* Wizard Progress & Stepper */}
          <ProgressHeader
            steps={steps}
            currentStepIndex={safeStepIndex}
            data={data}
            onSelectStep={handleSelectStep}
          />

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Current Step Input */}
          <div className="min-h-[240px] flex flex-col justify-center">
            <StepField
              step={currentStep}
              value={currentStep.getValue(data)}
              onChange={handleFieldChange}
              onNext={handleNext}
              error={error}
            />
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-1 gap-3">
            {/* Left action: Previous or Review */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Review full record and all questions"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Review All</span>
              </button>
            </div>

            {/* Right action: Next or Download Word */}
            {isLastStep ? (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                <span>{isDownloading ? 'Generating...' : 'Download Word'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg shadow-sm transition-all hover:shadow-md"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Word Document Format Note */}
        <div className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-zinc-400" />
          <span>Format: Page Border Box (All Pages) • Header Table • Questions with 2 blank lines • RESULT at bottom-most of last page</span>
        </div>
      </main>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        data={data}
        steps={steps}
        onEditStep={handleSelectStep}
        onDownload={handleDownload}
        isDownloading={isDownloading}
      />

      {/* Footer */}
      <footer className="max-w-2xl w-full mx-auto text-center py-2 text-xs text-zinc-400 dark:text-zinc-600">
        Lab Record Generator • Runs 100% locally &amp; client-side
      </footer>
    </div>
  );
}
