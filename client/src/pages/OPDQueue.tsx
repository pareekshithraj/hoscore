import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, Plus, CheckCircle, MonitorX, Play, Search, Shield, 
  HeartPulse, User, Calendar, BookOpen, FileText, 
  PlusCircle, Trash2, Edit, Save, RefreshCw, Activity,
  Stethoscope, Droplet, UserCheck
} from 'lucide-react';

const LAB_TEST_OPTIONS = [
  "Complete Blood Count (CBC)",
  "Basic Metabolic Panel (BMP)",
  "Lipid Profile",
  "Liver Function Test (LFT)",
  "Kidney Function Test (KFT)",
  "Thyroid Profile (T3, T4, TSH)",
  "Blood Sugar (Fasting & PP)",
  "Urine Routine Analysis"
];

const calculateTargetDate = (interval: string) => {
  const date = new Date();
  if (interval === '15 Days') {
    date.setDate(date.getDate() + 15);
  } else if (interval === '1 Month') {
    date.setMonth(date.getMonth() + 1);
  } else if (interval === '2 Months') {
    date.setMonth(date.getMonth() + 2);
  } else if (interval === '3 Months') {
    date.setMonth(date.getMonth() + 3);
  } else if (interval === '4 Months') {
    date.setMonth(date.getMonth() + 4);
  } else if (interval === '5 Months') {
    date.setMonth(date.getMonth() + 5);
  } else if (interval === '6 Months') {
    date.setMonth(date.getMonth() + 6);
  } else {
    return null;
  }
  return date;
};

