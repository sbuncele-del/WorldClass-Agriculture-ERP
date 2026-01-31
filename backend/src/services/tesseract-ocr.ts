/**
 * Tesseract OCR Service - Alternative to AWS Textract
 * Use this for Oracle Cloud deployment (free)
 * 
 * Install: npm install tesseract.js
 */

import Tesseract from 'tesseract.js';
import path from 'path';

interface OCRResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

class TesseractOCRService {
  private worker: Tesseract.Worker | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the Tesseract worker
   */
  async initialize(languages: string[] = ['eng']): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔤 Initializing Tesseract OCR...');
    
    this.worker = await Tesseract.createWorker(languages.join('+'), 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    this.isInitialized = true;
    console.log('✅ Tesseract OCR initialized');
  }

  /**
   * Extract text from an image buffer
   * Compatible API with AWS Textract response format
   */
  async extractText(imageBuffer: Buffer): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    const result = await this.worker!.recognize(imageBuffer);

    // Format similar to AWS Textract response
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      blocks: result.data.blocks?.map(block => ({
        text: block.text,
        confidence: block.confidence,
        bbox: block.bbox,
      })) || [],
    };
  }

  /**
   * Extract text from a file path
   */
  async extractTextFromFile(filePath: string): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    const result = await this.worker!.recognize(filePath);

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      blocks: result.data.blocks?.map(block => ({
        text: block.text,
        confidence: block.confidence,
        bbox: block.bbox,
      })) || [],
    };
  }

  /**
   * Detect document text - AWS Textract compatible method name
   */
  async detectDocumentText(input: { imageBuffer?: Buffer; filePath?: string }): Promise<{
    Blocks: Array<{
      BlockType: string;
      Text: string;
      Confidence: number;
      Geometry: { BoundingBox: { Left: number; Top: number; Width: number; Height: number } };
    }>;
  }> {
    let result: OCRResult;

    if (input.imageBuffer) {
      result = await this.extractText(input.imageBuffer);
    } else if (input.filePath) {
      result = await this.extractTextFromFile(input.filePath);
    } else {
      throw new Error('Either imageBuffer or filePath must be provided');
    }

    // Convert to AWS Textract-like response format
    return {
      Blocks: [
        {
          BlockType: 'PAGE',
          Text: result.text,
          Confidence: result.confidence,
          Geometry: {
            BoundingBox: { Left: 0, Top: 0, Width: 1, Height: 1 },
          },
        },
        ...result.blocks.map(block => ({
          BlockType: 'LINE',
          Text: block.text,
          Confidence: block.confidence,
          Geometry: {
            BoundingBox: {
              Left: block.bbox.x0,
              Top: block.bbox.y0,
              Width: block.bbox.x1 - block.bbox.x0,
              Height: block.bbox.y1 - block.bbox.y0,
            },
          },
        })),
      ],
    };
  }

  /**
   * Cleanup worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const tesseractOCR = new TesseractOCRService();

// Export class for custom instances
export { TesseractOCRService };

/**
 * Example usage:
 * 
 * import { tesseractOCR } from './services/tesseract-ocr';
 * 
 * // Initialize (optional - will auto-init on first use)
 * await tesseractOCR.initialize(['eng', 'afr']);
 * 
 * // Extract text from buffer
 * const result = await tesseractOCR.extractText(imageBuffer);
 * console.log(result.text);
 * 
 * // AWS Textract compatible response
 * const textractResponse = await tesseractOCR.detectDocumentText({ imageBuffer });
 * console.log(textractResponse.Blocks);
 */
