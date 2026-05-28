import type { Request, Response } from 'express';
import { prisma } from '../index.js';
// @ts-ignore
import PDFDocument from 'pdfkit';

const hid = (req: Request) => (req as any).user?.hospitalId;

// Billing Report
export const billingReport = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const format = req.query.format || 'csv';
    const billings = await prisma.billing.findMany({
      where: { admission: { bed: { room: { hospitalId } } } },
      include: { admission: { include: { patient: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const header = 'ID,Patient,Total Amount,Status,Created\n';
      const rows = billings.map(b =>
        `${b.id},"${b.admission?.patient?.name || 'N/A'}",${b.totalAmount},${b.status},${b.createdAt.toISOString()}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=billing_report.csv');
      return res.send(header + rows);
    }

    // PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=billing_report.pdf');
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('HOSCORE — Billing Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Table header
    const startX = 50;
    let y = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Patient', startX, y, { width: 150 });
    doc.text('Amount', startX + 160, y, { width: 80 });
    doc.text('Status', startX + 250, y, { width: 80 });
    doc.text('Date', startX + 340, y, { width: 130 });
    y += 20;
    doc.moveTo(startX, y).lineTo(520, y).stroke();
    y += 10;

    doc.font('Helvetica').fontSize(9);
    for (const b of billings.slice(0, 50)) {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.text(b.admission?.patient?.name || 'N/A', startX, y, { width: 150 });
      doc.text(`₹${b.totalAmount}`, startX + 160, y, { width: 80 });
      doc.text(b.status, startX + 250, y, { width: 80 });
      doc.text(b.createdAt.toLocaleDateString(), startX + 340, y, { width: 130 });
      y += 18;
    }

    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica-Bold').text(`Total Records: ${billings.length}`, startX);
    const totalRevenue = billings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, startX);

    doc.end();
  } catch (err) {
    console.error('Billing report error:', err);
    res.status(500).json({ error: 'Failed to generate billing report' });
  }
};

// Patient List Export
export const patientReport = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const patients = await prisma.patient.findMany({
      where: { appointments: { some: { hospitalId } } },
      orderBy: { name: 'asc' },
    });

    const header = 'Name,Email,Phone,Blood Group,DOB,Gender\n';
    const rows = patients.map(p =>
      `"${p.name}","${p.email || ''}","${p.contact || ''}","${p.bloodGroup || ''}","${p.dateOfBirth?.toISOString().split('T')[0] || ''}","${p.gender || ''}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=patients.csv');
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate patient report' });
  }
};

// Analytics Report
export const analyticsReport = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const roomFilter = { room: { hospitalId } };

    const totalPatients = await prisma.patient.count({ where: { appointments: { some: { hospitalId } } } });
    const totalBeds = await prisma.bed.count({ where: roomFilter });
    const occupiedBeds = await prisma.bed.count({ where: { ...roomFilter, status: 'OCCUPIED' } });
    const totalRevenue = await prisma.billing.aggregate({ where: { admission: { bed: { room: { hospitalId } } } }, _sum: { totalAmount: true } });
    const totalAppointments = await prisma.appointment.count({ where: { hospitalId } });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics_report.pdf');
    doc.pipe(res);

    doc.fontSize(22).font('Helvetica-Bold').text('HOSCORE — Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    const metrics = [
      { label: 'Total Patients', value: totalPatients.toString() },
      { label: 'Total Beds', value: totalBeds.toString() },
      { label: 'Occupied Beds', value: occupiedBeds.toString() },
      { label: 'Occupancy Rate', value: totalBeds > 0 ? `${Math.round((occupiedBeds / totalBeds) * 100)}%` : '0%' },
      { label: 'Total Appointments', value: totalAppointments.toString() },
      { label: 'Total Revenue', value: `₹${(totalRevenue._sum.totalAmount || 0).toLocaleString()}` },
    ];

    for (const m of metrics) {
      doc.fontSize(12).font('Helvetica-Bold').text(m.label, 50, doc.y, { continued: true });
      doc.font('Helvetica').text(`  ${m.value}`);
      doc.moveDown(0.5);
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999').text('This report was generated by HOSCORE Hospital Management Platform.', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Analytics report error:', err);
    res.status(500).json({ error: 'Failed to generate analytics report' });
  }
};
