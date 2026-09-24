import * as XLSX from 'xlsx';
import { PDFParse } from 'pdf-parse';

export interface ConvertedFileResult {
  csvContent: string;
  converted: boolean;
  originalType: string;
}

/**
 * Converts uploaded PDF, XLSX, and XLS files to plain CSV text string.
 * CSV files are passed through directly as text.
 */
export async function convertFileToCsv(
  fileBuffer: Buffer,
  filename: string
): Promise<ConvertedFileResult> {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));

  // 1. Convert Excel (.xlsx, .xls) to CSV
  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel workbook contains no readable sheets.');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return {
      csvContent,
      converted: true,
      originalType: ext,
    };
  }

  // 2. Convert PDF (.pdf) to CSV
  if (ext === '.pdf') {
    let rawText = '';
    try {
      const parser = new PDFParse({ data: fileBuffer }) as unknown as {
        load?: () => Promise<void>;
        getText?: () => Promise<string | { text: string }>;
      };
      if (typeof parser.load === 'function') {
        await parser.load();
      }
      if (typeof parser.getText === 'function') {
        const textResult = await parser.getText();
        rawText = typeof textResult === 'string' ? textResult : (textResult ? textResult.text : '');
      }
    } catch {
      // Fallback to requiring pdf-parse directly
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParseFn = require('pdf-parse');
        const fn = typeof pdfParseFn === 'function' ? pdfParseFn : pdfParseFn.default;
        if (typeof fn === 'function') {
          const res = await fn(fileBuffer);
          rawText = res.text || '';
        }
      } catch (err) {
        throw new Error(`Failed to extract text content from PDF file: ${(err as Error).message}`);
      }
    }

    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      throw new Error('PDF file contains no readable text content.');
    }

    // Attempt table / line parsing
    const csvLines: string[] = [];
    const hasCommas = lines.some((l) => l.includes(','));
    const hasTabs = lines.some((l) => l.includes('\t'));
    const hasMultiSpace = lines.some((l) => /\s{2,}/.test(l));

    if (hasTabs) {
      lines.forEach((line) => {
        const cols = line.split('\t').map((c) => `"${c.trim().replace(/"/g, '""')}"`);
        csvLines.push(cols.join(','));
      });
    } else if (hasMultiSpace) {
      lines.forEach((line) => {
        const cols = line.split(/\s{2,}/).map((c) => `"${c.trim().replace(/"/g, '""')}"`);
        csvLines.push(cols.join(','));
      });
    } else if (hasCommas) {
      csvLines.push(...lines);
    } else {
      // Create a 2-column tabular format: line_number, content
      csvLines.push('"line_number","content"');
      lines.forEach((line, index) => {
        csvLines.push(`"${index + 1}","${line.replace(/"/g, '""')}"`);
      });
    }

    return {
      csvContent: csvLines.join('\n'),
      converted: true,
      originalType: '.pdf',
    };
  }

  // 3. Return plain CSV/text
  return {
    csvContent: fileBuffer.toString('utf-8'),
    converted: false,
    originalType: ext,
  };
}
