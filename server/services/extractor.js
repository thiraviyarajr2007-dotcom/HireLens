import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Text Extraction Service:
 * Extracts raw readable UTF-8 text from uploaded PDF or DOCX files safely.
 */
export async function extractTextFromFile(fileBuffer, originalName, mimeType) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('FILE_EMPTY: Uploaded file is empty.');
  }

  const ext = originalName.split('.').pop().toLowerCase();

  try {
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      const parsed = await pdfParse(fileBuffer);
      const text = (parsed.text || '').trim();
      if (!text) {
        throw new Error('EMPTY_TEXT: PDF file does not contain extractable text.');
      }
      return text;
    } else if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = (result.value || '').trim();
      if (!text) {
        throw new Error('EMPTY_TEXT: DOCX file does not contain extractable text.');
      }
      return text;
    } else if (ext === 'txt' || mimeType.includes('text')) {
      return fileBuffer.toString('utf-8');
    } else {
      // Fallback for doc/other readable formats
      const str = fileBuffer.toString('utf-8');
      if (str && str.length > 20) {
        return str;
      }
      throw new Error('UNSUPPORTED_FORMAT: Only PDF and DOCX files are supported.');
    }
  } catch (err) {
    if (err.message.startsWith('FILE_EMPTY') || err.message.startsWith('EMPTY_TEXT') || err.message.startsWith('UNSUPPORTED_FORMAT')) {
      throw err;
    }
    throw new Error(`TEXT_EXTRACTION_FAILED: Unable to extract text from ${originalName}. Details: ${err.message}`);
  }
}