export const OPDQueue = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientName: '', doctorName: '', department: 'General', estimatedWait: 15, isHoscoreUser: true, manualCareNote: '' });

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  const [activePatient, setActivePatient] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [patientError, setPatientError] = useState('');
  const [manualCareMode, setManualCareMode] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<any>(null);
  const [searchId, setSearchId] = useState('');

  // Clinical inputs
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<{name: string, dosage: string, duration: string, instructions: string}[]>([]);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medDuration, setMedDuration] = useState('');
  const [medInstructions, setMedInstructions] = useState('');

  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [labPriority, setLabPriority] = useState('ROUTINE');
  const [alertInterval, setAlertInterval] = useState('None');

  const [isEditingHistory, setIsEditingHistory] = useState(false);
  const [editedHistory, setEditedHistory] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => { 
    loadQueue(); 
  }, []);

  useEffect(() => {
    if (user?.email) {
      api.get('/doctors').then(res => {
        setDoctors(res);
        // Match doctor profile by user email
        const match = res.find((d: any) => d.email?.toLowerCase() === user.email?.toLowerCase());
        if (match) {
          setSelectedDoctor(match);
        } else if (res.length > 0) {
          // Fallback to the first doctor in the hospital
          setSelectedDoctor(res[0]);
        }
      }).catch(err => console.error("Failed to load doctor list", err));
    }
  }, [user]);

  const loadQueue = () => api.get('/queue').then(setQueue).catch(() => {});

  const handleAdd = async () => {
    await api.post('/queue', form);
    setShowForm(false);
    setForm({ patientName: '', doctorName: '', department: 'General', estimatedWait: 15, isHoscoreUser: true, manualCareNote: '' });
    loadQueue();
  };

  const handleStatus = async (id: string, status: string) => {
    await api.patch(`/queue/${id}/status`, { status });
    loadQueue();
  };

  const loadPatientDetails = async (patientId: string) => {
    setLoadingPatient(true);
    setPatientError('');
    try {
      const res = await api.get(`/patients/${patientId}`);
      setActivePatient(res);
      setEditedHistory(res.medicalHistory || '');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Error loading patient clinical records.";
      setPatientError(errorMsg);
      setActivePatient(null);
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleSelectQueueItem = async (item: any) => {
    setSelectedQueueItem(item);
    setPatientError('');
    setManualCareMode(false);
    setActivePatient(null);

    // If status is WAITING, transition to IN_CONSULTATION automatically
    if (item.status === 'WAITING') {
      try {
        await api.patch(`/queue/${item.id}/status`, { status: 'IN_CONSULTATION' });
        loadQueue();
        item.status = 'IN_CONSULTATION';
      } catch (err) {
        console.error("Failed to update queue status", err);
      }
    }

    if (item.patient?.isHoscoreUser === false) {
      setPatientError(item.patient.manualCareNote || 'Manual-care patient: this patient does not use HOSCORE phone/app access. Continue the consultation manually and use paper/local records as needed.');
      setManualCareMode(true);
      setLoadingPatient(false);
      return;
    }

    if (item.patientId) {
      loadPatientDetails(item.patientId);
    } else {
      // Fallback: search if patient exists by name
      setLoadingPatient(true);
      try {
        const patients = await api.get('/patients');
        const matchedPatient = patients.find((p: any) => p.name.toLowerCase() === item.patientName.toLowerCase());
        if (matchedPatient) {
          loadPatientDetails(matchedPatient.id);
        } else {
          setPatientError(`This token is not linked to an active Patient profile. Please register the patient or search by 6-digit ID to load their record.`);
          setLoadingPatient(false);
        }
      } catch (err) {
        setPatientError(`Could not resolve patient profile. Please search by 6-digit HOSCORE ID.`);
        setLoadingPatient(false);
      }
    }
  };

  const handleSearchPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (!trimmed) return;

    setLoadingPatient(true);
    setPatientError('');
    setManualCareMode(false);
    setActivePatient(null);
    setSelectedQueueItem(null); // Direct ID lookup is independent

    // Support HSC-XXXXXX or XXXXXX formats
    const formattedId = trimmed.toUpperCase().startsWith('HSC-') ? trimmed.substring(4) : trimmed;

    try {
      const res = await api.get(`/patients/search/${formattedId}`);
      setActivePatient(res);
      setEditedHistory(res.medicalHistory || '');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Patient clinical record not found or access restricted.";
      setPatientError(errorMsg);
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleSaveHistory = async () => {
    if (!activePatient) return;
    try {
      await api.put(`/patients/${activePatient.id}`, { medicalHistory: editedHistory });
      setActivePatient({ ...activePatient, medicalHistory: editedHistory });
      setIsEditingHistory(false);
    } catch (err) {
      console.error("Failed to update medical history", err);
    }
  };

  const handleAddMedicine = () => {
    if (!medName.trim()) return;
    setMedicines([...medicines, {
      name: medName.trim(),
      dosage: medDosage.trim() || '1-0-1',
      duration: medDuration.trim() || '5 Days',
      instructions: medInstructions.trim() || 'After meals'
    }]);
    setMedName('');
    setMedDosage('');
    setMedDuration('');
    setMedInstructions('');
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleCompleteTreatment = async () => {
    if (!activePatient) return;
    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      const docId = selectedDoctor?.id;
      if (!docId) {
        alert("Error: No doctor profile resolved. Please select or register a doctor first.");
        setSubmitting(false);
        return;
      }

      // 1. Create Prescription
      const serializedMedicines = medicines.map(m => `${m.name} (${m.dosage} | ${m.duration} | ${m.instructions})`).join('\n');
      const rxPayload = {
        doctorId: docId,
        patientId: activePatient.id,
        diagnosis: diagnosis || 'General Consultation',
        medicines: serializedMedicines || 'No medicines prescribed',
        instructions: 'Consultation notes: ' + (diagnosis || 'Routine checkup')
      };
      await api.post('/prescriptions', rxPayload);

      // 2. Create Lab Orders if any selected
      if (selectedLabs.length > 0) {
        const labPayload = {
          patientName: activePatient.name,
          patientId: activePatient.id,
          doctorName: selectedDoctor.name,
          doctorId: docId,
          testName: selectedLabs.join(', '),
          testType: 'Diagnostic Panels',
          priority: labPriority
        };
        await api.post('/lab-orders', labPayload);
      }

      // 3. Update Patient's next appointment details
      const patientUpdatePayload: any = {};
      if (alertInterval !== 'None') {
        const targetDate = calculateTargetDate(alertInterval);
        patientUpdatePayload.nextAppointmentAlertInterval = alertInterval;
        patientUpdatePayload.nextAppointmentAlertDate = targetDate;
        patientUpdatePayload.nextAppointmentAlertStatus = 'ACTIVE';
      } else {
        patientUpdatePayload.nextAppointmentAlertInterval = 'None';
        patientUpdatePayload.nextAppointmentAlertDate = null;
        patientUpdatePayload.nextAppointmentAlertStatus = 'INACTIVE';
      }
      await api.put(`/patients/${activePatient.id}`, patientUpdatePayload);

      // 4. Update OPD Queue Token status to COMPLETED
      if (selectedQueueItem) {
        await api.patch(`/queue/${selectedQueueItem.id}/status`, { status: 'COMPLETED' });
      }

      setSubmitSuccess(true);
      setDiagnosis('');
      setMedicines([]);
      setSelectedLabs([]);
      setAlertInterval('None');
      
      loadQueue();
      loadPatientDetails(activePatient.id);

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error("Failed to complete treatment", err);
    } finally {
      setSubmitting(false);
    }
  };

  const computedTargetDate = alertInterval !== 'None' ? calculateTargetDate(alertInterval) : null;

  return (
    <div className="space-y-8 pb-8 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 glass-card rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-sky-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Clinic Consultation Workspace
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Live patient queue management & digital clinical treatment console
            </p>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {selectedDoctor && (
            <div className="flex items-center gap-2.5 px-4 py-2 bg-[#0b1329]/80 border border-white/10 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">
                Dr. {selectedDoctor.name} ({selectedDoctor.specialty})
              </span>
            </div>
          )}
          <button 
            onClick={() => setShowForm(true)} 
            className="flex items-center gap-2 px-5 py-2.5 btn-premium font-bold rounded-xl text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Patient to Queue
          </button>
        </div>
      </div>

      {/* Search & Active Patient Ribbon */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <Search className="w-4 h-4 text-sky-400" />
          <span>Direct Patient ID Lookup:</span>
        </div>
        <form onSubmit={handleSearchPatient} className="flex items-center gap-2 w-full md:w-auto max-w-md flex-1">
          <input 
            type="text" 
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            placeholder="Enter 6-Digit ID (e.g. HSC-123456)" 
            className="bg-[#0b1329]/60 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#0ea5e9]/50 transition-all flex-1"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Grid: Split Screen Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Live Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-white text-lg tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-400" />
                Live OPD Queue
              </h3>
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400 tracking-wider">
                {queue.length} Total
              </span>
            </div>

            <div className="space-y-4 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
              {queue.map(q => {
                const isSelected = selectedQueueItem?.id === q.id;
                return (
                  <div 
                    key={q.id} 
                    onClick={() => handleSelectQueueItem(q)}
                    className={`glass-card p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-3 ${
                      isSelected 
                        ? 'border-[#0ea5e9]/40 bg-[#0f1d3a]/50 shadow-[0_0_15px_rgba(14,165,233,0.15)]' 
                        : 'border-white/5 hover:border-white/15 bg-white/2'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex flex-col items-center justify-center text-sky-400">
                          <span className="text-[7px] font-extrabold uppercase tracking-widest text-slate-400">Tkn</span>
                          <span className="text-base font-black leading-none">{q.tokenNumber}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{q.patientName}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Dr. {q.doctorName} · {q.department}</p>
                          {q.patient?.isHoscoreUser === false && (
                            <p className="text-[10px] text-amber-300 font-extrabold mt-1 uppercase tracking-wider">
                              Manual care patient
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          q.status === 'WAITING' 
                            ? 'badge-premium-amber' 
                            : q.status === 'IN_CONSULTATION' 
                              ? 'badge-premium-cyan animate-glow-pulse' 
                              : q.status === 'COMPLETED' 
                                ? 'badge-premium-emerald' 
                                : 'badge-premium-rose'
                        }`}>
                          {q.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {q.estimatedWait}m wait
                      </span>
                      
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        {q.status === 'WAITING' && (
                          <button 
                            onClick={() => handleStatus(q.id, 'IN_CONSULTATION')} 
                            className="p-1 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500 hover:text-white rounded-lg text-sky-400 transition-all cursor-pointer"
                            title="Call Patient"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {q.status === 'IN_CONSULTATION' && (
                          <button 
                            onClick={() => handleStatus(q.id, 'COMPLETED')} 
                            className="p-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-lg text-emerald-400 transition-all cursor-pointer"
                            title="Mark Completed"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {q.status !== 'COMPLETED' && q.status !== 'SKIPPED' && (
                          <button 
                            onClick={() => handleStatus(q.id, 'SKIPPED')} 
                            className="p-1 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-lg text-rose-400 transition-all cursor-pointer"
                            title="Skip Patient"
                          >
                            <MonitorX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {queue.length === 0 && (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <p className="text-sm text-slate-500 font-semibold">Active queue is empty</p>
                  <p className="text-xs text-slate-600 mt-1">Add a patient to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Treatment Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {submitSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-2xl text-sm flex items-center gap-3 animate-fade-in-up">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p>Consultation successfully completed!</p>
                <p className="text-xs font-normal text-emerald-500/80 mt-0.5">E-prescription generated, lab orders sent, and patient follow-up alert recorded.</p>
              </div>
            </div>
          )}

          {/* LOADING PATIENT STATE */}
          {loadingPatient && (
            <div className="glass-card p-16 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-10 h-10 border-4 border-white/10 border-t-sky-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm font-bold tracking-wide animate-pulse">
                RETRIEVING PATIENT CLINICAL DATA SYSTEM...
              </p>
            </div>
          )}

          {/* MANUAL CARE / SECURITY RESTRICTION STATE */}
          {!loadingPatient && patientError && (
            <div className={`glass-card p-8 rounded-2xl border flex flex-col gap-6 ${
              manualCareMode
                ? 'border-amber-500/20 bg-amber-950/10 shadow-[0_8px_32px_rgba(245,158,11,0.08)]'
                : 'border-red-500/20 bg-red-950/10 shadow-[0_8px_32px_rgba(239,68,68,0.1)]'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  manualCareMode ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {manualCareMode ? <FileText className="w-6 h-6" /> : <Shield className="w-6 h-6 animate-pulse" />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    {manualCareMode ? 'Manual Care Token' : 'Security Boundary Alert'}
                  </h3>
                  <p className={`text-sm font-semibold leading-relaxed ${manualCareMode ? 'text-amber-100/85' : 'text-red-300/80'}`}>
                    {patientError}
                  </p>
                  <div className="p-3 bg-black/30 rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed mt-2">
                    {manualCareMode ? (
                      <>
                        <strong>Manual Workflow:</strong> This patient is registered only for hospital-side handling. Continue the visit using the hospital's existing paper/local process, then optionally add a HOSCORE record later if the patient consents.
                      </>
                    ) : (
                      <>
                        <strong>Access Policy:</strong> Medical records on HOSCORE are governed by strict patient-privacy boundaries. Doctors are only authorized to access a patient's chart if there is an active check-in or a past/scheduled appointment or admission at their facility.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NO PATIENT SELECTED STATE */}
          {!loadingPatient && !patientError && !activePatient && (
            <div className="glass-card p-20 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center gap-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-sky-500/2 to-transparent pointer-events-none" />
              <div className="w-16 h-16 bg-sky-500/5 border border-sky-500/15 rounded-3xl flex items-center justify-center text-sky-400 animate-float">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">Clinical Workspace Idle</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                  Select an active patient from the live queue on the left, or query their unique 6-digit HOSCORE ID above to access charts, write prescriptions, and order tests.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/3 border border-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5" /> SECURE CONSOLE ACTIVE
              </div>
            </div>
          )}

          {/* ACTIVE CONSULTATION WORKSPACE */}
          {!loadingPatient && !patientError && activePatient && (
            <div className="space-y-6">
              
              {/* Patient Clinical Info Card */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
                
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-white flex flex-wrap items-center gap-2">
                        {activePatient.name}
                        <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
                          HSC-{activePatient.sixDigitId}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Gender: {activePatient.gender || 'Not Specified'} · DOB: {activePatient.dateOfBirth ? new Date(activePatient.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Blood Type</span>
                      <span className="text-sm font-black text-rose-400 flex items-center gap-1 justify-end">
                        <Droplet className="w-4 h-4 text-rose-500" />
                        {activePatient.bloodGroup || 'O+'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Medical History Section */}
                <div className="bg-[#0b1329]/40 border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-sky-400" />
                      Medical History & Chronic Conditions
                    </h4>
                    <button 
                      onClick={() => {
                        if (isEditingHistory) {
                          handleSaveHistory();
                        } else {
                          setIsEditingHistory(true);
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold transition-all cursor-pointer"
                    >
                      {isEditingHistory ? (
                        <>
                          <Save className="w-3.5 h-3.5" /> Save Chart
                        </>
                      ) : (
                        <>
                          <Edit className="w-3.5 h-3.5" /> Edit History
                        </>
                      )}
                    </button>
                  </div>

                  {isEditingHistory ? (
                    <textarea
                      value={editedHistory}
                      onChange={e => setEditedHistory(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500/50 min-h-[80px]"
                      placeholder="Enter patient chronic illnesses, drug allergies, surgeries, or family history..."
                    />
                  ) : (
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      {activePatient.medicalHistory || "No past chronic illnesses or drug allergies recorded in HOSCORE ledger."}
                    </p>
                  )}
                </div>

                {/* History-Preserved Prescriptions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-400" />
                    Prescription History (Hospital Scoped Ledger)
                  </h4>
                  
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {activePatient.prescriptions && activePatient.prescriptions.length > 0 ? (
                      activePatient.prescriptions.map((rx: any) => (
                        <div key={rx.id} className="p-3.5 bg-white/2 border border-white/5 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-center text-slate-400">
                            <span className="font-bold text-slate-300">Dr. {rx.doctor?.name || 'Authorized Doctor'}</span>
                            <span>{new Date(rx.date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-slate-300 font-semibold">
                            <span className="text-slate-500">Diagnosis: </span>{rx.diagnosis}
                          </div>
                          <div className="text-slate-300 leading-relaxed whitespace-pre-line font-mono bg-black/20 p-2 rounded-lg border border-white/5 text-[11px]">
                            {rx.medicines}
                          </div>
                          {rx.instructions && (
                            <div className="text-slate-400 italic">
                              <span className="text-slate-500 font-semibold">Instructions: </span>{rx.instructions}
                            </div>
                          )}
                          <div className="flex justify-end">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              rx.status === 'DISPENSED' ? 'badge-premium-emerald' : 'badge-premium-cyan'
                            }`}>
                              {rx.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 font-medium py-3 italic">
                        No prescriptions generated at this facility.
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* E-Consultation Submission Form */}
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
                <h3 className="font-extrabold text-white text-lg tracking-tight flex items-center gap-2 border-b border-white/5 pb-3">
                  <HeartPulse className="w-5 h-5 text-sky-400" />
                  Active Diagnostic & E-Prescribing Workspace
                </h3>

                {/* Diagnosis Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Diagnosis / Clinical Findings</label>
                  <textarea
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    placeholder="Type patient's diagnosis and consultation findings (e.g. Essential hypertension, Grade 2)..."
                    className="w-full bg-[#0b1329]/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#0ea5e9]/50 transition-all min-h-[80px]"
                  />
                </div>

                {/* Medicines Builder */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Add Prescription Medicines</label>
                  
                  {/* Medicines List Summary */}
                  {medicines.length > 0 && (
                    <div className="border border-white/5 bg-black/20 rounded-xl overflow-hidden mb-4">
                      <table className="w-full text-xs text-left">
                        <thead className="table-header text-slate-400 border-b border-white/5">
                          <tr>
                            <th className="px-4 py-2.5">Medicine Name</th>
                            <th className="px-4 py-2.5">Dosage</th>
                            <th className="px-4 py-2.5">Duration</th>
                            <th className="px-4 py-2.5">Instructions</th>
                            <th className="px-4 py-2.5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {medicines.map((m, idx) => (
                            <tr key={idx} className="text-slate-300">
                              <td className="px-4 py-2.5 font-bold">{m.name}</td>
                              <td className="px-4 py-2.5 font-mono">{m.dosage}</td>
                              <td className="px-4 py-2.5">{m.duration}</td>
                              <td className="px-4 py-2.5 text-slate-400 italic">{m.instructions}</td>
                              <td className="px-4 py-2.5 text-center">
                                <button 
                                  onClick={() => handleRemoveMedicine(idx)}
                                  className="text-rose-400 hover:text-rose-300 p-1 rounded transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Inline form to add medicine */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/2 p-3.5 border border-white/5 rounded-xl">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Name</span>
                      <input
                        type="text"
                        value={medName}
                        onChange={e => setMedName(e.target.value)}
                        placeholder="e.g. Paracetamol 650"
                        className="w-full bg-[#0b1329]/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dosage</span>
                      <input
                        type="text"
                        value={medDosage}
                        onChange={e => setMedDosage(e.target.value)}
                        placeholder="e.g. 1-0-1 or 5ml"
                        className="w-full bg-[#0b1329]/88 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                      <input
                        type="text"
                        value={medDuration}
                        onChange={e => setMedDuration(e.target.value)}
                        placeholder="e.g. 5 Days"
                        className="w-full bg-[#0b1329]/88 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Instructions</span>
                      <input
                        type="text"
                        value={medInstructions}
                        onChange={e => setMedInstructions(e.target.value)}
                        placeholder="e.g. After meals"
                        className="w-full bg-[#0b1329]/88 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <div className="sm:col-span-4 flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddMedicine}
                        className="flex items-center gap-1 px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Medicine to List
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lab Test Orders Checklist */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Request Lab Test Panels</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-white/2 border border-white/5 rounded-xl">
                    {LAB_TEST_OPTIONS.map((lab, i) => {
                      const isChecked = selectedLabs.includes(lab);
                      return (
                        <label key={i} className="flex items-center gap-3 text-slate-300 text-xs font-semibold cursor-pointer p-1.5 hover:bg-white/3 rounded transition-all">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedLabs(selectedLabs.filter(l => l !== lab));
                              } else {
                                setSelectedLabs([...selectedLabs, lab]);
                              }
                            }}
                            className="w-4 h-4 accent-sky-500 rounded border-white/10 bg-black/40 focus:ring-0"
                          />
                          <span>{lab}</span>
                        </label>
                      );
                    })}
                  </div>

                  {selectedLabs.length > 0 && (
                    <div className="flex items-center gap-4 text-xs font-bold bg-[#0b1329]/40 border border-white/5 p-3 rounded-xl">
                      <span className="text-slate-400">Lab Order Priority:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input 
                          type="radio" 
                          name="priority" 
                          value="ROUTINE"
                          checked={labPriority === 'ROUTINE'}
                          onChange={() => setLabPriority('ROUTINE')}
                          className="accent-sky-500" 
                        />
                        Routine
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input 
                          type="radio" 
                          name="priority" 
                          value="URGENT"
                          checked={labPriority === 'URGENT'}
                          onChange={() => setLabPriority('URGENT')}
                          className="accent-rose-500" 
                        />
                        Urgent ⚠️
                      </label>
                    </div>
                  )}
                </div>

                {/* Follow-up Alert Dropdown */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Set Next Follow-up Alert</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      value={alertInterval}
                      onChange={e => setAlertInterval(e.target.value)}
                      className="bg-[#0b1329]/90 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500/50"
                    >
                      <option value="None">None (No Alert)</option>
                      <option value="15 Days">15 Days</option>
                      <option value="1 Month">1 Month</option>
                      <option value="2 Months">2 Months</option>
                      <option value="3 Months">3 Months</option>
                      <option value="4 Months">4 Months</option>
                      <option value="5 Months">5 Months</option>
                      <option value="6 Months">6 Months</option>
                    </select>

                    <div className="flex items-center text-xs font-semibold text-slate-400 bg-white/2 border border-white/5 rounded-xl px-4">
                      {alertInterval !== 'None' && computedTargetDate ? (
                        <span className="flex items-center gap-2 text-cyan-400">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          Target Date: {computedTargetDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">No future appointment alert will be scheduled</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Complete Consultation Button */}
                <div className="pt-4 flex justify-end border-t border-white/5">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCompleteTreatment}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 btn-premium text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all cursor-pointer w-full sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Uploading Medical Records & Signing E-Prescription...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5" />
                        Complete Consultation & Sign Prescription
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* ADD TO QUEUE GLASSMODAL */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" 
          onClick={() => setShowForm(false)}
        >
          <div 
            className="glass-card rounded-2xl w-full max-w-md p-6 border border-white/10" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white tracking-tight">Add Token to Live OPD Queue</h3>
              <button 
                onClick={() => setShowForm(false)} 
                className="text-slate-400 hover:text-white transition-all text-xs font-bold"
              >
                Cancel
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient Name</span>
                <input 
                  value={form.patientName} 
                  onChange={e => setForm({...form, patientName: e.target.value})} 
                  placeholder="Enter patient full name" 
                  className="w-full bg-[#0b1329]/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500/50" 
                />
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigning Doctor</span>
                <input 
                  value={form.doctorName} 
                  onChange={e => setForm({...form, doctorName: e.target.value})} 
                  placeholder="Doctor Name (e.g. Dr. Verma)" 
                  className="w-full bg-[#0b1329]/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500/50" 
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</span>
                <select 
                  value={form.department} 
                  onChange={e => setForm({...form, department: e.target.value})} 
                  className="w-full bg-[#0b1329]/90 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                >
                  <option>General</option>
                  <option>Cardiology</option>
                  <option>Pediatrics</option>
                  <option>Neurology</option>
                  <option>Dermatology</option>
                  <option>Orthopedics</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estimated Wait (Minutes)</span>
                <input 
                  type="number"
                  value={form.estimatedWait} 
                  onChange={e => setForm({...form, estimatedWait: parseInt(e.target.value) || 15})} 
                  placeholder="Estimated wait in minutes" 
                  className="w-full bg-[#0b1329]/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500/50" 
                />
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <label className="flex items-start gap-3 text-xs font-bold text-amber-100">
                  <input
                    type="checkbox"
                    checked={!form.isHoscoreUser}
                    onChange={e => setForm({...form, isHoscoreUser: !e.target.checked})}
                    className="mt-0.5"
                  />
                  Non-HOSCORE walk-in patient
                </label>
                <p className="text-[11px] text-amber-100/70 mt-1 ml-6">
                  Use this for patients who cannot use phone/app access. The doctor will see a manual-care warning when the token is called.
                </p>
                {!form.isHoscoreUser && (
                  <textarea
                    value={form.manualCareNote}
                    onChange={e => setForm({...form, manualCareNote: e.target.value})}
                    placeholder="Note for doctor"
                    className="mt-3 w-full bg-[#0b1329]/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
                  />
                )}
              </div>

              <button 
                onClick={handleAdd} 
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold rounded-xl transition-all shadow-lg text-sm mt-2 cursor-pointer"
              >
                Generate Queue Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
