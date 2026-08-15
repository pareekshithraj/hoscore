export type MedLine = {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
  quantity?: number;
};

export function parseMedicines(raw: unknown): MedLine[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return parseLine(item);
        if (item && typeof item === 'object') {
          const m = item as Record<string, unknown>;
          return {
            name: String(m.name || m.itemName || ''),
            dosage: String(m.dosage || ''),
            duration: String(m.duration || ''),
            instructions: String(m.instructions || ''),
            quantity: Number(m.quantity || m.count || 1) || 1,
          };
        }
        return null;
      })
      .filter((m): m is MedLine => Boolean(m?.name));
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseMedicines(parsed);
    } catch {
      /* fall through to line parse */
    }
    return raw
      .split('\n')
      .map((line) => parseLine(line))
      .filter((m): m is MedLine => Boolean(m?.name));
  }
  return [];
}

function parseLine(line: string): MedLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(.*?)\s*\((.*)\)$/);
  if (match) {
    const [dosage, duration, instructions] = match[2].split('|').map((s) => s.trim());
    return {
      name: match[1].trim(),
      dosage: dosage || '',
      duration: duration || '',
      instructions: instructions || '',
      quantity: 1,
    };
  }
  return { name: trimmed, dosage: '', duration: '', instructions: '', quantity: 1 };
}

export function formatMedicines(raw: unknown): string {
  const lines = parseMedicines(raw);
  if (!lines.length) return typeof raw === 'string' ? raw : '';
  return lines
    .map((m) => {
      const meta = [m.dosage, m.duration, m.instructions].filter(Boolean).join(' · ');
      return meta ? `${m.name} (${meta})` : m.name;
    })
    .join('\n');
}

export function printPrescription(rx: {
  patientName?: string;
  doctorName?: string;
  diagnosis?: string;
  medicines?: unknown;
  instructions?: string;
  date?: string;
}) {
  const meds = formatMedicines(rx.medicines).replace(/\n/g, '<br/>');
  const html = `<!DOCTYPE html><html><head><title>Prescription</title>
    <style>body{font-family:Georgia,serif;padding:32px;color:#0f172a}h1{font-size:18px;margin:0 0 4px}
    .muted{color:#64748b;font-size:12px} .box{border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-top:16px}</style>
    </head><body>
    <h1>HOSCORE e-Prescription</h1>
    <p class="muted">${new Date(rx.date || Date.now()).toLocaleString()}</p>
    <div class="box"><strong>Patient:</strong> ${rx.patientName || '—'}<br/>
    <strong>Doctor:</strong> ${rx.doctorName || '—'}<br/>
    <strong>Diagnosis:</strong> ${rx.diagnosis || '—'}</div>
    <div class="box"><strong>Medicines</strong><p>${meds || '—'}</p>
    ${rx.instructions ? `<p><em>${rx.instructions}</em></p>` : ''}</div>
    </body></html>`;
  const w = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

export function printDischarge(doc: {
  patientName?: string;
  doctorName?: string;
  diagnosis?: string;
  medications?: string;
  dischargeDate?: string;
}) {
  const html = `<!DOCTYPE html><html><head><title>Discharge Summary</title>
    <style>body{font-family:Georgia,serif;padding:32px;color:#0f172a}h1{font-size:18px}</style></head><body>
    <h1>Discharge Summary</h1>
    <p>${doc.patientName || '—'} · Dr. ${doc.doctorName || '—'}</p>
    <p>Date: ${doc.dischargeDate ? new Date(doc.dischargeDate).toLocaleDateString() : new Date().toLocaleDateString()}</p>
    <p><strong>Diagnosis</strong><br/>${doc.diagnosis || '—'}</p>
    <p><strong>Medications</strong><br/>${doc.medications || '—'}</p>
    </body></html>`;
  const w = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

export function printRecords(pack: {
  patientName?: string;
  vitals?: any[];
  labs?: any[];
  admissions?: any[];
  prescriptions?: any[];
}) {
  const vitals = (pack.vitals || [])
    .map((v) => `BP ${v.bloodPressure || '—'} · HR ${v.heartRate || '—'} · SpO2 ${v.oxygenSaturation || '—'}% · ${v.recordedAt ? new Date(v.recordedAt).toLocaleString() : ''}`)
    .join('<br/>') || 'None recorded';
  const labs = (pack.labs || [])
    .map((l) => `${l.testName || 'Lab'} — ${l.result || 'Pending'} (${l.status || ''})`)
    .join('<br/>') || 'None recorded';
  const admissions = (pack.admissions || [])
    .map((a) => `${a.reason || 'Admission'} · ${a.admissionDate ? new Date(a.admissionDate).toLocaleDateString() : ''} · ${a.status || ''}`)
    .join('<br/>') || 'None recorded';
  const rxs = (pack.prescriptions || [])
    .map((rx) => {
      const meds = formatMedicines(rx.medicines).replace(/\n/g, ', ');
      return `${rx.diagnosis || 'Prescription'} — Dr. ${rx.doctor?.name || rx.doctorName || '—'} · ${meds || '—'}`;
    })
    .join('<br/>') || 'None recorded';
  const html = `<!DOCTYPE html><html><head><title>Medical records</title>
    <style>body{font-family:Georgia,serif;padding:32px;color:#0f172a;max-width:720px;margin:auto}
    h1{font-size:20px;margin:0 0 4px} h2{font-size:14px;margin:20px 0 8px}
    .muted{color:#64748b;font-size:12px} .box{border:1px solid #e2e8f0;border-radius:12px;padding:14px}</style>
    </head><body>
    <h1>HOSCORE medical records pack</h1>
    <p class="muted">${pack.patientName || 'Patient'} · printed ${new Date().toLocaleString()}</p>
    <h2>Vitals</h2><div class="box">${vitals}</div>
    <h2>Lab results</h2><div class="box">${labs}</div>
    <h2>Admissions</h2><div class="box">${admissions}</div>
    <h2>Prescriptions</h2><div class="box">${rxs}</div>
    </body></html>`;
  const w = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

export async function shareRecords(pack: {
  patientName?: string;
  vitals?: any[];
  labs?: any[];
  admissions?: any[];
  prescriptions?: any[];
}) {
  const lines = [
    `HOSCORE records — ${pack.patientName || 'Patient'}`,
    `Vitals: ${(pack.vitals || []).length}`,
    `Labs: ${(pack.labs || []).length}`,
    `Admissions: ${(pack.admissions || []).length}`,
    `Prescriptions: ${(pack.prescriptions || []).length}`,
    '',
    ...(pack.prescriptions || []).slice(0, 8).map((rx) => {
      const meds = formatMedicines(rx.medicines);
      return `Rx: ${rx.diagnosis || 'Prescription'} — ${meds || '—'}`;
    }),
  ];
  const text = lines.join('\n');
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'HOSCORE medical records', text });
      return;
    } catch {
      /* user cancelled or share failed — fall through to print */
    }
  }
  printRecords(pack);
}

