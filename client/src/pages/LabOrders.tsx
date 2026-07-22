import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Plus, TestTube, CheckCircle, X } from "lucide-react";

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">Lab Orders</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-450 mt-1">Manage diagnostic tests and sample processing tracking</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> Order Test
        </button>
      </div>

      <div className="grid gap-4">
        {orders.map((o) => (
          <div
            key={o.id}
            className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <TestTube className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-zinc-150">
                  {o.testName}{" "}
                  <span className="text-[9px] bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200/30 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                    {o.testType}
                  </span>
                </h3>
                <p className="text-xs text-slate-550 dark:text-zinc-450 mt-0.5">
                  {o.patientName} • Dr. {o.doctorName}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-zinc-800/60">
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${o.priority === "STAT" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20" : "bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800"}`}
              >
                {o.priority}
              </span>
              <select
                value={o.status}
                onChange={(e) => handleUpdate(o.id, { status: e.target.value })}
                className="text-xs font-bold border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 cursor-pointer focus:outline-none"
              >
                <option value="ORDERED" className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-semibold">Ordered</option>
                <option value="SAMPLE_COLLECTED" className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-semibold">Sample Collected</option>
                <option value="IN_PROGRESS" className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-semibold">In Progress</option>
                <option value="COMPLETED" className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-semibold">Completed</option>
              </select>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20">
            <TestTube className="w-8 h-8 text-slate-350 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-500 dark:text-zinc-450">No lab orders found</p>
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 p-6 rounded-2xl w-full max-w-md space-y-4 text-slate-800 dark:text-zinc-200 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 dark:text-zinc-100 uppercase tracking-tight text-sm">New Lab Order</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg text-slate-400 dark:text-zinc-500 cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Patient Name"
                onChange={(e) =>
                  setForm({ ...form, patientName: e.target.value })
                }
                className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-850 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                placeholder="Doctor Name"
                onChange={(e) =>
                  setForm({ ...form, doctorName: e.target.value })
                }
                className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-850 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                placeholder="Test Name (e.g. CBC)"
                onChange={(e) => setForm({ ...form, testName: e.target.value })}
                className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-850 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-wider block">Priority</label>
                <select
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-800 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none cursor-pointer"
                >
                  <option value="ROUTINE" className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-semibold">ROUTINE</option>
                  <option value="URGENT" className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-semibold">URGENT</option>
                  <option value="STAT" className="bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-semibold">STAT (Emergency)</option>
                </select>
              </div>
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
