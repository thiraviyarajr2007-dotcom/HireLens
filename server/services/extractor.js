import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Text Extraction Service:
 * Extracts clean UTF-8 text from uploaded PDF or DOCX files safely.
 * Explicitly rejects scanned PDFs without OCR and legacy binary .doc files with clear errors.
 */
export async function extractTextFromFile(fileBuffer, originalName = 'resume.pdf', mimeType = '') {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('FILE_EMPTY: The uploaded file contains no data.');
  }

  const ext = (originalName || '').split('.').pop().toLowerCase();

  // B19: Explicitly reject legacy binary .doc format instead of dumping raw binary strings
  if (ext === 'doc' || mimeType === 'application/msword') {
    throw new Error('UNSUPPORTED_LEGACY_DOC: Legacy binary .doc format is not supported. Please save or convert your resume to modern .pdf or .docx format before uploading.');
  }

  try {
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      const parsed = await pdfParse(fileBuffer);
      const text = (parsed.text || '').replace(/\r\n/g, '\n').trim();
      
      // B19: Clear error for image-only / scanned PDFs
      if (!text || text.replace(/\s+/g, '').length < 25) {
        throw new Error('SCANNED_OR_EMPTY_PDF: The uploaded PDF does not contain extractable text. It appears to be a scanned document or image without an embedded OCR text layer. Please upload a text-selectable PDF or DOCX file.');
      }
      return text;
    } else if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = (result.value || '').replace(/\r\n/g, '\n').trim();
      if (!text || text.replace(/\s+/g, '').length < 15) {
        throw new Error('EMPTY_DOCX: The DOCX document does not contain extractable text.');
      }
      return text;
    } else if (ext === 'txt' || mimeType.includes('text/plain')) {
      const text = fileBuffer.toString('utf-8').trim();
      if (!text) {
        throw new Error('EMPTY_TEXT: The text document contains no data.');
      }
      return text;
    } else {
      throw new Error(`UNSUPPORTED_FORMAT: File type ".${ext}" is not supported. Supported formats are text-based PDF and DOCX.`);
    }
  } catch (err) {
    if (
      err.message.startsWith('FILE_EMPTY') || 
      err.message.startsWith('SCANNED_OR_EMPTY_PDF') || 
      err.message.startsWith('EMPTY_DOCX') || 
      err.message.startsWith('EMPTY_TEXT') || 
      err.message.startsWith('UNSUPPORTED_LEGACY_DOC') || 
      err.message.startsWith('UNSUPPORTED_FORMAT')
    ) {
      throw err;
    }
    throw new Error(`TEXT_EXTRACTION_FAILED: Unable to parse readable text from "${originalName}". Details: ${err.message}`);
  }
}
