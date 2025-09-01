import html2pdf from 'html2pdf.js';

export const generatePdf = (element: HTMLElement, fileName: string) => {
  const opt = {
    margin: [0, 0, 0, 0],
    filename: `${fileName}.pdf`,
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    pagebreak: { 
      mode: ['css', 'legacy'], 
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: '.page-break-inside-avoid'
    }
  };
  html2pdf().set(opt).from(element).save();
};