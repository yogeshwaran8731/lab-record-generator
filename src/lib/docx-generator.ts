import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ImageRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  VerticalAlign,
  VerticalMergeType,
  TableAnchorType,
  VerticalPositionAlign,
  HorizontalPositionAlign,
  PageBorderDisplay,
  PageBorderOffsetFrom,
  PageBorderZOrder,
} from 'docx';
import { LabRecordData } from '../types/index';
import { parseDataUrlImage } from './image-utils';

/**
 * Converts multiline text into an array of docx Paragraphs.
 * Preserves exact line breaks and spaces/tabs for program code and outputs.
 */
function createContentParagraphs(
  rawText: string,
  options: {
    preserveIndentation?: boolean;
    spacingBefore?: number;
    spacingAfter?: number;
  } = {}
): Paragraph[] {
  if (!rawText) return [];

  const lines = rawText.split(/\r?\n/);

  return lines.map((line) => {
    const formattedLine = options.preserveIndentation
      ? line.replace(/\t/g, '    ')
      : line;

    return new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: {
        before: options.spacingBefore ?? 0,
        after: options.spacingAfter ?? 0,
        line: 240, // Single line spacing
      },
      children: [
        new TextRun({
          text: formattedLine,
          font: 'Times New Roman',
          size: 24, // 12 pt (24 half-points)
        }),
      ],
    });
  });
}

/**
 * Creates a bold section heading paragraph (e.g. AIM:, QUESTION:, PROGRAM:, OUTPUT:, Question 1)
 */
function createSectionHeading(
  title: string,
  spacingBefore: number = 240,
  spacingAfter: number = 0
): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: {
      before: spacingBefore,
      after: spacingAfter,
      line: 240, // Single line spacing
    },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: 'Times New Roman',
        size: 24, // 12 pt
      }),
    ],
  });
}

/**
 * Generates an empty blank line paragraph.
 */
function createEmptyLine(): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: 0, line: 240 },
    children: [
      new TextRun({
        text: '',
        font: 'Times New Roman',
        size: 24,
      }),
    ],
  });
}

/**
 * Creates a floating table for RESULT anchored to the absolute bottom-most margin of the last page.
 */
function createResultBottomTable(resultText: string): Table {
  const resultChildren: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 0, line: 240 },
      children: [
        new TextRun({
          text: 'RESULT:',
          bold: true,
          font: 'Times New Roman',
          size: 24,
        }),
      ],
    }),
    ...createContentParagraphs(resultText),
  ];

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    float: {
      verticalAnchor: TableAnchorType.MARGIN,
      relativeVerticalPosition: VerticalPositionAlign.BOTTOM,
      horizontalAnchor: TableAnchorType.MARGIN,
      relativeHorizontalPosition: HorizontalPositionAlign.LEFT,
      bottomFromText: 0,
      topFromText: 200,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: {
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            },
            children: resultChildren,
          }),
        ],
      }),
    ],
  });
}

/**
 * Generates the complete docx Document matching the reference template:
 * - Page border box on ALL pages
 * - Header table matching reference image
 * - Dynamic questions with 2 blank lines between each
 * - Picture below "OUTPUT:" with 2 lines space before and after
 * - RESULT pinned to the bottom-most margin of the last page
 */
