import * as mupdf from "mupdf";

/**
 * Splits a PDF buffer into multiple PDF buffers, each containing n pages.
 * @param pdfBuffer - The input PDF as a Buffer
 * @param pagesPerSplit - Number of pages per split (default: 1)
 * @returns Array of PDF buffers, each containing up to n pages
 */
export const splitPdf = async (
    pdfBuffer: Buffer,
    pagesPerSplit: number = 1
): Promise<Buffer[]> => {

    // Load the PDF document from buffer
    const srcDoc = new mupdf.PDFDocument(pdfBuffer);

    // Get the total number of pages in the PDF
    const pageCount = srcDoc.countPages();

    // Array to store the split page buffers
    const splitBuffers: Buffer[] = [];

    // Iterate over pages in chunks of pagesPerSplit
    for (let i = 0; i < pageCount; i += pagesPerSplit) {
        // Create a new PDF document for this chunk
        const newDoc = new mupdf.PDFDocument();

        // Calculate the page range for this chunk
        const endPage = Math.min(i + pagesPerSplit, pageCount);

        // Copy pages from the source PDF to the new PDF
        for (let j = i; j < endPage; j++) {
            newDoc.graftPage(j - i, srcDoc, j);
        }

        // Convert the split PDF to a buffer and add to array
        const pdfBytes = newDoc.saveToBuffer("compress");
        splitBuffers.push(Buffer.from(pdfBytes.asUint8Array()));

        // Clean up the new document
        newDoc.destroy();
    }

    // Clean up the source document
    srcDoc.destroy();

    return splitBuffers;
};
