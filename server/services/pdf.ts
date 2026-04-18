import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function markdownToLines(markdown: string): string[] {
  return markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/g, '')
        .replace(/[*_]{1,3}/g, '')
        .trim(),
    )
    .filter((line) => line.length > 0);
}

export async function renderReportPdf(markdown: string, title = 'Executive Report'): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage();
  let { width, height } = page.getSize();
  let y = height - 50;

  page.drawText(title, {
    x: 50,
    y,
    size: 16,
    font: bold,
    color: rgb(0.09, 0.5, 0.26),
  });
  y -= 24;

  const lines = markdownToLines(markdown);
  const lineHeight = 16;

  for (const line of lines) {
    if (y < 50) {
      page = pdfDoc.addPage();
      ({ width, height } = page.getSize());
      y = height - 50;
    }
    page.drawText(line, { x: 50, y, size: 12, font });
    y -= lineHeight;
  }

  return pdfDoc.save();
}
