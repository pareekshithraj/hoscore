import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Activity, Plus, Heart } from "lucide-react";

export const Vitals = () => {
  const [vitals, setVitals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: "",
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    oxygenSaturation: "",
  });

  useEffect(() => {
    api.get("/vitals").then(setVitals);
  }, []);

  const handleAdd = async () => {
    const data = {
      ...form,
      heartRate: Number(form.heartRate),
      temperature: Number(form.temperature),
      oxygenSaturation: Number(form.oxygenSaturation),
    };
    await api.post("/vitals", data);
    setShowForm(false);
    api.get("/vitals").then(setVitals);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold">Vitals Tracking</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex gap-2 items-center bg-blue-600 px-4 py-2 text-white rounded-xl font-bold text-sm"
        >
          <Plus className="w-4" /> Record Vitals
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vitals.map((v) => (
          <div
            key={v.id}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden"
          >
            <Heart className="absolute -bottom-4 -right-4 w-24 h-24 text-rose-50" />
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-4">{v.patientName}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">BP</p>
                  <p className="font-bold">{v.bloodPressure || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Heart Rate</p>
                  <p className="font-bold text-rose-500">
                    {v.heartRate ? `${v.heartRate} bpm` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Temp</p>
                  <p className="font-bold">
                    {v.temperature ? `${v.temperature}°F` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">SpO2</p>
                  <p className="font-bold text-cyan-600">
                    {v.oxygenSaturation ? `${v.oxygenSaturation}%` : "-"}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 border-t pt-2">
                {new Date(v.recordedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white p-6 rounded-2xl w-[400px] space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold">Record Vitals</h3>
            <input
              placeholder="Patient Name"
              onChange={(e) =>
                setForm({ ...form, patientName: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            <input
              placeholder="BP (e.g. 120/80)"
              onChange={(e) =>
                setForm({ ...form, bloodPressure: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            <input
              placeholder="Heart Rate"
              type="number"
              onChange={(e) => setForm({ ...form, heartRate: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <input
              placeholder="Temp (°F)"
              type="number"
              onChange={(e) =>
                setForm({ ...form, temperature: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            <input
              placeholder="SpO2 (%)"
              type="number"
              onChange={(e) =>
                setForm({ ...form, oxygenSaturation: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 text-white font-bold p-2 rounded mt-4"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
