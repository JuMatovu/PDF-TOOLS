import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { IProcessor, ProcessorInput, ProcessorResult } from './types';

/**
 * Basic text extraction from PDF stream objects
 */
function extractTextFromPdfBuffer(buffer: Buffer): string {
  const content = buffer.toString('latin1');
  const textMatches: string[] = [];

  // Match text in parentheses within BT ... ET blocks: e.g. (Hello World) Tj or [(Hello) -10 (World)] TJ
  const btEtBlocks = content.match(/BT[\s\S]*?ET/g) || [];

  for (const block of btEtBlocks) {
    const stringMatches = block.match(/\(([^)]*)\)\s*(?:Tj|'|")/g);
    if (stringMatches) {
      for (const m of stringMatches) {
        const text = m.replace(/\)\s*(?:Tj|'|")$/, '').replace(/^\(/, '');
        if (text.trim()) textMatches.push(text);
      }
    }
    const tjMatches = block.match(/\[([^\]]*)\]\s*TJ/g);
    if (tjMatches) {
      for (const m of tjMatches) {
        const innerStrings = m.match(/\(([^)]*)\)/g);
        if (innerStrings) {
          const joined = innerStrings.map((s) => s.slice(1, -1)).join('');
          if (joined.trim()) textMatches.push(joined);
        }
      }
    }
  }

  const rawText = textMatches.join(' ').replace(/\s+/g, ' ').trim();
  return rawText;
}

export class PdfToMarkdownProcessor implements IProcessor {
  public async process(
    input: ProcessorInput,
    onProgress?: (progress: number, message?: string) => void
  ): Promise<ProcessorResult> {
    const { inputFiles, outputDir } = input;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('Please select a PDF document to convert to Markdown.');
    }

    const sourceFile = inputFiles[0];
    onProgress?.(20, `Analyzing "${sourceFile.originalName}"...`);

    const fileBytes = await fs.promises.readFile(sourceFile.path);
    const rawText = extractTextFromPdfBuffer(fileBytes);

    let markdownContent = '';

    // If Gemini API key is available, use Gemini to transform into clean Markdown
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && rawText.length > 20) {
      try {
        onProgress?.(50, 'Using Gemini AI to convert PDF structure to GitHub Markdown...');
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Convert the following extracted PDF text content into clean, well-formatted GitHub-flavored Markdown. Include proper headings (#, ##), paragraphs, lists (-), and tables where appropriate. Output ONLY the raw Markdown without backticks around the whole document:\n\n${rawText.slice(0, 15000)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        markdownContent = response.text || '';
      } catch (aiErr) {
        console.warn('[PdfToMarkdownProcessor] Gemini transformation fallback:', aiErr);
      }
    }

    // Fallback if AI is unavailable or text was brief
    if (!markdownContent) {
      onProgress?.(70, 'Formatting Markdown document...');
      const title = path.parse(sourceFile.originalName).name.replace(/[-_]/g, ' ');
      markdownContent = `# ${title}\n\n`;

      if (rawText) {
        // Split into readable paragraphs
        const paragraphs = rawText.split(/(?<=\.)\s+/);
        paragraphs.forEach((p) => {
          if (p.trim()) {
            markdownContent += `${p.trim()}\n\n`;
          }
        });
      } else {
        markdownContent += `*Document content could not be converted to plain text (file may contain scanned images or vector paths).*`;
      }
    }

    onProgress?.(90, 'Writing Markdown output file...');
    const baseName = path.parse(sourceFile.originalName).name || 'document';
    const outputFileName = `${baseName}.md`;
    const outputPath = path.join(outputDir, outputFileName);

    await fs.promises.writeFile(outputPath, markdownContent, 'utf-8');
    onProgress?.(100, 'Markdown conversion complete!');

    return {
      outputFiles: [
        {
          fileName: outputFileName,
          path: outputPath,
          mimeType: 'text/markdown',
          size: Buffer.byteLength(markdownContent, 'utf-8'),
        },
      ],
    };
  }
}

export const pdfToMarkdownProcessor = new PdfToMarkdownProcessor();
