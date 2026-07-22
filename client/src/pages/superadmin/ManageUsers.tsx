import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User as UserIcon, ShieldCheck, CheckCircle2, XCircle, Mail, Calendar, Shield } from 'lucide-react';

export const ManageUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/super-admin/users')
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = async (id: string) => {
    try {
      await api.patch(`/super-admin/users/${id}/toggle`, {});
      load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">All Registered Users</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-450 mt-1">Manage global system identities, credentials and active scopes</p>
        </div>
        <span className="text-xs text-slate-500 dark:text-zinc-450 font-bold bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/60 px-2.5 py-1 rounded-lg">{users.length} total</span>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 overflow-hidden shadow-sm transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-zinc-900/40 border-b border-slate-200/60 dark:border-zinc-800/80">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">User Profile</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Email Address</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Associated Scopes & Roles</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center border border-blue-400/20 shadow-sm flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-zinc-150">{u.name}</p>
                          {u.isSuperAdmin && (
                            <span className="text-[8px] font-black uppercase bg-rose-500/10 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/25 dark:border-rose-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono">
                              <Shield className="w-2.5 h-2.5" /> Super Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-semibold text-slate-600 dark:text-zinc-350 flex items-center gap-1.5 font-mono">
                      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      {u.email}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {u.memberships?.map((m: any, i: number) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/40 dark:border-blue-950/30">
                          {m.role} @ {m.hospital?.name}
                        </span>
                      ))}
                      {u.patientProfile && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 border border-cyan-100/40 dark:border-cyan-950/30">
                          Patient
                        </span>
                      )}
                      {!u.memberships?.length && !u.patientProfile && (
                        <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-semibold italic">No active membership</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-450 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {!u.isSuperAdmin ? (
                      <button 
                        onClick={() => toggle(u.id)} 
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 border ${
                          u.isActive !== false
                            ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-rose-100 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-400 border-emerald-200/50 dark:border-emerald-500/20' 
                            : 'bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 border-rose-200/50 dark:border-rose-500/20'
                        }`}
                      >
                        {u.isActive !== false ? <><CheckCircle2 className="w-3.5 h-3.5" /> Active</> : <><XCircle className="w-3.5 h-3.5" /> Suspended</>}
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-650 italic">System Owner</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
