import { useState, useEffect } from "react";
import { api } from "../services/api";
import { ShieldCheck, Server } from "lucide-react";

export const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.get("/audit-logs").then(setLogs);
  }, []);

  const getActionColor = (action: string) => {
    if (action === "DELETE") return "text-rose-500 bg-rose-50";
    if (action === "CREATE") return "text-emerald-500 bg-emerald-50";
    return "text-blue-500 bg-blue-50";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Server className="w-8 h-8 text-slate-400" />
        <div>
          <h2 className="text-2xl font-extrabold">System Audit Logs</h2>
          <p className="text-slate-400">Compliance and activity tracking</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">User</th>
              <th className="p-4">Action</th>
              <th className="p-4">Entity</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="p-4 text-slate-500 tabular-nums">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="p-4 font-bold">{log.userName}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold ${getActionColor(log.action)}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="p-4 text-slate-500">{log.entity}</td>
                <td className="p-4 text-xs text-slate-400 truncate max-w-[200px]">
                  {log.details || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="text-center py-10 text-slate-400 font-mono text-sm">
            No activity logged yet
          </div>
        )}
      </div>
    </div>
  );
};