export async function generateLabRecordDocument(data: LabRecordData): Promise<Document> {
  // Common cell border definition (solid single border matching image)
  const cellBorder = {
    style: BorderStyle.SINGLE,
    size: 4, // 0.5 pt
    color: '000000',
  };

  const tableBorders = {
    top: cellBorder,
    bottom: cellBorder,
    left: cellBorder,
    right: cellBorder,
    insideHorizontal: cellBorder,
    insideVertical: cellBorder,
  };

  const cellMargins = {
    top: 80,
    bottom: 80,
    left: 120,
    right: 120,
  };

  // 2-Column Table matching the uploaded image:
  // Left column (3 rows): Reg No (Row 1), Ex.No:<exerciseNo> (Row 2), Date (Row 3)
  // Right column: Merged across 3 rows, vertically and horizontally centered TOPIC in bold
  const topTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: tableBorders,
    rows: [
      // Row 1: Reg No (Left) | TOPIC (Right, Merged Restart)
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            margins: cellMargins,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0, line: 240 },
                children: [
                  new TextRun({
                    text: data.regNo || '',
                    bold: true,
                    font: 'Times New Roman',
                    size: 24,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            verticalMerge: VerticalMergeType.RESTART,
            verticalAlign: VerticalAlign.CENTER,
            margins: cellMargins,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0, line: 240 },
                children: [
                  new TextRun({
                    text: (data.topic || '').trim().toUpperCase(),
                    bold: true,
                    font: 'Times New Roman',
                    size: 24,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Row 2: Ex.No:<exerciseNo> (Left) | Merged (Right, Continue)
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            margins: cellMargins,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0, line: 240 },
                children: [
                  new TextRun({
                    text: `Ex.No:${data.exerciseNo || ''}`,
                    bold: true,
                    font: 'Times New Roman',
                    size: 24,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            verticalMerge: VerticalMergeType.CONTINUE,
            children: [],
          }),
        ],
      }),

      // Row 3: Date (Left) | Merged (Right, Continue)
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            margins: cellMargins,
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0, line: 240 },
                children: [
                  new TextRun({
                    text: data.date || '',
                    bold: true,
                    font: 'Times New Roman',
                    size: 24,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            verticalMerge: VerticalMergeType.CONTINUE,
            children: [],
          }),
        ],
      }),
    ],
  });

  // Assemble document body in exact order:
  // Header Table -> AIM -> For each question: (Question N -> QUESTION -> PROGRAM -> OUTPUT -> 2 blank lines) -> RESULT Table
  const docChildren: (Table | Paragraph)[] = [
    topTable,

    // AIM
    createSectionHeading('AIM:', 240, 0),
    ...createContentParagraphs(data.aim),
  ];

  // Render each question block
  const questionsList = data.questions && data.questions.length > 0
    ? data.questions
    : [];

  for (let index = 0; index < questionsList.length; index++) {
    const q = questionsList[index];
    const isMultiQuestion = questionsList.length > 1;

    // Heading: Question 1, Question 2, etc.
    if (isMultiQuestion) {
      docChildren.push(createSectionHeading(`Question ${q.questionNumber || index + 1}`, 240, 0));
    }

    // QUESTION:
    docChildren.push(createSectionHeading('QUESTION:', isMultiQuestion ? 120 : 240, 0));
    docChildren.push(...createContentParagraphs(q.questionText));

    // PROGRAM: (Source code with preserved indentation)
    docChildren.push(createSectionHeading('PROGRAM:', 240, 0));
    docChildren.push(
      ...createContentParagraphs(q.sourceCode, { preserveIndentation: true })
    );

    // OUTPUT:
    docChildren.push(createSectionHeading('OUTPUT:', 240, 0));

    // Collect all output pictures for this question
    const imagesToEmbed =
      q.outputImages && q.outputImages.length > 0
        ? q.outputImages
        : q.outputImage && q.outputImage.trim().length > 0
        ? [q.outputImage]
        : [];

    for (const imgDataUrl of imagesToEmbed) {
      if (!imgDataUrl || imgDataUrl.trim().length === 0) continue;

      // 2 lines space before image
      docChildren.push(createEmptyLine());
      docChildren.push(createEmptyLine());

      try {
        const { bytes, width, height } = await parseDataUrlImage(imgDataUrl);

        // Calculate proportional scale to fit within standard document page margins (~460pt)
        const maxWidth = 460;
        let scaledWidth = width;
        let scaledHeight = height;

        if (scaledWidth > maxWidth) {
          const ratio = maxWidth / scaledWidth;
          scaledWidth = maxWidth;
          scaledHeight = Math.round(scaledHeight * ratio);
        }

        // Cap height to 420pt to ensure it fits comfortably on page
        const maxHeight = 420;
        if (scaledHeight > maxHeight) {
          const ratio = maxHeight / scaledHeight;
          scaledHeight = maxHeight;
          scaledWidth = Math.round(scaledWidth * ratio);
        }

        docChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0, line: 240 },
            children: [
              new ImageRun({
                type: 'png',
                data: bytes,
                transformation: {
                  width: scaledWidth,
                  height: scaledHeight,
                },
              }),
            ],
          })
        );
      } catch (err) {
        console.error('Failed to embed output image into Word document:', err);
      }

      // 2 lines space after image
      docChildren.push(createEmptyLine());
      docChildren.push(createEmptyLine());
    }

    // Accompanying console text output (if entered)
    if (q.output && q.output.trim().length > 0) {
      docChildren.push(
        ...createContentParagraphs(q.output, { preserveIndentation: true })
      );
    }

    // Two blank lines between questions (as specified: "then leave two lines between each question")
    if (index < questionsList.length - 1) {
      docChildren.push(createEmptyLine());
      docChildren.push(createEmptyLine());
    }
  }

  // RESULT (always anchored at the bottom-most margin of the last page)
  docChildren.push(createResultBottomTable(data.result));

  // Page Border Box definition for ALL pages
  const pageBorderConfig = {
    style: BorderStyle.SINGLE,
    size: 8, // 1 pt clean line
    space: 24, // 24 pt from page edge
    color: '000000',
  };

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              bottom: 1440, // 1 inch
              left: 1440,   // 1 inch
              right: 1440,  // 1 inch
            },
            borders: {
              pageBorders: {
                display: PageBorderDisplay.ALL_PAGES,
                offsetFrom: PageBorderOffsetFrom.PAGE,
                zOrder: PageBorderZOrder.FRONT,
              },
              pageBorderTop: pageBorderConfig,
              pageBorderRight: pageBorderConfig,
              pageBorderBottom: pageBorderConfig,
              pageBorderLeft: pageBorderConfig,
            },
          },
        },
        children: docChildren,
      },
    ],
  });
}

/**
 * Client-side helper to trigger file download of the generated .docx file.
 * Filename format: Ex-<exerciseNo>-<regNo>.docx
 */
export async function downloadLabRecordDocx(data: LabRecordData): Promise<string> {
  const doc = await generateLabRecordDocument(data);
  const blob = await Packer.toBlob(doc);

  const cleanEx = (data.exerciseNo || '1').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanReg = (data.regNo || 'Record').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Ex-${cleanEx}-${cleanReg}.docx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}
