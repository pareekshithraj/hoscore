import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Activity, Plus, Heart, X } from "lucide-react";

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
    setForm({
      patientName: "",
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      oxygenSaturation: "",
    });
    api.get("/vitals").then(setVitals);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">Vitals Tracking</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-450 mt-1">Realtime monitoring of patient telemetry and charts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex gap-2 items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition-all active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Record Vitals
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vitals.map((v) => (
          <div
            key={v.id}
            className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm relative overflow-hidden group transition-all duration-300 hover:shadow-md"
          >
            <Heart className="absolute -bottom-4 -right-4 w-24 h-24 text-rose-500/[0.03] dark:text-rose-500/[0.02] group-hover:scale-105 transition-transform" />
            <div className="relative z-10">
              <h3 className="font-bold text-lg text-slate-900 dark:text-zinc-150 mb-4">{v.patientName}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider">BP</p>
                  <p className="font-bold text-slate-800 dark:text-zinc-200">{v.bloodPressure || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider">Heart Rate</p>
                  <p className="font-bold text-rose-500 dark:text-rose-400">
                    {v.heartRate ? `${v.heartRate} bpm` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider">Temp</p>
                  <p className="font-bold text-slate-800 dark:text-zinc-200">
                    {v.temperature ? `${v.temperature}°F` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider">SpO2</p>
                  <p className="font-bold text-cyan-600 dark:text-sky-400">
                    {v.oxygenSaturation ? `${v.oxygenSaturation}%` : "-"}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-550 mt-4 border-t border-slate-100 dark:border-zinc-800/60 pt-2 font-mono">
                {new Date(v.recordedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}

        {vitals.length === 0 && (
          <div className="md:col-span-2 p-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20">
            <Activity className="w-8 h-8 text-slate-350 dark:text-zinc-700 mx-auto mb-2 animate-pulse" />
            <p className="text-sm font-bold text-slate-500 dark:text-zinc-450">No patient vitals recorded today</p>
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
              <h3 className="font-black text-slate-900 dark:text-zinc-100 uppercase tracking-tight text-sm">Record Patient Vitals</h3>
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
                placeholder="BP (e.g. 120/80)"
                onChange={(e) =>
                  setForm({ ...form, bloodPressure: e.target.value })
                }
                className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-850 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                placeholder="Heart Rate (bpm)"
                type="number"
                onChange={(e) => setForm({ ...form, heartRate: e.target.value })}
                className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-850 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                placeholder="Temp (°F)"
                type="number"
                onChange={(e) =>
                  setForm({ ...form, temperature: e.target.value })
                }
                className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-850 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                placeholder="SpO2 (%)"
                type="number"
                onChange={(e) =>
                  setForm({ ...form, oxygenSaturation: e.target.value })
                }
                className="w-full border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg text-xs font-bold text-slate-850 dark:text-zinc-100 bg-slate-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95 cursor-pointer mt-4"
            >
              Save Vitals
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
