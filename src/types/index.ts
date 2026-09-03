export interface QuestionItem {
  id: string;
  questionNumber: number;
  questionText: string;
  sourceCode: string;
  output: string;
}

export interface LabRecordData {
  regNo: string;
  date: string;
  exerciseNo: string;
  topic: string;
  aim: string;
  numQuestions: number;
  questions: QuestionItem[];
  result: string;
}

export type WizardStepType = 'text' | 'date' | 'number' | 'textarea' | 'code';

export interface WizardStep {
  key: string;
  stepNumber: number;
  title: string;
  shortLabel: string;
  category?: string;
  description: string;
  placeholder: string;
  type: WizardStepType;
  helperTip?: string;
  getValue: (data: LabRecordData) => string;
  setValue: (data: LabRecordData, value: string) => LabRecordData;
}
