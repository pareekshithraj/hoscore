import { useState, useEffect } from "react";
import { api } from "../services/api";
import { ShieldAlert, Plus, Check } from "lucide-react";

export const InsuranceClaims = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientName: "",
    policyNumber: "",
    insuranceCompany: "",
    claimAmount: "",
  });

  useEffect(() => {
    loadClaims();
  }, []);
  const loadClaims = () => api.get("/insurance").then(setClaims);

  const handleAdd = async () => {
    await api.post("/insurance", {
      ...form,
      claimAmount: Number(form.claimAmount),
    });
    setShowForm(false);
    loadClaims();
  };

  const handleStatus = async (id: string, status: string) => {
    await api.patch(`/insurance/${id}/status`, { status });
    loadClaims();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold">Insurance Claims</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4" /> New Claim
        </button>
      </div>

      <div className="grid gap-4">
        {claims.map((c) => (
          <div
            key={c.id}
            className="bg-white p-5 rounded-2xl border flex justify-between"
          >
            <div className="flex gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">{c.patientName}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {c.insuranceCompany} • {c.policyNumber}
                </p>
                <p className="font-mono font-bold text-slate-700 mt-2">
                  ${c.claimAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <span
                className={`px-2 py-1 text-[10px] font-bold rounded ${c.status === "APPROVED" ? "bg-emerald-50 text-emerald-600" : c.status === "REJECTED" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}
              >
                {c.status}
              </span>
              {c.status === "SUBMITTED" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatus(c.id, "APPROVED")}
                    className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatus(c.id, "REJECTED")}
                    className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              )}
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
            className="bg-white p-6 w-[400px] rounded-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold">Submit Claim</h3>
            <input
              placeholder="Patient Name"
              onChange={(e) =>
                setForm({ ...form, patientName: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            <input
              placeholder="Insurance Company"
              onChange={(e) =>
                setForm({ ...form, insuranceCompany: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            <input
              placeholder="Policy Number"
              onChange={(e) =>
                setForm({ ...form, policyNumber: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            <input
              placeholder="Claim Amount ($)"
              type="number"
              onChange={(e) =>
                setForm({ ...form, claimAmount: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 text-white font-bold p-2 rounded"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
