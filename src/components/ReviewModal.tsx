'use client';

import React from 'react';
import { LabRecordData, WizardStep } from '../types';
import { FileText, Download, Edit3, X, CheckCircle2 } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LabRecordData;
  steps: WizardStep[];
  onEditStep: (stepIndex: number) => void;
  onDownload: () => void;
  isDownloading: boolean;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  data,
  steps,
  onEditStep,
  onDownload,
  isDownloading,
}) => {
  if (!isOpen) return null;

  const cleanEx = (data.exerciseNo || '1').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanReg = (data.regNo || 'Record').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const expectedFilename = `Ex-${cleanEx}-${cleanReg}.docx`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Review Lab Record
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Verify formatted layout and all {data.numQuestions} question(s) before downloading
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Header Table Preview - Matching Reference Image */}
          <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Header Table (Matches Reference Template)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono text-zinc-600 dark:text-zinc-400">
                  Page Border: All Pages
                </span>
                <span className="text-[11px] text-zinc-500">Times New Roman 12pt Bold</span>
              </div>
            </div>

            {/* Visual 2-Column Table */}
            <div className="grid grid-cols-12 border-2 border-zinc-900 dark:border-zinc-300 font-serif bg-white dark:bg-zinc-900">
              {/* Left Column (3 rows) */}
              <div className="col-span-4 border-r-2 border-zinc-900 dark:border-zinc-300 flex flex-col justify-between">
                <div className="p-2 border-b-2 border-zinc-900 dark:border-zinc-300 font-bold text-xs">
                  {data.regNo || '—'}
                </div>
                <div className="p-2 border-b-2 border-zinc-900 dark:border-zinc-300 font-bold text-xs">
                  Ex.No:{data.exerciseNo || '—'}
                </div>
                <div className="p-2 font-bold text-xs">
                  {data.date || '—'}
                </div>
              </div>

              {/* Right Merged Column (Topic centered) */}
              <div className="col-span-8 flex items-center justify-center p-4 text-center font-bold text-sm tracking-wide">
                {data.topic ? data.topic.toUpperCase() : '—'}
              </div>
            </div>
          </div>

          {/* Aim Section */}
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-xs text-zinc-900 dark:text-zinc-100">
                AIM:
              </span>
              <button
                type="button"
                onClick={() => {
                  const aimIdx = steps.findIndex((s) => s.key === 'aim');
                  if (aimIdx >= 0) onEditStep(aimIdx);
                  onClose();
                }}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1"
                title="Edit Aim"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-serif">
              {data.aim || '—'}
            </p>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Questions ({data.questions.length})
            </h4>

            {data.questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="font-serif font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    Question {q.questionNumber || idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const qStepIdx = steps.findIndex((s) => s.key === `q_${idx}_text`);
                      if (qStepIdx >= 0) onEditStep(qStepIdx);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Question {idx + 1}</span>
                  </button>
                </div>

                {/* Question */}
                <div className="space-y-1">
                  <span className="font-serif font-bold text-[11px] text-zinc-800 dark:text-zinc-200">
                    QUESTION:
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-serif">
                    {q.questionText || '—'}
                  </p>
                </div>

                {/* Program */}
                <div className="space-y-1">
                  <span className="font-serif font-bold text-[11px] text-zinc-800 dark:text-zinc-200">
                    PROGRAM:
                  </span>
                  <pre className="text-xs font-mono bg-zinc-100 dark:bg-zinc-950 p-2.5 rounded border border-zinc-200 dark:border-zinc-800 max-h-32 overflow-y-auto text-zinc-800 dark:text-zinc-300 whitespace-pre">
                    {q.sourceCode || '—'}
                  </pre>
                </div>

                {/* Output */}
                <div className="space-y-1">
                  <span className="font-serif font-bold text-[11px] text-zinc-800 dark:text-zinc-200">
                    OUTPUT:
                  </span>
                  <pre className="text-xs font-mono bg-zinc-100 dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800 max-h-24 overflow-y-auto text-zinc-800 dark:text-zinc-300 whitespace-pre">
                    {q.output || '—'}
                  </pre>
                </div>

                {idx < data.questions.length - 1 && (
                  <div className="text-[10px] font-mono text-zinc-400 text-center py-1 bg-zinc-50 dark:bg-zinc-950/50 rounded border border-dashed border-zinc-200 dark:border-zinc-800">
                    [Two blank lines between questions]
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Result Section */}
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-xs text-zinc-900 dark:text-zinc-100">
                RESULT: (Placed at bottom of page)
              </span>
              <button
                type="button"
                onClick={() => {
                  const resIdx = steps.findIndex((s) => s.key === 'result');
                  if (resIdx >= 0) onEditStep(resIdx);
                  onClose();
                }}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1"
                title="Edit Result"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-serif">
              {data.result || '—'}
            </p>
          </div>

          {/* Filename Info */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Target file: <strong className="font-mono">{expectedFilename}</strong>
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
          >
            Back to Editor
          </button>
          <button
            type="button"
            onClick={() => {
              onDownload();
              onClose();
            }}
            disabled={isDownloading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Generating...' : 'Download Word (.docx)'}
          </button>
        </div>
      </div>
    </div>
  );
};
