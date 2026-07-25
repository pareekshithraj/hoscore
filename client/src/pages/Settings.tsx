import { useState, useEffect, useRef } from 'react';
import { Clock, Bell, Save, Globe, Hospital, Upload, Camera, CheckCircle, ImagePlus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { COUNTRIES, citiesForRegion, statesForCountry } from '../utils/locations';
import { BASE_URL } from '../utils/apiConfig';

type HospitalPhoto = {
  id: string;
  url: string;
  caption: string;
  isCover: boolean;
  key?: string;
  size?: number;
};

const photoId = () => `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizePhotos = (photos: unknown): HospitalPhoto[] => {
  if (!Array.isArray(photos)) return [];
  const normalized = photos
    .map((photo: any, index) => {
      if (typeof photo === 'string') {
        return { id: photoId(), url: photo, caption: '', isCover: index === 0 };
      }
      if (photo && typeof photo.url === 'string') {
        return {
          id: photo.id || photoId(),
          url: photo.url,
          caption: typeof photo.caption === 'string' ? photo.caption : '',
          isCover: Boolean(photo.isCover),
          key: typeof photo.key === 'string' ? photo.key : undefined,
          size: typeof photo.size === 'number' ? photo.size : undefined,
        };
      }
      return null;
    })
    .filter(Boolean) as HospitalPhoto[];
  if (normalized.length > 0 && !normalized.some(photo => photo.isCover)) normalized[0].isCover = true;
  return normalized;
};

const compressImage = (file: File, maxWidth = 1600, quality = 0.82): Promise<File> => {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return Promise.resolve(file);
  return new Promise((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
      }, 'image/webp', quality);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    image.src = objectUrl;
  });
};

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'HOURS' | 'NOTIFICATIONS'>('GENERAL');
  const [hours, setHours] = useState<any[]>([]);
  const [status, setStatus] = useState({ success: false, error: '' });
  const [draggingPhotoId, setDraggingPhotoId] = useState('');
  const [hospitalData, setHospitalData] = useState({
    name: '',
    address: '',
    country: '',
    city: '',
    state: '',
    contact: '',
    description: '',
    logo: '',
    photos: [] as HospitalPhoto[],
  });
  const [notificationSettings, setNotificationSettings] = useState({
    appointmentAlerts: true,
    criticalLabResults: true,
    lowInventoryWarnings: true,
    leaveRequestAlerts: false,
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
        photos: normalizePhotos(data?.photos),
      }));
      if (data?.settings) {
        const parsed = typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings;
        if (parsed.notifications) setNotificationSettings(prev => ({ ...prev, ...parsed.notifications }));
      }
    }).catch(() => {});
  }, []);

  const hospitalPhotos = normalizePhotos(hospitalData.photos);

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
    const sourceFile = e.target.files?.[0];
    if (!sourceFile) return;
    setUploadingPhoto(true);
    try {
      const file = await compressImage(sourceFile);
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
        const nextPhotos = [
          ...hospitalPhotos,
          {
            id: photoId(),
            url: data.url,
            key: data.key,
            size: data.size,
            caption: '',
            isCover: hospitalPhotos.length === 0,
          },
        ].slice(0, 12);
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
    let nextPhotos = hospitalPhotos.filter(photo => photo.url !== url);
    if (nextPhotos.length > 0 && !nextPhotos.some(photo => photo.isCover)) {
      nextPhotos = nextPhotos.map((photo, index) => ({ ...photo, isCover: index === 0 }));
    }
    setHospitalData(prev => ({ ...prev, photos: nextPhotos }));
    try {
      await api.patch('/hospital/update', { photos: nextPhotos });
      setStatus({ success: true, error: '' });
      setTimeout(() => setStatus({ success: false, error: '' }), 3000);
    } catch (err) {
      setStatus({ success: false, error: 'Failed to remove hospital photo' });
    }
  };

  const updatePhotos = async (photos: HospitalPhoto[]) => {
    const nextPhotos = normalizePhotos(photos);
    setHospitalData(prev => ({ ...prev, photos: nextPhotos }));
    await api.patch('/hospital/update', { photos: nextPhotos });
  };

  const movePhoto = (fromIndex: number, direction: -1 | 1) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= hospitalPhotos.length) return;
    const nextPhotos = [...hospitalPhotos];
    const [photo] = nextPhotos.splice(fromIndex, 1);
    nextPhotos.splice(toIndex, 0, photo);
    updatePhotos(nextPhotos).catch(() => setStatus({ success: false, error: 'Failed to reorder photos' }));
  };

  const reorderPhoto = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const fromIndex = hospitalPhotos.findIndex(photo => photo.id === fromId);
    const toIndex = hospitalPhotos.findIndex(photo => photo.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const nextPhotos = [...hospitalPhotos];
    const [photo] = nextPhotos.splice(fromIndex, 1);
    nextPhotos.splice(toIndex, 0, photo);
    updatePhotos(nextPhotos).catch(() => setStatus({ success: false, error: 'Failed to reorder photos' }));
  };

  const setCoverPhoto = (url: string) => {
    updatePhotos(hospitalPhotos.map(photo => ({ ...photo, isCover: photo.url === url })))
      .catch(() => setStatus({ success: false, error: 'Failed to set cover photo' }));
  };

  const setPhotoCaption = (url: string, caption: string) => {
    setHospitalData(prev => ({
      ...prev,
      photos: normalizePhotos(prev.photos).map(photo => photo.url === url ? { ...photo, caption } : photo),
    }));
  };

  const savePhotoCaption = (url: string, caption: string) => {
    updatePhotos(hospitalPhotos.map(photo => photo.url === url ? { ...photo, caption } : photo))
      .catch(() => setStatus({ success: false, error: 'Failed to save caption' }));
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
        settings: {
          notifications: notificationSettings,
        }
      });
      setStatus({ success: true, error: '' });
      setTimeout(() => setStatus({ success: false, error: '' }), 3000);
    } catch (e) {
      setStatus({ success: false, error: 'Failed to save settings' });
    }
  };

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fieldClass = 'w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-sm font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all';
  const panelClass = 'bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-sm p-6';
  const labelClass = 'text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-fade-in-up">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border border-[var(--card-border)] bg-[var(--card-bg)] rounded-2xl relative overflow-hidden shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-sm">
            <Hospital className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Hospital Settings</h2>
            <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">Manage operational profile, working hours, and notifications</p>
          </div>
        </div>

        <button
          onClick={handleSaveGeneral}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" /> Save All Changes
        </button>
      </div>

      {/* Main Container */}
      <div className="flex flex-col md:flex-row bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-sm">
        {/* Navigation Sidebar */}
        <div className="md:w-64 border-b md:border-b-0 md:border-r border-[var(--card-border)] bg-[var(--inner-bg)] p-3">
          <div className="flex md:block gap-2 overflow-x-auto md:overflow-visible md:space-y-1.5 pb-1 md:pb-0">
            {[
              { id: 'GENERAL', label: 'General Profile', icon: Globe },
              { id: 'HOURS', label: 'Operating Hours', icon: Clock },
              { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--card-bg)] hover:text-[var(--text-primary)]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 p-6 lg:p-8 min-w-0">
          {activeTab === 'GENERAL' && (
            <div className="space-y-6">
              <h3 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <Hospital className="w-5 h-5 text-blue-500" /> Institution Profile
              </h3>

              {/* Logo Upload Section */}
              <div className={panelClass}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div
                    onClick={() => logoFileRef.current?.click()}
                    className="relative w-24 h-24 rounded-2xl bg-[var(--inner-bg)] border-2 border-dashed border-[var(--card-border)] flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all group overflow-hidden shadow-inner flex-shrink-0"
                  >
                    {hospitalData.logo ? (
                      <>
                        <img src={hospitalData.logo} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-blue-500 transition-colors">
                        {uploading ? (
                          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <div>
                    <p className="text-sm font-extrabold text-[var(--text-primary)]">Hospital Logo</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Upload your official institution branding logo. Recommended: Square 512x512px WebP/PNG.</p>
                    {uploading && <p className="text-xs text-blue-600 font-bold mt-2">Uploading logo to cloud...</p>}
                  </div>
                </div>
              </div>

              {/* Photos Section */}
              <div className={`${panelClass} space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold text-[var(--text-primary)]">Facility & Campus Photos</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Upload up to 12 showcase photos. Drag to reorder, choose cover image, and add captions.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => photoFileRef.current?.click()}
                    disabled={uploadingPhoto || hospitalPhotos.length >= 12}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    <ImagePlus className="w-4 h-4" />
                    {uploadingPhoto ? 'Uploading...' : 'Add Photo'}
                  </button>
                  <input ref={photoFileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </div>

                {hospitalPhotos.length > 0 ? (
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-3">
                    {hospitalPhotos.map((photo, index) => (
                      <div
                        key={photo.id}
                        draggable
                        onDragStart={() => setDraggingPhotoId(photo.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          reorderPhoto(draggingPhotoId, photo.id);
                          setDraggingPhotoId('');
                        }}
                        onDragEnd={() => setDraggingPhotoId('')}
                        className={`relative rounded-2xl overflow-hidden bg-[var(--inner-bg)] border group cursor-grab active:cursor-grabbing transition-all ${
                          draggingPhotoId === photo.id ? 'border-blue-500 opacity-60 ring-2 ring-blue-500/30' : 'border-[var(--card-border)]'
                        }`}
                      >
                        <div className="relative aspect-[4/3]">
                          <img src={photo.url} alt={photo.caption || 'Hospital facility'} className="w-full h-full object-cover" />
                          {photo.isCover && (
                            <span className="absolute left-2 top-2 rounded-full bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 shadow-sm">Cover</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.url)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                          aria-label="Remove hospital photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="p-3 space-y-2">
                          <input
                            value={photo.caption}
                            onChange={(event) => setPhotoCaption(photo.url, event.target.value)}
                            onBlur={(event) => savePhotoCaption(photo.url, event.target.value)}
                            placeholder="Caption"
                            className="w-full rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 font-semibold"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <button type="button" disabled={index === 0} onClick={() => movePhoto(index, -1)} className="rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] disabled:opacity-40 py-1 text-[10px] font-bold text-[var(--text-secondary)] cursor-pointer">Left</button>
                            <button type="button" onClick={() => setCoverPhoto(photo.url)} className="rounded-lg bg-blue-600/15 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20 cursor-pointer">Cover</button>
                            <button type="button" disabled={index === hospitalPhotos.length - 1} onClick={() => movePhoto(index, 1)} className="rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] disabled:opacity-40 py-1 text-[10px] font-bold text-[var(--text-secondary)] cursor-pointer">Right</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => photoFileRef.current?.click()}
                    className="w-full min-h-32 rounded-2xl border-2 border-dashed border-[var(--card-border)] bg-[var(--inner-bg)] text-[var(--text-secondary)] flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-6 h-6 text-blue-500" />
                    <span className="text-xs font-extrabold">Upload hospital profile photos</span>
                  </button>
                )}
              </div>

              {/* General Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className={labelClass}>Hospital Name</label>
                  <input type="text" value={hospitalData.name} onChange={e => setHospitalData({...hospitalData, name: e.target.value})}
                    className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Contact Phone</label>
                  <input type="text" value={hospitalData.contact || ''} onChange={e => setHospitalData({...hospitalData, contact: e.target.value})}
                    className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input list="country-options" type="text" value={hospitalData.country || ''} onChange={e => setHospitalData({...hospitalData, country: e.target.value, state: '', city: ''})}
                    className={fieldClass} />
                  <datalist id="country-options">
                    {COUNTRIES.map(country => <option key={country} value={country} />)}
                  </datalist>
                </div>
                <div>
                  <label className={labelClass}>State / Region</label>
                  <input list="state-options" type="text" value={hospitalData.state || ''} onChange={e => setHospitalData({...hospitalData, state: e.target.value, city: ''})}
                    className={fieldClass} />
                  <datalist id="state-options">
                    {statesForCountry(hospitalData.country).map(state => <option key={state} value={state} />)}
                  </datalist>
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input list="city-options" type="text" value={hospitalData.city || ''} onChange={e => setHospitalData({...hospitalData, city: e.target.value})}
                    className={fieldClass} />
                  <datalist id="city-options">
                    {citiesForRegion(hospitalData.country, hospitalData.state).map(city => <option key={city} value={city} />)}
                  </datalist>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Full Street Address</label>
                  <textarea rows={2} value={hospitalData.address || ''} onChange={e => setHospitalData({...hospitalData, address: e.target.value})}
                    className={`${fieldClass} resize-none`} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Public Description</label>
                  <textarea rows={3} value={hospitalData.description || ''} onChange={e => setHospitalData({...hospitalData, description: e.target.value})}
                    className={`${fieldClass} resize-none`} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'HOURS' && (
            <div className="space-y-6">
              <h3 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" /> Default Operating Hours
              </h3>
              <div className="space-y-3">
                {DAYS.map((day, i) => {
                  const hour = hours.find(h => h.dayOfWeek === i) || { isOpen: i !== 0, openTime: '08:00', closeTime: '20:00' };
                  return (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${hour.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-zinc-700'}`} />
                        <span className="text-sm font-extrabold text-[var(--text-primary)] w-28">{day}</span>
                      </div>
                      <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center gap-3 sm:gap-4">
                        {hour.isOpen && (
                          <div className="flex items-center gap-2">
                            <input type="time" defaultValue={hour.openTime} className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                            <span className="text-[var(--text-muted)] font-bold">-</span>
                            <input type="time" defaultValue={hour.closeTime} className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                          </div>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold text-center uppercase tracking-wider ${hour.isOpen ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 border border-slate-200 dark:border-zinc-700'}`}>
                          {hour.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'NOTIFICATIONS' && (
            <div className="space-y-6">
              <h3 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" /> Notification Preferences
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'appointmentAlerts', label: 'New Appointment Alerts', desc: 'Get notified when a patient books an appointment', enabled: notificationSettings.appointmentAlerts },
                  { key: 'criticalLabResults', label: 'Critical Lab Results', desc: 'Instant alerts for abnormal lab values', enabled: notificationSettings.criticalLabResults },
                  { key: 'lowInventoryWarnings', label: 'Low Inventory Warnings', desc: 'Notify when stock drops below reorder level', enabled: notificationSettings.lowInventoryWarnings },
                  { key: 'leaveRequestAlerts', label: 'Leave Request Alerts', desc: 'Notify admin when staff requests leave', enabled: notificationSettings.leaveRequestAlerts },
                ].map((item: any) => (
                  <div key={item.label} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm">
                    <div>
                      <p className="text-sm font-extrabold text-[var(--text-primary)]">{item.label}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">{item.desc}</p>
                    </div>
                    <div 
                      onClick={() => {
                        setNotificationSettings(prev => ({ ...prev, [item.key]: !item.enabled }));
                      }}
                      className={`w-11 h-6 rounded-full relative transition-all cursor-pointer flex-shrink-0 ${item.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${item.enabled ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-[var(--card-border)] flex items-center justify-between gap-4">
            {status.success && <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Settings updated successfully!</p>}
            {status.error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{status.error}</p>}
            <div className="flex-1" />
            <button
              onClick={handleSaveGeneral}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