export function printInvoice(bill: {
  id?: string;
  hospitalName?: string;
  patientName?: string;
  roomCharges?: number;
  doctorFees?: number;
  pharmacyFees?: number;
  labFees?: number;
  totalAmount?: number;
  status?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt?: string;
}) {
  const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const lines = [
    ['Room / bed charges', bill.roomCharges || 0],
    ['Consultation fees', bill.doctorFees || 0],
    ['Pharmacy', bill.pharmacyFees || 0],
    ['Laboratory', bill.labFees || 0],
  ].filter(([, amt]) => Number(amt) > 0);
  const html = `<!DOCTYPE html><html><head><title>Tax Invoice</title>
    <style>body{font-family:Georgia,serif;padding:32px;color:#0f172a;max-width:640px;margin:auto}
    h1{font-size:20px;margin:0} .muted{color:#64748b;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    td,th{padding:8px 0;border-bottom:1px solid #e2e8f0;text-align:left;font-size:13px}
    td:last-child,th:last-child{text-align:right} .total{font-size:16px;font-weight:700}</style></head><body>
    <h1>${bill.hospitalName || 'HOSCORE Hospital'}</h1>
    <p class="muted">GST tax invoice (amounts GST-inclusive) · INV-${String(bill.id || '').slice(0, 8).toUpperCase()}</p>
    <p>Patient: <strong>${bill.patientName || '—'}</strong><br/>
    Date: ${new Date(bill.paidAt || bill.createdAt || Date.now()).toLocaleString()}<br/>
    Status: ${bill.status || 'PENDING'} ${bill.paymentMethod ? `· ${bill.paymentMethod}` : ''}</p>
    <table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody>
    ${lines.map(([d, a]) => `<tr><td>${d}</td><td>${inr(Number(a))}</td></tr>`).join('')}
    <tr class="total"><td>Total payable</td><td>${inr(bill.totalAmount || 0)}</td></tr>
    </tbody></table>
    <p class="muted">This is a computer-generated invoice. GST is included in the line totals.</p>
    </body></html>`;
  const win = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
