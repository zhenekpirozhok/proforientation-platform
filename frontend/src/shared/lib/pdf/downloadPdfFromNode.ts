import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type Options = {
    filename?: string;
    scale?: number;
};

export async function downloadPdfFromNode(
    node: HTMLElement,
    { filename = 'results.pdf', scale = 2 }: Options = {},
) {
    const canvas = await html2canvas(node, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let y = 0;
    let left = imgH;

    pdf.addImage(imgData, 'JPEG', 0, y, imgW, imgH);
    left -= pageH;

    while (left > 0) {
        y -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, y, imgW, imgH);
        left -= pageH;
    }

    pdf.save(filename);
}
