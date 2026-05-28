import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Calendar, Activity, Clock, Bed, Heart, Droplet, Phone, ArrowLeft, Receipt, Stethoscope, UserCheck } from 'lucide-react';

export const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [today] = useState(() => new Date());

  useEffect(() => {
    if (id) {
      api.get(`/patients/${id}`)
        .then(res => setPatient(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 text-blue-600 animate-bounce" />
          <p className="text-slate-500 font-medium">Loading patient record...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <p className="text-slate-500 font-medium text-lg">Patient not found.</p>
      </div>
    );
  }

  const calculateAge = (dobString: string | null) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    return Math.abs(new Date(today.getTime() - dob.getTime()).getUTCFullYear() - 1970);
  };

  const statusColors = {
    'Out-Patient': 'bg-blue-100 text-blue-800',
    'Admitted': 'bg-emerald-100 text-emerald-800',
    'Discharged': 'bg-slate-100 text-slate-800',
  };

  const convertToHoscore = async () => {
    if (!id) return;
    setConverting(true);
    try {
      const updated = await api.patch(`/patients/${id}/convert-hoscore`, {});
      setPatient(updated);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 text-slate-500">
        <Link to="/dashboard/patients" className="p-2 hover:bg-white hover:shadow rounded-full transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold text-sm uppercase tracking-wider">Patient 360° View</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Core Info */}
        <div className="lg:col-span-1 space-y-8">
          {/* Main Profile Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl transform group-hover:scale-150 transition-transform duration-700"></div>
            
            <div className="flex items-center gap-6 mb-8 relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-600/20">
                {patient.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{patient.name}</h1>
                <p className="text-slate-500 font-mono mt-1 text-sm bg-slate-100 inline-block px-2 py-0.5 rounded">
                  {patient.isHoscoreUser === false ? 'Manual walk-in patient' : `HSC-${patient.sixDigitId || patient.id.padStart(5, '0')}`}
                </p>
                {patient.isHoscoreUser === false && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      {patient.manualCareNote || 'This patient does not use HOSCORE phone/app access. Continue manual care workflow as needed.'}
                    </p>
                    <button
                      onClick={convertToHoscore}
                      disabled={converting}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-black disabled:opacity-60"
                    >
                      <UserCheck className="w-4 h-4" />
                      {converting ? 'Converting...' : 'Convert to HOSCORE User'}
                    </button>
                  </div>
                )}
                <div className="mt-3">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[patient.status as keyof typeof statusColors] || statusColors['Out-Patient']}`}>
                    {patient.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Age / Gender</p>
                  <p className="font-medium text-slate-900">{calculateAge(patient.dateOfBirth)} years, {patient.gender}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl">
                <Droplet className="w-5 h-5 text-rose-400" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blood Group</p>
                  <p className="font-bold text-rose-600">{patient.bloodGroup || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</p>
                  <p className="font-medium text-slate-900">{patient.contact || 'N/A'}</p>
                  {patient.email && <p className="text-sm text-slate-500">{patient.email}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-6">
              <Heart className="w-5 h-5 text-rose-500" />
              Medical Context
            </h3>
            <div className="prose prose-sm prose-slate">
              {patient.medicalHistory ? (
                <p className="text-slate-600 leading-relaxed bg-rose-50/50 p-4 rounded-xl border border-rose-100">{patient.medicalHistory}</p>
              ) : (
                <p className="text-slate-400 italic">No historical conditions logged.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Timeline & Records */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Appointments Pipeline */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Stethoscope className="w-5 h-5 text-blue-500" />
                Appointments & Consultations
              </h3>
            </div>
            
            {patient.appointments?.length > 0 ? (
              <div className="space-y-4">
                {patient.appointments.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-600">
                        {new Date(apt.date).getDate()}
                        <span className="text-[10px] ml-0.5">{new Date(apt.date).toLocaleString('default', { month: 'short' })}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{apt.doctor?.name || 'Unassigned Doctor'}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {apt.time}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      apt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No appointments on record.
              </div>
            )}
          </div>

          {/* Admissions Journey */}
          {patient.admissions?.length > 0 && (
            <div className="bg-slate-900 rounded-3xl p-8 shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
              <h3 className="flex items-center gap-2 text-lg font-bold mb-6">
                <Bed className="w-5 h-5 text-emerald-400" />
                Admission History
              </h3>
              
              <div className="space-y-6 relative z-10">
                {patient.admissions.map((adm: any) => (
                  <div key={adm.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-emerald-400">{adm.bed?.room?.name || 'Ward'} - Bed {adm.bed?.bedNumber}</h4>
                        <p className="text-sm text-slate-400 mt-1">{adm.reason || 'General Observation'}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${adm.status === 'Active' ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-slate-300'}`}>
                        {adm.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/10">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Admitted</p>
                        <p className="text-sm font-medium">{new Date(adm.admissionDate).toLocaleDateString()}</p>
                      </div>
                      <div className="h-6 w-px bg-white/10"></div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Discharged</p>
                        <p className="text-sm font-medium">{adm.dischargeDate ? new Date(adm.dischargeDate).toLocaleDateString() : 'Present'}</p>
                      </div>
                      
                      {adm.billing && (
                        <>
                          <div className="h-6 w-px bg-white/10"></div>
                          <div className="flex-1 flex justify-end">
                            <div className="text-right">
                              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center justify-end gap-1"><Receipt className="w-3 h-3"/> Bill Status</p>
                              <p className={`text-sm font-bold ${adm.billing.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>${adm.billing.totalAmount.toLocaleString()} • {adm.billing.status}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
