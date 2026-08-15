import { useState, useEffect, useMemo } from "react";
import { api } from "../services/api";
import { Clock, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { StaffPicker } from "../components/clinical/StaffPicker";
import { Modal } from "../components/Modal";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHIFT_HOURS: Record<string, { startTime: string; endTime: string }> = {
  MORNING: { startTime: "08:00", endTime: "16:00" },
  AFTERNOON: { startTime: "16:00", endTime: "00:00" },
  NIGHT: { startTime: "00:00", endTime: "08:00" },
};

function mondayOf(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export const ShiftSchedule = () => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [form, setForm] = useState({
    staffId: "",
    staffName: "",
    role: "Nurse",
    department: "General",
    shiftType: "MORNING",
    date: "",
  });

  const loadShifts = () => api.get("/shifts").then(setShifts).catch(() => {});
  useEffect(() => { loadShifts(); }, []);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  }), [weekStart]);

  const shiftsOn = (day: Date) =>
    shifts.filter((s) => s.date && new Date(s.date).toDateString() === day.toDateString());

  const handleAdd = async () => {
    const hours = SHIFT_HOURS[form.shiftType] || SHIFT_HOURS.MORNING;
    await api.post("/shifts", { ...form, ...hours });
    setShowForm(false);
    setForm({ staffId: "", staffName: "", role: "Nurse", department: "General", shiftType: "MORNING", date: "" });
    loadShifts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Shift Scheduler</h2>
          <p className="text-[var(--text-muted)] text-sm">Week roster — pick staff, not typed names</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(mondayOf(new Date(weekStart.getTime() - 7 * 86400000)))} className="p-2 rounded-lg border border-[var(--card-border)]"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setWeekStart(mondayOf(new Date()))} className="px-3 py-1.5 text-xs font-bold text-blue-600">This week</button>
          <button onClick={() => setWeekStart(mondayOf(new Date(weekStart.getTime() + 7 * 86400000)))} className="p-2 rounded-lg border border-[var(--card-border)]"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm">
            <Plus className="w-4" /> New Shift
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]">
        <div className="grid grid-cols-7 min-w-[840px]">
          {weekDays.map((day, i) => {
            const list = shiftsOn(day);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`border-r border-[var(--card-border)] last:border-r-0 min-h-[280px] ${isToday ? "bg-blue-50/40 dark:bg-blue-500/5" : ""}`}>
                <div className="px-3 py-2 border-b border-[var(--card-border)]">
                  <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">{DAYS[i]}</p>
                  <p className={`text-sm font-black ${isToday ? "text-blue-600" : "text-[var(--text-primary)]"}`}>{day.getDate()}</p>
                </div>
                <div className="p-2 space-y-2">
                  {list.map((s) => (
                    <div key={s.id} className="rounded-lg border border-[var(--card-border)] bg-[var(--inner-bg)] p-2">
                      <p className="text-[11px] font-bold truncate">{s.staffName}</p>
                      <p className="text-[9px] text-[var(--text-muted)]">{s.shiftType} · {s.startTime}-{s.endTime}</p>
                    </div>
                  ))}
                  {list.length === 0 && <p className="text-[10px] text-[var(--text-muted)] italic">Open</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3">
        {shifts.slice(0, 8).map((s) => (
          <div key={s.id} className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--card-border)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-50 text-violet-600 rounded-xl"><Clock className="w-5 h-5" /></div>
              <div>
                <h3 className="font-bold text-sm">{s.staffName} <span className="text-[10px] text-slate-500 font-bold">{s.role}</span></h3>
                <p className="text-xs text-slate-500">{new Date(s.date).toLocaleDateString()} · {s.department}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100">{s.shiftType}</span>
          </div>
        ))}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Assign shift">
        <div className="space-y-3">
          <StaffPicker
            value={form.staffId}
            onChange={(s) => setForm({ ...form, staffId: s?.id || "", staffName: s?.name || "", role: s?.role || "Nurse" })}
          />
          <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm">
            <option>General</option><option>ICU</option><option>Emergency</option>
          </select>
          <select value={form.shiftType} onChange={(e) => setForm({ ...form, shiftType: e.target.value })} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm">
            <option value="MORNING">MORNING (08:00–16:00)</option>
            <option value="AFTERNOON">AFTERNOON (16:00–00:00)</option>
            <option value="NIGHT">NIGHT (00:00–08:00)</option>
          </select>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] p-2 rounded-xl text-sm" />
          <button onClick={handleAdd} disabled={!form.staffName || !form.date} className="w-full bg-blue-600 text-white font-bold p-2 rounded-xl disabled:opacity-50">Save Shift</button>
        </div>
      </Modal>
    </div>
  );
};
