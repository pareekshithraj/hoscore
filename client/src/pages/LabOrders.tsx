import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Plus, TestTube, CheckCircle } from "lucide-react";

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
          <h2 className="text-2xl font-extrabold">Lab Orders</h2>
          <p className="text-slate-400">Manage diagnostic tests</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl"
        >
          <Plus className="w-4 h-4" /> Order Test
        </button>
      </div>

      <div className="grid gap-4">
        {orders.map((o) => (
          <div
            key={o.id}
            className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <TestTube className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  {o.testName}{" "}
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">
                    {o.testType}
                  </span>
                </h3>
                <p className="text-sm text-slate-500">
                  {o.patientName} • Dr. {o.doctorName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-lg ${o.priority === "STAT" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"}`}
              >
                {o.priority}
              </span>
              <select
                value={o.status}
                onChange={(e) => handleUpdate(o.id, { status: e.target.value })}
                className="text-sm border rounded-lg px-2 py-1 bg-slate-50"
              >
                <option value="ORDERED">Ordered</option>
                <option value="SAMPLE_COLLECTED">Sample Collected</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 xl z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-[400px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-4">New Lab Order</h3>
            <div className="space-y-3">
              <input
                placeholder="Patient Name"
                onChange={(e) =>
                  setForm({ ...form, patientName: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
              />
              <input
                placeholder="Doctor Name"
                onChange={(e) =>
                  setForm({ ...form, doctorName: e.target.value })
                }
                className="w-full p-2 border rounded-lg"
              />
              <input
                placeholder="Test Name (e.g. CBC)"
                onChange={(e) => setForm({ ...form, testName: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
              <select
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option>ROUTINE</option>
                <option>URGENT</option>
                <option>STAT</option>
              </select>
              <button
                onClick={handleAdd}
                className="w-full p-2 bg-blue-600 text-white rounded-lg font-bold mt-2"
              >
                Submit Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
