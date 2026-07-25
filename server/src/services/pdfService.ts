import PDFDocument from 'pdfkit';
import { uploadToR2, signUrl } from './r2.js';

export const generateAndUploadReceipt = async (
  billing: any,
  hospital: any,
  patientName: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(buffers);
          const fileName = `receipt_${billing.id}.pdf`;
          const result = await uploadToR2(pdfBuffer, fileName, 'application/pdf', 'receipts');
          const signed = await signUrl(result.key);
          resolve(signed || result.key);
        } catch (err) {
          reject(err);
        }
      });
      doc.on('error', reject);

      // --- PDF CONTENT ---
      
      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(hospital?.name || 'Hoscore Hospital', { align: 'center' });
        
      if (hospital?.address) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`${hospital.address}, ${hospital.city || ''}`, { align: 'center' });
      }

      doc.moveDown(2);
      
      // Title
      doc.fontSize(16).font('Helvetica-Bold').text('PAYMENT RECEIPT', { align: 'center' });
      doc.moveDown();

      // Details
      doc.fontSize(12).font('Helvetica');
      const startY = doc.y;
      
      // Left side details
      doc.text(`Receipt ID: ${billing.id.split('-')[0].toUpperCase()}`, 50, startY);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, startY + 15);
      doc.text(`Method: ${billing.paymentMethod || 'ONLINE'}`, 50, startY + 30);
      
      // Right side details
      doc.text(`Patient: ${patientName}`, 350, startY);
      doc.text(`Status: PAID`, 350, startY + 15);
      
      doc.moveDown(3);

      // Line items table header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Amount (INR)', 400, tableTop, { align: 'right' });
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      
      doc.font('Helvetica');
      let currentY = tableTop + 25;

      const drawRow = (desc: string, amount: number) => {
        if (amount > 0) {
          doc.text(desc, 50, currentY);
          doc.text(`Rs. ${amount.toFixed(2)}`, 400, currentY, { align: 'right' });
          currentY += 20;
        }
      };

      drawRow('Room Charges', billing.roomCharges);
      drawRow('Doctor Fees', billing.doctorFees);
      drawRow('Pharmacy Fees', billing.pharmacyFees);
      drawRow('Lab Fees', billing.labFees);

      doc.moveTo(50, currentY + 5).lineTo(550, currentY + 5).stroke();
      currentY += 15;

      // Total
      doc.font('Helvetica-Bold');
      doc.text('Total Amount Paid', 50, currentY);
      doc.text(`Rs. ${billing.totalAmount.toFixed(2)}`, 400, currentY, { align: 'right' });

      // Footer
      doc.moveDown(5);
      doc.font('Helvetica-Oblique').fontSize(10).fillColor('#666666');
      doc.text('Thank you for choosing our hospital. Wishing you a speedy recovery!', { align: 'center' });
      
      // Powered By
      const bottom = doc.page.height - 50;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#aaaaaa');
      doc.text('Powered by HOSCORE', 50, bottom, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
