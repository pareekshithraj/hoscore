import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ShieldCheck, UserCheck, UserX, History, Activity, Calendar, Globe, AlertTriangle } from 'lucide-react';

interface DoctorAccess {
  id: string;
  name: string;
  specialty: string;
  hospitalName: string;
  status: 'ACTIVE' | 'REVOKED';
}

interface AuditLog {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  ipAddress: string | null;
  createdAt: string;
  hospital?: {
    name: string;
  } | null;
}

export const MyPrivacy = () => {
  const { selectedPatientId } = useAuth();
  const [doctors, setDoctors] = useState<DoctorAccess[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pidQuery = selectedPatientId ? `?patientId=${selectedPatientId}` : '';
      const [docsData, logsData] = await Promise.all([
        api.get(`/patient/access-grants${pidQuery}`),
        api.get(`/patient/access-logs${pidQuery}`)
      ]);
      setDoctors(docsData as DoctorAccess[]);
      setLogs(logsData as AuditLog[]);
    } catch (error) {
      console.error('Failed to fetch privacy data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPatientId]);

  const handleToggleAccess = async (doc: DoctorAccess) => {
    setTogglingId(doc.id);
    const isRevoking = doc.status === 'ACTIVE';
    const endpoint = isRevoking ? '/patient/access-grants/revoke' : '/patient/access-grants/restore';
    
    try {
      await api.post(endpoint, {
        doctorId: doc.id,
        patientId: selectedPatientId || undefined
      });
      // Update local state instantly
      setDoctors(prev => prev.map(d => d.id === doc.id ? { ...d, status: isRevoking ? 'REVOKED' : 'ACTIVE' } : d));
      // Re-fetch logs to show the new actions
      const pidQuery = selectedPatientId ? `?patientId=${selectedPatientId}` : '';
      const updatedLogs = await api.get(`/patient/access-logs${pidQuery}`);
      setLogs(updatedLogs as AuditLog[]);
    } catch (error) {
      console.error('Failed to toggle access', error);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      {/* Premium Header banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" /> Sovereign Privacy Panel
          </div>
          <h1 className="text-3xl font-black tracking-tight">Access Control & Real-time Audit Logs</h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            HOSCORE enforces strict HIPAA & Digital Personal Data Protection (DPDP) compliance. 
            Revoke a physician's access at any time. Monitor every read event of your clinical file chronologically.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Access Directory: Left Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" /> Physician Access Controls
              </h2>
              <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded-lg">
                {doctors.length} Registered Doctors
              </span>
            </div>

            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {doctors.map(doc => {
                const isActive = doc.status === 'ACTIVE';
                const isToggling = togglingId === doc.id;
                
                return (
                  <div 
                    key={doc.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isActive 
                        ? 'bg-white border-slate-100 hover:border-indigo-100' 
                        : 'bg-rose-50/10 border-rose-100/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                          {doc.specialty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">{doc.hospitalName}</p>
                    </div>

                    <button
                      onClick={() => handleToggleAccess(doc)}
                      disabled={isToggling}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100/80 border border-rose-100'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10'
                      }`}
                    >
                      {isToggling ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : isActive ? (
                        <>
                          <UserX className="w-3.5 h-3.5" /> Revoke Access
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" /> Grant Access
                        </>
                      )}
                    </button>
                  </div>
                );
              })}

              {doctors.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm">No physicians registered on the platform.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audit Log Timeline: Right Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" /> Digital Access Trail
              </h2>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Activity className="w-3 h-3 animate-pulse" /> Live Audit
              </span>
            </div>

            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {logs.map((log) => {
                const isDoctor = log.userRole === 'DOCTOR';
                return (
                  <div key={log.id} className="relative pl-6 border-l-2 border-slate-100 last:border-l-0 pb-4">
                    {/* Circle bullet */}
                    <div className={`absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      isDoctor ? 'bg-indigo-600' : 'bg-emerald-500'
                    }`} />
                    
                    <div className="bg-slate-50/50 hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-extrabold text-slate-800">{log.userName}</h4>
                          <span className="text-[9px] bg-slate-200 text-slate-600 font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded">
                            {log.userRole || 'STAFF'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium">
                        {log.details || 'Accessed patient record details'}
                      </p>

                      <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100/60">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-300" /> IP: {log.ipAddress || 'unknown'}
                        </span>
                        {log.hospital?.name && (
                          <span className="truncate max-w-[150px]">
                            🏢 {log.hospital.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {logs.length === 0 && (
                <div className="text-center py-16">
                  <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-bold">No access log entries yet</p>
                  <p className="text-slate-300 text-xs mt-1">Access events are securely written here in real-time when clinical users view charts.</p>
                </div>
              )}
            </div>

            <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-4 flex gap-3 text-xs text-amber-800 font-medium leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                Authorized medical accesses are performed under the Indian Digital Personal Data Protection (DPDP) Act rules. 
                Any unauthorized access must be escalated to the platform's Chief Information Security Officer immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
