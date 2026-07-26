import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Plus, TestTube, X } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusPill } from "../components/ui/StatusPill";

export const LabOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: "",
    doctorName: "",
    testName: "",
    testType: "Blood Test",
    priority: "ROUTINE",
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () =>
    api
      .get("/lab-orders")
      .then(setOrders)
      .catch(() => {});

  const handleAdd = async () => {
    await api.post("/lab-orders", form);
    setShowForm(false);
    loadOrders();
  };

  const handleUpdate = async (id: string, updates: any) => {
    await api.put(`/lab-orders/${id}`, updates);
    loadOrders();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lab Orders"
        subtitle="Manage diagnostic tests and sample processing tracking"
        icon={<TestTube className="w-5 h-5" />}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Order Test
          </button>
        }
      />

      <div className="grid gap-4">
        {orders.map((o) => (
          <div
            key={o.id}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/15">
                <TestTube className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  {o.testName}{" "}
                  <span className="text-[10px] bg-[var(--inner-bg)] px-2 py-0.5 rounded border border-[var(--card-border)] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                    {o.testType}
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {o.patientName} • Dr. {o.doctorName}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--card-border)]">
              <StatusPill status={o.priority} />
              <select
                value={o.status}
                onChange={(e) => handleUpdate(o.id, { status: e.target.value })}
                className="text-xs font-bold border border-[var(--input-border)] rounded-lg px-2.5 py-1.5 bg-[var(--input-bg)] text-[var(--text-primary)] cursor-pointer focus:outline-none"
              >
                <option value="ORDERED">Ordered</option>
                <option value="SAMPLE_COLLECTED">Sample Collected</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <EmptyState
            icon={<TestTube className="w-8 h-8 text-[var(--text-muted)]" />}
            title="No lab orders found"
            description="Create a diagnostic test order to get started"
          />
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 w-full max-w-md space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tight text-sm text-[var(--text-primary)]">
                Order Diagnostic Test
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-[var(--inner-bg)] rounded-lg text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { ph: "Patient Name", k: "patientName", type: "text" },
                { ph: "Doctor Name", k: "doctorName", type: "text" },
                { ph: "Test Name (e.g. CBC, Lipid Profile)", k: "testName", type: "text" },
              ].map((f) => (
                <input
                  key={f.k}
                  placeholder={f.ph}
                  value={(form as any)[f.k]}
                  onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2.5 rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              ))}
              <select
                value={form.testType}
                onChange={(e) => setForm({ ...form, testType: e.target.value })}
                className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2.5 rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
              >
                <option value="Blood Test">Blood Test</option>
                <option value="Imaging (X-Ray / MRI)">Imaging (X-Ray / MRI)</option>
                <option value="Urine Analysis">Urine Analysis</option>
                <option value="Pathology">Pathology</option>
              </select>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2.5 rounded-xl text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT / Critical</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer mt-4"
            >
              Submit Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
