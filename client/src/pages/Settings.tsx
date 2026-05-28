import { useState, useEffect, useRef } from 'react';
import { Clock, Shield, Bell, Save, Globe, Hospital, Upload, Camera, CheckCircle, ImagePlus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { COUNTRIES, citiesForRegion, statesForCountry } from '../utils/locations';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [hours, setHours] = useState<any[]>([]);
  const [status, setStatus] = useState({ success: false, error: '' });
  const [hospitalData, setHospitalData] = useState({
    name: '',
    address: '',
    country: '',
    city: '',
    state: '',
    contact: '',
    description: '',
    logo: '',
    photos: [] as string[],
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const photoFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/schedules/defaults').then(setHours).catch(() => {});
    api.get('/hospital/current').then((data) => {
      setHospitalData(prev => ({
        ...prev,
        ...data,
        photos: Array.isArray(data?.photos) ? data.photos : [],
      }));
    }).catch(() => {});
  }, []);

  const hospitalPhotos = Array.isArray(hospitalData.photos) ? hospitalData.photos.filter(Boolean) : [];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'logos');
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setHospitalData(prev => ({ ...prev, logo: data.url }));
        // Save to hospital record
        await api.patch('/hospital/update', { logo: data.url });
        setStatus({ success: true, error: '' });
        setTimeout(() => setStatus({ success: false, error: '' }), 3000);
      }
    } catch (err) {
      setStatus({ success: false, error: 'Failed to upload logo' });
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'hospital-photos');
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const nextPhotos = [...hospitalPhotos, data.url].slice(0, 12);
        setHospitalData(prev => ({ ...prev, photos: nextPhotos }));
        await api.patch('/hospital/update', { photos: nextPhotos });
        setStatus({ success: true, error: '' });
        setTimeout(() => setStatus({ success: false, error: '' }), 3000);
      }
    } catch (err) {
      setStatus({ success: false, error: 'Failed to upload hospital photo' });
    } finally {
      setUploadingPhoto(false);
      if (photoFileRef.current) photoFileRef.current.value = '';
    }
  };

  const removePhoto = async (url: string) => {
    const nextPhotos = hospitalPhotos.filter(photo => photo !== url);
    setHospitalData(prev => ({ ...prev, photos: nextPhotos }));
    try {
      await api.patch('/hospital/update', { photos: nextPhotos });
      setStatus({ success: true, error: '' });
      setTimeout(() => setStatus({ success: false, error: '' }), 3000);
    } catch (err) {
      setStatus({ success: false, error: 'Failed to remove hospital photo' });
    }
  };

  const handleSaveGeneral = async () => {
    setStatus({ success: false, error: '' });
    try {
      await api.patch('/hospital/update', {
        name: hospitalData.name,
        address: hospitalData.address,
        country: hospitalData.country,
        city: hospitalData.city,
        state: hospitalData.state,
        contact: hospitalData.contact,
        description: hospitalData.description,
        photos: hospitalPhotos,
      });
      setStatus({ success: true, error: '' });
      setTimeout(() => setStatus({ success: false, error: '' }), 3000);
    } catch (e) {
      setStatus({ success: false, error: 'Failed to save settings' });
    }
  };

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Hospital Settings</h2>
        <p className="text-sm text-slate-400">Configure global operational defaults and system security</p>
      </div>

      <div className="flex bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {/* Sidebar */}
        <div className="w-1/4 border-r border-slate-50 bg-slate-50/50 p-2 space-y-1">
          {[
            { id: 'GENERAL', label: 'General', icon: Globe },
            { id: 'HOURS', label: 'Operating Hours', icon: Clock },
            { id: 'SECURITY', label: 'Security', icon: Shield },
            { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-400 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          {activeTab === 'GENERAL' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Hospital className="w-5 h-5 text-blue-600" /> Institution Profile
              </h3>

              {/* Logo Upload */}
              <div className="flex items-center gap-6 p-6 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div
                  onClick={() => logoFileRef.current?.click()}
                  className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-dashed border-blue-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all group overflow-hidden"
                >
                  {hospitalData.logo ? (
                    <>
                      <img src={hospitalData.logo} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-blue-400 group-hover:text-blue-600 transition-colors">
                      {uploading ? (
                        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6" />
                          <span className="text-[10px] font-bold">Upload</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <div>
                  <p className="text-sm font-bold text-slate-700">Hospital Logo</p>
                  <p className="text-xs text-slate-400 mt-1">Upload your hospital logo. Recommended: 512×512px, PNG or JPG.</p>
                  {uploading && <p className="text-xs text-blue-600 mt-1 font-medium">Uploading to cloud...</p>}
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Hospital Photos</p>
                    <p className="text-xs text-slate-400 mt-1">Add public profile photos for the building, reception, wards, labs, and facilities.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => photoFileRef.current?.click()}
                    disabled={uploadingPhoto || hospitalPhotos.length >= 12}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    <ImagePlus className="w-4 h-4" />
                    {uploadingPhoto ? 'Uploading...' : 'Add Photo'}
                  </button>
                  <input ref={photoFileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </div>

                {hospitalPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hospitalPhotos.map((photo) => (
                      <div key={photo} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-slate-200 group">
                        <img src={photo} alt="Hospital facility" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          aria-label="Remove hospital photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => photoFileRef.current?.click()}
                    className="w-full min-h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400 flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  >
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-xs font-bold">Upload hospital profile photos</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Hospital Name</label>
                  <input type="text" value={hospitalData.name} onChange={e => setHospitalData({...hospitalData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Contact</label>
                  <input type="text" value={hospitalData.contact || ''} onChange={e => setHospitalData({...hospitalData, contact: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Country</label>
                  <input list="country-options" type="text" value={hospitalData.country || ''} onChange={e => setHospitalData({...hospitalData, country: e.target.value, state: '', city: ''})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  <datalist id="country-options">
                    {COUNTRIES.map(country => <option key={country} value={country} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">State</label>
                  <input list="state-options" type="text" value={hospitalData.state || ''} onChange={e => setHospitalData({...hospitalData, state: e.target.value, city: ''})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  <datalist id="state-options">
                    {statesForCountry(hospitalData.country).map(state => <option key={state} value={state} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">City</label>
                  <input list="city-options" type="text" value={hospitalData.city || ''} onChange={e => setHospitalData({...hospitalData, city: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  <datalist id="city-options">
                    {citiesForRegion(hospitalData.country, hospitalData.state).map(city => <option key={city} value={city} />)}
                  </datalist>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Address</label>
                  <textarea rows={2} value={hospitalData.address || ''} onChange={e => setHospitalData({...hospitalData, address: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Description</label>
                  <textarea rows={3} value={hospitalData.description || ''} onChange={e => setHospitalData({...hospitalData, description: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'HOURS' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" /> Default Operating Hours
              </h3>
              <div className="space-y-4">
                {DAYS.map((day, i) => {
                  const hour = hours.find(h => h.dayOfWeek === i) || { isOpen: i !== 0, openTime: '08:00', closeTime: '20:00' };
                  return (
                    <div key={day} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${hour.isOpen ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-sm font-bold text-slate-700 w-24">{day}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {hour.isOpen && (
                          <div className="flex items-center gap-2">
                            <input type="time" defaultValue={hour.openTime} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium" />
                            <span className="text-slate-400">-</span>
                            <input type="time" defaultValue={hour.closeTime} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium" />
                          </div>
                        )}
                        <button className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${hour.isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                          {hour.isOpen ? 'Open' : 'Closed'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'SECURITY' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" /> Access & Security
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Multi-Factor Authentication', desc: 'Enforce MFA for all staff logins', enabled: true },
                  { label: 'Auto-Audit Logging', desc: 'Automatically log all clinical records changes', enabled: true, locked: true },
                  { label: 'Session Timeout', desc: 'Auto logout after 30 minutes of inactivity', enabled: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-all ${item.enabled ? 'bg-blue-600' : 'bg-slate-300'} ${item.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.enabled ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'NOTIFICATIONS' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" /> Notification Preferences
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'New Appointment Alerts', desc: 'Get notified when a patient books an appointment', enabled: true },
                  { label: 'Critical Lab Results', desc: 'Instant alerts for abnormal lab values', enabled: true },
                  { label: 'Low Inventory Warnings', desc: 'Notify when stock drops below reorder level', enabled: true },
                  { label: 'Leave Request Alerts', desc: 'Notify admin when staff requests leave', enabled: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${item.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.enabled ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between gap-4">
            {status.success && <p className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved successfully!</p>}
            {status.error && <p className="text-sm font-bold text-rose-600">{status.error}</p>}
            <div className="flex-1" />
            <button onClick={handleSaveGeneral} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/10">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
