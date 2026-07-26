import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Pill, Plus, X } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusPill } from "../components/ui/StatusPill";

export const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    diagnosis: "",
    medicines: "",
    instructions: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [rx, pts, docs] = await Promise.all([
      api.get("/prescriptions"),
      api.get("/patients"),
      api.get("/doctors"),
    ]);
    setPrescriptions(rx || []);
    setPatients(pts || []);
    setDoctors(docs || []);
  };

  const handleAdd = async () => {
    await api.post("/prescriptions", form);
    setShowForm(false);
    setForm({ patientId: "", doctorId: "", diagnosis: "", medicines: "", instructions: "" });
    loadData();
  };

  const handleStatus = async (id: string, status: string) => {
    await api.patch(`/prescriptions/${id}/status`, { status });
    loadData();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="E-Prescriptions"
        subtitle="Issue digital prescriptions and manage medication dispensing tracking"
        icon={<Pill className="w-5 h-5" />}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex gap-2 items-center transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Write E-Rx
          </button>
        }
      />

      <div className="grid gap-4">
        {prescriptions.map((rx) => (
          <div
            key={rx.id}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 flex flex-col sm:flex-row justify-between items-start gap-4 shadow-sm"
          >
            <div className="flex gap-4">
              <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl border border-violet-500/15 max-h-12 shrink-0">
                <Pill className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-[var(--text-primary)]">
                  {rx.patient?.name || "Unknown Patient"}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Diagnosis: <span className="font-semibold text-[var(--text-primary)]">{rx.diagnosis}</span> •{" "}
                  {new Date(rx.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-3 bg-[var(--inner-bg)] p-3 rounded-xl text-sm border border-[var(--card-border)]">
                  <p className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">Medications:</p>
                  <pre className="font-mono text-xs whitespace-pre-wrap text-[var(--text-primary)]">
                    {rx.medicines}
                  </pre>
                </div>
                {rx.instructions && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 font-medium">
                    Note: {rx.instructions}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--card-border)] gap-3">
              <StatusPill status={rx.status} />
              {rx.status === "ISSUED" && (
                <button
                  onClick={() => handleStatus(rx.id, "DISPENSED")}
                  className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all px-3 py-1.5 rounded-xl shadow-sm cursor-pointer"
                >
                  Dispense
                </button>
              )}
            </div>
          </div>
        ))}

        {prescriptions.length === 0 && (
          <EmptyState
            icon={<Pill className="w-8 h-8 text-[var(--text-muted)]" />}
            title="No prescriptions recorded"
            description="Write a new e-prescription to assign medications to patients"
          />
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] w-full max-w-md p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
              <h3 className="font-black uppercase tracking-tight text-sm text-[var(--text-primary)]">
                Write Prescription
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-[var(--inner-bg)] rounded-lg text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className="w-full p-2.5 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
              >
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="w-full p-2.5 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
              >
                <option value="">Select Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.name}
                  </option>
                ))}
              </select>
            </div>

            <input
              placeholder="Diagnosis"
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              className="w-full p-2.5 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            />
            <textarea
              placeholder="Medications (e.g. Paracetamol 500mg 1-0-1)"
              value={form.medicines}
              onChange={(e) => setForm({ ...form, medicines: e.target.value })}
              className="w-full p-2.5 border border-[var(--input-border)] rounded-xl h-24 bg-[var(--input-bg)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none resize-none"
            />
            <input
              placeholder="Special Instructions"
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="w-full p-2.5 border border-[var(--input-border)] rounded-xl bg-[var(--input-bg)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="w-full p-2.5 font-bold text-xs text-[var(--text-secondary)] border border-[var(--card-border)] rounded-xl hover:bg-[var(--inner-bg)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="w-full p-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Generate E-Rx
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

