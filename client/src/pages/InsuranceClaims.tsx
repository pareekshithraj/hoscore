import { useState, useEffect } from "react";
import { api } from "../services/api";
import { ShieldAlert, Plus, FileText, Link2 } from "lucide-react";
import { PatientPicker } from "../components/clinical/PatientPicker";
import { formatINR } from "../utils/clinical";
import { Modal } from "../components/Modal";

export const InsuranceClaims = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    policyNumber: "",
    insuranceCompany: "",
    claimAmount: "",
    billId: "",
    diagnosis: "",
    documents: "",
  });

  useEffect(() => {
    loadClaims();
    api.get("/billing").then((res) => setBills(Array.isArray(res) ? res : [])).catch(() => []);
  }, []);
  const loadClaims = () => api.get("/insurance").then(setClaims).catch(() => []);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      fd.append("folder", "claims");
      const res = await api.upload("/upload/documents", fd);
      const keys = (res.files || []).map((f: any) => f.key || f.url).filter(Boolean);
      setForm((prev) => ({ ...prev, documents: [...(prev.documents ? prev.documents.split(",").map((s) => s.trim()) : []), ...keys].join(", ") }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async () => {
    const bill = bills.find((b) => b.id === form.billId);
    await api.post("/insurance", {
      ...form,
      claimAmount: Number(form.claimAmount),
      admissionId: bill?.admissionId || undefined,
    });
    setShowForm(false);
    setForm({ patientId: "", patientName: "", policyNumber: "", insuranceCompany: "", claimAmount: "", billId: "", diagnosis: "", documents: "" });
    loadClaims();
  };

  const handleStatus = async (id: string, status: string) => {
    await api.patch(`/insurance/${id}/status`, { status });
    loadClaims();
  };

  const linkedBill = (c: any) => bills.find((b) => b.id === c.billId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Insurance Claims</h2>
          <p className="text-sm text-[var(--text-muted)]">Link a patient bill and attach policy documents</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Plus className="w-4" /> New Claim
        </button>
      </div>

      <div className="grid gap-4">
        {claims.map((c) => (
          <div key={c.id} className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] flex justify-between gap-4">
            <div className="flex gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl h-fit"><ShieldAlert className="w-6 h-6" /></div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">{c.patientName}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{c.insuranceCompany} • {c.policyNumber}</p>
                <p className="font-mono font-bold text-[var(--text-primary)] mt-2">{formatINR(c.claimAmount)}</p>
                {c.billId && (
                  <p className="text-[10px] font-bold text-blue-600 mt-1 inline-flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> Bill {linkedBill(c)?.admission?.patient?.name || c.billId.slice(0, 8)} · {linkedBill(c)?.status || ""}
                  </p>
                )}
                {c.documents && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {String(c.documents).split(",").map((url: string, i: number) => (
                      <a key={i} href={url.trim()} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-sky-600 inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Document {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <span className={`px-2 py-1 text-[10px] font-bold rounded ${c.status === "APPROVED" ? "bg-emerald-50 text-emerald-600" : c.status === "REJECTED" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                {c.status}
              </span>
              {c.status === "SUBMITTED" && (
                <div className="flex gap-2">
                  <button onClick={() => handleStatus(c.id, "APPROVED")} className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Approve</button>
                  <button onClick={() => handleStatus(c.id, "REJECTED")} className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded">Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {claims.length === 0 && <p className="text-sm text-[var(--text-muted)] py-10 text-center">No claims yet.</p>}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Submit claim">
        <div className="space-y-3">
          <PatientPicker
            value={form.patientId}
            onChange={(p) => setForm({ ...form, patientId: p?.id || "", patientName: p?.name || "" })}
          />
          <select
            value={form.billId}
            onChange={(e) => {
              const bill = bills.find((b) => b.id === e.target.value);
              setForm({
                ...form,
                billId: e.target.value,
                claimAmount: bill ? String(bill.totalAmount || "") : form.claimAmount,
                patientId: bill?.admission?.patient?.id || form.patientId,
                patientName: bill?.admission?.patient?.name || form.patientName,
              });
            }}
            className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm"
          >
            <option value="">Link hospital bill (optional)</option>
            {bills.map((b) => (
              <option key={b.id} value={b.id}>
                {b.admission?.patient?.name || "Patient"} · {formatINR(b.totalAmount)} · {b.status}
              </option>
            ))}
          </select>
          <input placeholder="Insurance Company" value={form.insuranceCompany} onChange={(e) => setForm({ ...form, insuranceCompany: e.target.value })} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm" />
          <input placeholder="Policy Number" value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm" />
          <input placeholder="Diagnosis" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm" />
          <input placeholder="Claim amount (₹)" type="number" value={form.claimAmount} onChange={(e) => setForm({ ...form, claimAmount: e.target.value })} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm" />
          <label className="block text-xs font-bold text-[var(--text-muted)]">
            Policy / discharge documents
            <input type="file" multiple accept="image/*,.pdf" className="mt-1 block w-full text-xs" onChange={(e) => handleFiles(e.target.files)} />
          </label>
          {uploading && <p className="text-xs text-sky-600">Uploading…</p>}
          {form.documents && <p className="text-[10px] text-[var(--text-muted)]">{form.documents.split(",").length} file(s) attached</p>}
          <button onClick={handleAdd} disabled={!form.patientName || !form.policyNumber} className="w-full bg-blue-600 text-white font-bold p-2 rounded-xl disabled:opacity-50">Submit</button>
        </div>
      </Modal>
    </div>
  );
};
