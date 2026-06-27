import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let text = '';
    const numPages = Math.min(pdf.numPages, 50); // Limit to 50 pages to prevent huge payloads
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      text += `--- Page ${i} ---\n${pageText}\n`;
    }
    
    return text.trim();
  } catch (error: any) {
    console.error("Error extracting PDF text:", error);
    if (error.name === 'PasswordException') {
      throw new Error('Password protected PDFs are not supported context.');
    } else if (error.name === 'InvalidPDFException') {
      throw new Error('Invalid or corrupted PDF file.');
    }
    throw new Error(error.message || 'Unknown error occurred while parsing PDF');
  }
}
