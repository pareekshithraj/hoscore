import { useState, useEffect } from "react";
import { api } from "../services/api";
import { Clock, Plus, Users, Calendar } from "lucide-react";

export const ShiftSchedule = () => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    staffName: "",
    role: "Nurse",
    department: "General",
    shiftType: "MORNING",
    date: "",
  });

  useEffect(() => {
    loadShifts();
  }, []);
  const loadShifts = () =>
    api
      .get("/shifts")
      .then(setShifts)
      .catch(() => {});

  const handleAdd = async () => {
    await api.post("/shifts", form);
    setShowForm(false);
    loadShifts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold">Shift Scheduler</h2>
          <p className="text-slate-400">Manage daily staff rosters</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm"
        >
          <Plus className="w-4" /> New Shift
        </button>
      </div>

      <div className="grid gap-4">
        {shifts.map((s) => (
          <div
            key={s.id}
            className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  {s.staffName}{" "}
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-500">
                    {s.role}
                  </span>
                </h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />{" "}
                  {new Date(s.date).toLocaleDateString()} • {s.department}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${s.shiftType === "MORNING" ? "bg-amber-50 text-amber-600" : s.shiftType === "AFTERNOON" ? "bg-blue-50 text-blue-600" : "bg-slate-800 text-slate-300"}`}
              >
                {s.shiftType} SHIFT
              </span>
              <p className="text-xs font-bold text-slate-500 mt-1">
                {s.startTime} - {s.endTime}
              </p>
            </div>
          </div>
        ))}
        {shifts.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            No shifts scheduled
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white p-6 w-[400px] rounded-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold">Assign Shift</h3>
            <input
              placeholder="Staff Name"
              onChange={(e) => setForm({ ...form, staffName: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <select
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option>Nurse</option>
              <option>Doctor</option>
              <option>Technician</option>
            </select>
            <select
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option>General</option>
              <option>ICU</option>
              <option>Emergency</option>
            </select>
            <select
              onChange={(e) => setForm({ ...form, shiftType: e.target.value })}
              className="w-full border p-2 rounded"
            >
              <option>MORNING</option>
              <option>AFTERNOON</option>
              <option>NIGHT</option>
            </select>
            <input
              type="date"
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border p-2 rounded"
            />
            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 text-white font-bold p-2 rounded mt-2"
            >
              Save Shift
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
