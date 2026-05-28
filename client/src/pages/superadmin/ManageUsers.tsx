import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Building2, ShieldCheck, Stethoscope } from 'lucide-react';

export const ManageUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/super-admin/users').then(setUsers).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">All Users</h1>
        <span className="text-sm text-slate-500 font-medium">{users.length} total</span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">User</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Roles</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                      {u.isSuperAdmin && <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Super Admin</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {u.memberships?.map((m: any, i: number) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{m.role} @ {m.hospital?.name}</span>
                    ))}
                    {u.patientProfile && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">Patient</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
