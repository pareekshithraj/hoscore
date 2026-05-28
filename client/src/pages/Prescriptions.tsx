import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Pill, Plus } from "lucide-react";

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
    setPrescriptions(rx);
    setPatients(pts);
    setDoctors(docs);
  };

  const handleAdd = async () => {
    await api.post("/prescriptions", form);
    setShowForm(false);
    loadData();
  };

  const handleStatus = async (id: string, status: string) => {
    await api.patch(`/prescriptions/${id}/status`, { status });
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold">E-Prescriptions</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl flex gap-2"
        >
          <Plus className="w-4 h-4" /> Write E-Rx
        </button>
      </div>

      <div className="grid gap-4">
        {prescriptions.map((rx) => (
          <div
            key={rx.id}
            className="bg-white p-5 rounded-2xl border flex justify-between items-start"
          >
            <div className="flex gap-4">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-xl max-h-12">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {rx.patient?.name || "Unknown Patient"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Diagnosis: {rx.diagnosis} •{" "}
                  {new Date(rx.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-3 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                  <p className="font-bold text-slate-700 mb-1">Medications:</p>
                  <pre className="font-mono text-xs whitespace-pre-wrap">
                    {rx.medicines}
                  </pre>
                </div>
                {rx.instructions && (
                  <p className="text-xs text-slate-500 mt-2 bg-amber-50 p-2 rounded text-amber-800 border border-amber-100">
                    Note: {rx.instructions}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end justify-between h-full space-y-4">
              <div className="text-right">
                <span
                  className={`px-2 py-1 text-[10px] font-bold rounded ${rx.status === "ISSUED" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}
                >
                  {rx.status}
                </span>
              </div>
              {rx.status === "ISSUED" && (
                <button
                  onClick={() => handleStatus(rx.id, "DISPENSED")}
                  className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition px-3 py-1.5 rounded-lg"
                >
                  Dispense
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-[500px] p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg border-b pb-4">
              Write Prescription
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <select
                onChange={(e) =>
                  setForm({ ...form, patientId: e.target.value })
                }
                className="w-full p-2 border rounded-xl bg-slate-50"
              >
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="w-full p-2 border rounded-xl bg-slate-50"
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
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              className="w-full p-2 border rounded-xl bg-slate-50"
            />
            <textarea
              placeholder="Medications (e.g. Paracetamol 500mg 1-0-1)"
              onChange={(e) => setForm({ ...form, medicines: e.target.value })}
              className="w-full p-2 border rounded-xl h-24 bg-slate-50"
            />
            <input
              placeholder="Special Instructions"
              onChange={(e) =>
                setForm({ ...form, instructions: e.target.value })
              }
              className="w-full p-2 border rounded-xl bg-slate-50"
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="w-full p-2 font-bold text-slate-500 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="w-full p-2 bg-blue-600 text-white font-bold rounded-xl"
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
