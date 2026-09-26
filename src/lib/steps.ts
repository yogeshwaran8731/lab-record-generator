import { LabRecordData, QuestionItem, WizardStep } from '../types';

export function createEmptyQuestion(questionNumber: number): QuestionItem {
  return {
    id: `q_${questionNumber}_${Date.now()}_${Math.random()}`,
    questionNumber,
    questionText: '',
    sourceCode: '',
    output: '',
    outputImages: [],
  };
}

export const INITIAL_DATA: LabRecordData = {
  regNo: '',
  date: '',
  exerciseNo: '',
  topic: '',
  aim: '',
  numQuestions: 1,
  questions: [createEmptyQuestion(1)],
  result: '',
};

export const DEMO_DATA: LabRecordData = {
  regNo: '2503717610421186',
  date: '01.09.2026',
  exerciseNo: '8',
  topic: 'MULTITHREADING',
  aim: 'To write and implement Java programs to demonstrate multithreading concepts including thread creation, lifecycle, synchronization, and producer-consumer problems.',
  numQuestions: 2,
  questions: [
    {
      id: 'q1',
      questionNumber: 1,
      questionText: 'Write a Java program to create multiple threads by extending the Thread class and implementing the Runnable interface.',
      sourceCode: `// Question 1: Thread Creation in Java
class ThreadA extends Thread {
    public void run() {
        for (int i = 1; i <= 3; i++) {
            System.out.println("Thread A: " + i);
            try { Thread.sleep(500); } catch (Exception e) {}
        }
    }
}

class ThreadB implements Runnable {
    public void run() {
        for (int i = 1; i <= 3; i++) {
            System.out.println("Thread B: " + i);
            try { Thread.sleep(500); } catch (Exception e) {}
        }
    }
}

public class MultiThreadingDemo {
    public static void main(String[] args) {
        ThreadA t1 = new ThreadA();
        Thread t2 = new Thread(new ThreadB());

        t1.start();
        t2.start();
    }
}`,
      output: `Thread A: 1
Thread B: 1
Thread A: 2
Thread B: 2
Thread A: 3
Thread B: 3
Execution completed successfully.`,
    },
    {
      id: 'q2',
      questionNumber: 2,
      questionText: 'Write a Java program to demonstrate thread synchronization using synchronized methods for shared resource access.',
      sourceCode: `// Question 2: Thread Synchronization
class Counter {
    private int count = 0;
    public synchronized void increment() {
        count++;
    }
    public int getCount() {
        return count;
    }
}

public class SyncDemo {
    public static void main(String[] args) throws InterruptedException {
        Counter c = new Counter();

        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 1000; i++) c.increment();
        });
        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 1000; i++) c.increment();
        });

        t1.start();
        t2.start();
        t1.join();
        t2.join();

        System.out.println("Final synchronized count: " + c.getCount());
    }
}`,
      output: `Starting concurrent threads...
Final synchronized count: 2000`,
    },
  ],
  result: 'Thus the Java programs demonstrating multithreading and thread synchronization were executed successfully and the outputs were verified.',
};

/**
 * Dynamically builds the ordered list of wizard steps based on the current number of questions.
 */
