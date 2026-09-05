import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { GoogleGenAI } from '@google/genai';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

function extractTextFromPdfBuffer(buffer: Buffer): string {
  const content = buffer.toString('latin1');
  const textMatches: string[] = [];

  const btEtBlocks = content.match(/BT[\s\S]*?ET/g) || [];
  for (const block of btEtBlocks) {
    const stringMatches = block.match(/\(([^)]*)\)\s*(?:Tj|'|")/g);
    if (stringMatches) {
      for (const m of stringMatches) {
        const text = m.replace(/\)\s*(?:Tj|'|")$/, '').replace(/^\(/, '');
        if (text.trim()) textMatches.push(text);
      }
    }
  }

  return textMatches.join(' ').replace(/\s+/g, ' ').trim();
}

export class AiSummarizerProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, options, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('Please select a PDF document to summarize.');
    }

    const sourceFile = inputFiles[0];
    onProgress?.(15, `Reading "${sourceFile.originalName}"...`);

    const fileBytes = await fs.promises.readFile(sourceFile.path);
    const rawText = extractTextFromPdfBuffer(fileBytes);

    const lengthMode = options.summaryLength || 'bullet'; // 'bullet', 'detailed', 'one-para'
    const apiKey = process.env.GEMINI_API_KEY;

    let summaryText = '';

    if (apiKey) {
      onProgress?.(45, 'Synthesizing executive summary with Gemini AI...');
      try {
        const ai = new GoogleGenAI({ apiKey });
        let promptStyle = 'concise executive bullet points with key takeaways';
        if (lengthMode === 'detailed') promptStyle = 'a detailed multi-section summary with headings and findings';
        if (lengthMode === 'one-para') promptStyle = 'a single powerful executive summary paragraph';

        const prompt = `You are an expert executive document analyst. Read the following document text and produce ${promptStyle}:\n\n${rawText.slice(0, 15000) || 'Document Name: ' + sourceFile.originalName}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        summaryText = response.text || '';
      } catch (err: any) {
        console.warn('[AiSummarizerProcessor] Gemini call error:', err);
      }
    }

    if (!summaryText) {
      // Graceful fallback summary
      summaryText = `Executive Document Overview for ${sourceFile.originalName}\n\n` +
        `• File processed: ${sourceFile.originalName} (${Math.round(fileBytes.length / 1024)} KB)\n` +
        `• Text sample captured: ${rawText.slice(0, 300) || 'Vector/Scanned PDF document'}\n` +
        `• Note: For advanced AI synthesis, ensure GEMINI_API_KEY is configured in server environment.`;
    }

    onProgress?.(75, 'Generating PDF summary report...');

    // Generate clean PDF report with summaryText
    const reportDoc = await PDFDocument.create();
    const page = reportDoc.addPage([595.28, 841.89]); // A4
    const font = await reportDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await reportDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('PDFTOOL Executive Summary', {
      x: 50,
      y: 780,
      size: 20,
      font: fontBold,
      color: rgb(0.06, 0.58, 0.38),
    });

    page.drawText(`Generated from: ${sourceFile.originalName}`, {
      x: 50,
      y: 755,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Draw lines
    const lines = summaryText.split('\n');
    let y = 710;
    for (const line of lines) {
      if (y < 60) break;
      const isHeader = line.startsWith('#') || line.endsWith(':');
      page.drawText(line.replace(/^[#*]+\s*/, '').slice(0, 85), {
        x: 50,
        y,
        size: isHeader ? 12 : 10,
        font: isHeader ? fontBold : font,
        color: isHeader ? rgb(0.1, 0.1, 0.1) : rgb(0.25, 0.25, 0.25),
      });
      y -= isHeader ? 22 : 16;
    }

    const outputPdfBytes = await reportDoc.save({ useObjectStreams: true });
    const baseName = path.parse(sourceFile.originalName).name || 'document';
    const outputFileName = `${baseName}_summary.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    await fs.promises.writeFile(outputPath, outputPdfBytes);
    onProgress?.(100, 'Summary report generated successfully!');

    return {
      outputFiles: [
        {
          fileName: outputFileName,
          path: outputPath,
          mimeType: 'application/pdf',
          size: outputPdfBytes.length,
        },
      ],
    };
  }
}

export const aiSummarizerProcessor = new AiSummarizerProcessor();
