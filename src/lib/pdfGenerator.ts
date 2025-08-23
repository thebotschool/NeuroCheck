import html2pdf from 'html2pdf.js';

export const generatePdf = (element: HTMLElement, fileName: string) => {
  const opt = {
    filename: `${fileName}.pdf`,
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
    html2canvas: { scale: 2, useCORS: true },
    pagebreak: { mode: ['css', 'legacy'], before: '.page-break-before' }
  };
  html2pdf().set(opt).from(element).save();
};