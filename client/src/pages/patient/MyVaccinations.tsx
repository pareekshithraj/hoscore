import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shield, CheckCircle2, Clock, MapPin, Calendar, FileText, ChevronRight, X, AlertCircle } from 'lucide-react';

interface Vaccination {
  id: string;
  name: string;
  scheduledAge: string;
  status: 'PENDING' | 'COMPLETED';
  givenAt: string | null;
  givenBy: string | null;
  notes: string | null;
}

export const MyVaccinations = () => {
  const { selectedPatientId } = useAuth();
  const [vaccines, setVaccines] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  
  // Modal State
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccination | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [givenAt, setGivenAt] = useState('');
  const [givenBy, setGivenBy] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const fetchVaccines = () => {
    setLoading(true);
    const url = selectedPatientId ? `/patient/vaccinations?patientId=${selectedPatientId}` : '/patient/vaccinations';
    api.get(url)
      .then((data: any) => {
        setVaccines(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVaccines();
  }, [selectedPatientId]);

  const openReportModal = (v: Vaccination) => {
    setSelectedVaccine(v);
    setGivenAt(v.givenAt ? new Date(v.givenAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setGivenBy(v.givenBy || '');
    setNotes(v.notes || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaccine) return;
    
    setUpdating(true);
    setError('');
    
    try {
      await api.post('/patient/vaccinations', {
        id: selectedVaccine.id,
        status: 'COMPLETED',
        givenAt: new Date(givenAt).toISOString(),
        givenBy: givenBy || 'Self-reported (Patient Portal)',
        notes: notes || null
      });
      
      setIsModalOpen(false);
      fetchVaccines();
    } catch (err: any) {
      setError(err?.error || 'Failed to update vaccine record. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const completedCount = vaccines.filter(v => v.status === 'COMPLETED').length;
  const completionPercentage = vaccines.length > 0 ? Math.round((completedCount / vaccines.length) * 100) : 0;

  const filteredVaccines = vaccines.filter(v => {
    if (filter === 'COMPLETED') return v.status === 'COMPLETED';
    if (filter === 'PENDING') return v.status === 'PENDING';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      {/* Header Panel */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border border-indigo-500/30">
              <Shield className="w-3.5 h-3.5" /> Clinical Immunity
            </div>
            <h1 className="text-3xl font-black tracking-tight">Lifetime Vaccine Schedule</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Track and manage all recommended immunizations from infancy through adulthood. Record completions and secure self-reporting clinical histories.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 min-w-[240px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">Immunization Progress</span>
              <span className="text-lg font-bold text-emerald-400">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 mb-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>{completedCount} Completed</span>
              <span>{vaccines.length - completedCount} Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Overview Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'COMPLETED'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === opt
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {opt === 'ALL' ? 'All Vaccines' : opt === 'PENDING' ? 'Pending Action' : 'Fully Completed'}
            </button>
          ))}
        </div>
        
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredVaccines.length} of {vaccines.length} standard medical milestones
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        {filteredVaccines.map((v) => {
          const isCompleted = v.status === 'COMPLETED';
          return (
            <div 
              key={v.id} 
              className={`group relative overflow-hidden bg-white hover:bg-slate-50/50 rounded-2xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                isCompleted ? 'border-emerald-100 bg-emerald-50/5' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                <div className="flex items-start md:items-center gap-4">
                  {/* Status Indicator */}
                  <div className={`p-3 rounded-xl transition-all ${
                    isCompleted 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isCompleted 
                          ? 'bg-emerald-100/70 text-emerald-800' 
                          : 'bg-indigo-100/70 text-indigo-800'
                      }`}>
                        {v.scheduledAge}
                      </span>
                      {isCompleted && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                          Administered
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{v.name}</h3>
                    {isCompleted && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {v.givenAt ? new Date(v.givenAt).toLocaleDateString() : '-'}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {v.givenBy}</span>
                        {v.notes && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-slate-400" /> {v.notes}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <button
                    onClick={() => openReportModal(v)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isCompleted
                        ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10'
                    }`}
                  >
                    {isCompleted ? 'Edit Details' : 'Record Vaccination'} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredVaccines.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No vaccines match filter</h3>
            <p className="text-sm text-slate-400 mt-1">Try switching to all immunizations to view standard milestones.</p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {isModalOpen && selectedVaccine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 z-10">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-indigo-900 to-indigo-950 text-white p-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  {selectedVaccine.scheduledAge} Target
                </span>
                <h3 className="text-lg font-extrabold pr-8">{selectedVaccine.name}</h3>
                <p className="text-xs text-indigo-200">Submit official immunization delivery records for your lifetime clinical record.</p>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveVaccine} className="p-6 space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date Administered</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={givenAt}
                    onChange={(e) => setGivenAt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinic / Doctor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Hospital Child Wellness Clinic"
                  value={givenBy}
                  onChange={(e) => setGivenBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notes / Batch No. (Optional)</label>
                <textarea
                  placeholder="Batch code, dose type, specific nurse or reactions observed..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 font-medium resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                >
                  {updating ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
