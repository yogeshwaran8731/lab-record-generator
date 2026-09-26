'use client';

import React, { useRef, useEffect } from 'react';
import { WizardStep } from '../types';
import { OutputMediaInput } from './OutputMediaInput';
import { Calendar, Sparkles, Minus, Plus, Code, Terminal, Info } from 'lucide-react';

interface StepFieldProps {
  step: WizardStep;
  value: string;
  imageValue?: string;
  imagesValue?: string[];
  onChange: (value: string) => void;
  onChangeImage?: (imageUri: string | undefined) => void;
  onChangeImages?: (images: string[]) => void;
  onNext: () => void;
  error?: string | null;
}

export const StepField: React.FC<StepFieldProps> = ({
  step,
  value,
  imageValue,
  imagesValue,
  onChange,
  onChangeImage,
  onChangeImages,
  onNext,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Auto-focus when step changes (for non-output or standard inputs)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [step.key]);

  // Handle Tab key inside code/output textarea to indent with 4 spaces instead of blurring
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (step.type === 'code' || step.type === 'textarea') {
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = e.currentTarget as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // Insert 4 spaces
        const updated = value.substring(0, start) + '    ' + value.substring(end);
        onChange(updated);

        // Restore cursor position after update
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
        return;
      }

      // Cmd/Ctrl + Enter to submit multiline textareas
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onNext();
        return;
      }
    } else {
      // Single line inputs: Enter key advances
      if (e.key === 'Enter') {
        e.preventDefault();
        onNext();
      }
    }
  };

  // Helper for quick date insertion
  const setTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    onChange(`${dd}.${mm}.${yyyy}`);
  };

  // Quick helper for academic result text
  const setStandardResult = () => {
    onChange('Thus the program was executed successfully and the output was verified.');
  };

  return (
    <div className="space-y-4">
      {/* Header with Title & Description */}
      <div className="space-y-1">
        {step.category && (
          <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {step.category}
          </span>
        )}
        <div className="flex items-center justify-between">
          <label
            htmlFor={step.key}
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            {step.title}
          </label>
          <span className="text-xs text-rose-500 font-medium">Required</span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {step.description}
        </p>
      </div>

      {/* Input Field based on type */}
      <div className="relative">
        {step.type === 'text' && (
          <input
            id={step.key}
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={step.placeholder}
            className={`w-full px-4 py-3 text-base rounded-lg border bg-white dark:bg-zinc-950 transition-colors shadow-xs outline-none ${
              error
                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10'
            }`}
          />
        )}

        {step.type === 'date' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                id={step.key}
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="DD.MM.YYYY"
                className={`flex-1 px-4 py-3 text-base rounded-lg border bg-white dark:bg-zinc-950 transition-colors shadow-xs outline-none ${
                  error
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10'
                }`}
              />
              <button
                type="button"
                onClick={setTodayDate}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300 shrink-0"
              >
                <Calendar className="w-4 h-4 text-zinc-500" />
                Today
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Format: DD.MM.YYYY (e.g. 01.09.2026)
            </p>
          </div>
        )}

        {step.type === 'number' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const current = parseInt(value, 10) || 1;
                if (current > 1) onChange(String(current - 1));
              }}
              className="p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Decrease"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              id={step.key}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="number"
              min="1"
              max="20"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-28 text-center px-4 py-3 text-base font-semibold rounded-lg border bg-white dark:bg-zinc-950 transition-colors shadow-xs outline-none ${
                error
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-2'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                const current = parseInt(value, 10) || 1;
                onChange(String(current + 1));
              }}
              className="p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Increase"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        {step.type === 'textarea' && (
          <div className="space-y-2">
            <textarea
              id={step.key}
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              rows={4}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={step.placeholder}
              className={`w-full px-4 py-3 text-base rounded-lg border bg-white dark:bg-zinc-950 transition-colors shadow-xs outline-none resize-y ${
                error
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10'
              }`}
            />
            {step.key === 'result' && (
              <button
                type="button"
                onClick={setStandardResult}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Use Standard Academic Result
              </button>
            )}
            <p className="text-xs text-zinc-400">
              Tip: Press <kbd className="px-1 py-0.5 border rounded text-[11px] bg-zinc-100 dark:bg-zinc-800">Ctrl</kbd> + <kbd className="px-1 py-0.5 border rounded text-[11px] bg-zinc-100 dark:bg-zinc-800">Enter</kbd> to advance
            </p>
          </div>
        )}

        {step.type === 'code' && (
          <div>
            {step.isOutputStep ? (
              <OutputMediaInput
                value={value}
                images={imagesValue || (imageValue ? [imageValue] : [])}
                placeholder={step.placeholder}
                onChangeText={onChange}
                onChangeImages={
                  onChangeImages ||
                  ((newImgs) => {
                    if (onChangeImage) onChangeImage(newImgs[0] || undefined);
                  })
                }
                onKeyDown={handleKeyDown}
                inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
              />
            ) : (
              <div className="space-y-2">
                <div className="relative rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden bg-zinc-950 text-zinc-100 shadow-inner">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Code className="w-3.5 h-3.5 text-emerald-400" />
                      Source Code Editor
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Tab key indents with 4 spaces
                    </span>
                  </div>
                  <textarea
                    id={step.key}
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    rows={9}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={step.placeholder}
                    spellCheck={false}
                    className="w-full px-4 py-3 font-mono text-sm bg-transparent text-zinc-100 outline-none resize-y placeholder:text-zinc-600 leading-relaxed"
                  />
                </div>
                <p className="text-xs text-zinc-400">
                  Indentation and line breaks will be preserved exactly in the Word document.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Error Message */}
      {error && (
        <p className="text-xs font-medium text-rose-500 animate-pulse">
          ⚠️ {error}
        </p>
      )}

      {/* Helper placement note */}
      {step.helperTip && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
          <span>{step.helperTip}</span>
        </div>
      )}
    </div>
  );
};
