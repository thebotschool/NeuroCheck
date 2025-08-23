import html2pdf from 'html2pdf.js';

export const generatePdf = (element: HTMLElement, fileName: string) => {
  const elementToPrint = element.cloneNode(true) as HTMLElement;
  elementToPrint.innerHTML = elementToPrint.innerHTML.replace(/<!-- page-break -->/g, '<div style="page-break-before: always;"></div>');

  const opt = {
    filename: `${fileName}.pdf`,
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
    html2canvas: { scale: 2, useCORS: true },
    pagebreak: { mode: ['css', 'legacy'], avoid: '.avoid-break' }
  };
  html2pdf().set(opt).from(elementToPrint).save();
};