export function getWizardSteps(data: LabRecordData): WizardStep[] {
  const steps: WizardStep[] = [
    {
      key: 'regNo',
      stepNumber: 1,
      title: 'Register Number',
      shortLabel: 'Reg No',
      category: 'Header Details',
      description: 'Enter your official student register or roll number.',
      placeholder: 'e.g. 2503717610421186',
      type: 'text',
      helperTip: 'Placed in the top-left cell of the header table (Row 1).',
      getValue: (d) => d.regNo,
      setValue: (d, v) => ({ ...d, regNo: v }),
    },
    {
      key: 'date',
      stepNumber: 2,
      title: 'Date',
      shortLabel: 'Date',
      category: 'Header Details',
      description: 'Enter or select the date of the experiment.',
      placeholder: 'DD.MM.YYYY',
      type: 'date',
      helperTip: 'Placed in the bottom-left cell of the header table (Row 3).',
      getValue: (d) => d.date,
      setValue: (d, v) => ({ ...d, date: v }),
    },
    {
      key: 'exerciseNo',
      stepNumber: 3,
      title: 'Exercise Number',
      shortLabel: 'Ex. No',
      category: 'Header Details',
      description: 'Enter the exercise number.',
      placeholder: 'e.g. 8',
      type: 'text',
      helperTip: 'Placed in the middle-left cell as "Ex.No:<val>" and used in the filename.',
      getValue: (d) => d.exerciseNo,
      setValue: (d, v) => ({ ...d, exerciseNo: v }),
    },
    {
      key: 'topic',
      stepNumber: 4,
      title: 'Topic',
      shortLabel: 'Topic',
      category: 'Header Details',
      description: 'Enter the topic / title of the laboratory exercise.',
      placeholder: 'e.g. MULTITHREADING',
      type: 'text',
      helperTip: 'Centered in bold inside the right merged column of the header table.',
      getValue: (d) => d.topic,
      setValue: (d, v) => ({ ...d, topic: v }),
    },
    {
      key: 'aim',
      stepNumber: 5,
      title: 'Aim',
      shortLabel: 'Aim',
      category: 'Experiment Body',
      description: 'State the aim or objective of the experiment.',
      placeholder: 'e.g. To write and implement Java programs to demonstrate multithreading concepts...',
      type: 'textarea',
      helperTip: 'Placed under the bold AIM: heading.',
      getValue: (d) => d.aim,
      setValue: (d, v) => ({ ...d, aim: v }),
    },
    {
      key: 'numQuestions',
      stepNumber: 6,
      title: 'Number of Questions',
      shortLabel: 'No. of Qs',
      category: 'Questions Setup',
      description: 'How many questions are included in this lab record?',
      placeholder: '1',
      type: 'number',
      helperTip: 'For each question, you will be prompted for its Question, Source Code, and Output.',
      getValue: (d) => String(d.numQuestions || 1),
      setValue: (d, v) => {
        const count = Math.max(1, parseInt(v, 10) || 1);
        const newQuestions = [...d.questions];
        while (newQuestions.length < count) {
          newQuestions.push(createEmptyQuestion(newQuestions.length + 1));
        }
        return {
          ...d,
          numQuestions: count,
          questions: newQuestions.slice(0, count).map((q, idx) => ({
            ...q,
            questionNumber: idx + 1,
          })),
        };
      },
    },
  ];

  // Dynamically append 3 steps per question: Question, Source Code, Output
  const qCount = data.numQuestions || 1;
  for (let i = 0; i < qCount; i++) {
    const qNum = i + 1;

    // Question Statement
    steps.push({
      key: `q_${i}_text`,
      stepNumber: steps.length + 1,
      title: `Question ${qNum}: Problem Statement`,
      shortLabel: `Q${qNum} Question`,
      category: `Question ${qNum} of ${qCount}`,
      description: `Enter the question or problem statement for Question ${qNum}.`,
      placeholder: `e.g. Write a Java program for Question ${qNum}...`,
      type: 'textarea',
      helperTip: `Placed under Question ${qNum} -> QUESTION: heading.`,
      getValue: (d) => d.questions[i]?.questionText || '',
      setValue: (d, v) => {
        const updated = [...d.questions];
        if (!updated[i]) updated[i] = createEmptyQuestion(qNum);
        updated[i] = { ...updated[i], questionText: v };
        return { ...d, questions: updated };
      },
    });

    // Source Code
    steps.push({
      key: `q_${i}_code`,
      stepNumber: steps.length + 1,
      title: `Question ${qNum}: Source Code`,
      shortLabel: `Q${qNum} Code`,
      category: `Question ${qNum} of ${qCount}`,
      description: `Paste or write the complete source code for Question ${qNum}. Indentation is preserved.`,
      placeholder: `// Source code for Question ${qNum}\n...`,
      type: 'code',
      helperTip: `Placed under Question ${qNum} -> PROGRAM: heading.`,
      getValue: (d) => d.questions[i]?.sourceCode || '',
      setValue: (d, v) => {
        const updated = [...d.questions];
        if (!updated[i]) updated[i] = createEmptyQuestion(qNum);
        updated[i] = { ...updated[i], sourceCode: v };
        return { ...d, questions: updated };
      },
    });

    // Output
    steps.push({
      key: `q_${i}_output`,
      stepNumber: steps.length + 1,
      title: `Question ${qNum}: Output`,
      shortLabel: `Q${qNum} Output`,
      category: `Question ${qNum} of ${qCount}`,
      description: `Paste terminal output text and/or upload multiple pictures from your device with free-form crop & edit tools.`,
      placeholder: `Execution output for Question ${qNum}...`,
      type: 'code',
      helperTip: `Placed under Question ${qNum} -> OUTPUT: heading. Each output picture is formatted with 2 blank lines before and after.`,
      isOutputStep: true,
      questionIndex: i,
      getValue: (d) => d.questions[i]?.output || '',
      setValue: (d, v) => {
        const updated = [...d.questions];
        if (!updated[i]) updated[i] = createEmptyQuestion(qNum);
        updated[i] = { ...updated[i], output: v };
        return { ...d, questions: updated };
      },
      getImagesValue: (d): string[] => {
        const q = d.questions[i];
        if (q && q.outputImages && q.outputImages.length > 0) {
          return q.outputImages;
        }
        if (q && q.outputImage) {
          return [q.outputImage];
        }
        return [];
      },
      setImagesValue: (d, imgs) => {
        const updated = [...d.questions];
        if (!updated[i]) updated[i] = createEmptyQuestion(qNum);
        updated[i] = { ...updated[i], outputImages: imgs, outputImage: imgs[0] };
        return { ...d, questions: updated };
      },
      getImageValue: (d) => d.questions[i]?.outputImage,
      setImageValue: (d, imgUri) => {
        const updated = [...d.questions];
        if (!updated[i]) updated[i] = createEmptyQuestion(qNum);
        const currentImgs = updated[i].outputImages || [];
        const nextImgs = imgUri ? [...currentImgs, imgUri] : [];
        updated[i] = { ...updated[i], outputImages: nextImgs, outputImage: imgUri };
        return { ...d, questions: updated };
      },
    });
  }

  // Final Step: Result
  steps.push({
    key: 'result',
    stepNumber: steps.length + 1,
    title: 'Result',
    shortLabel: 'Result',
    category: 'Conclusion',
    description: 'Enter the concluding result statement.',
    placeholder: 'e.g. Thus the programs were executed successfully and the outputs were verified.',
    type: 'textarea',
    helperTip: 'Placed at the bottom of the document under the bold RESULT: heading.',
    getValue: (d) => d.result,
    setValue: (d, v) => ({ ...d, result: v }),
  });

  return steps;
}
