import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, AlertTriangle, Plus, Bell, Clock, CheckCircle,
  Save, Trash2, Wifi, TrendingUp, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, AreaChart, Area, CartesianGrid
} from 'recharts';
import { api } from '../services/api';

type AreaType = 'empty' | 'lobby' | 'ward-a' | 'ward-b' | 'icu' | 'emergency' | 'pharmacy' | 'lab' | 'radiology' | 'ot' | 'reception' | 'cafeteria' | 'admin' | 'corridor';

const AREA_CONFIG: Record<AreaType, { label: string; color: string; shortLabel: string }> = {
  empty:      { label: 'Empty',       color: 'transparent', shortLabel: '' },
  lobby:      { label: 'Lobby',       color: '#64748b', shortLabel: 'LBY' },
  'ward-a':   { label: 'Ward A',      color: '#10b981', shortLabel: 'WA' },
  'ward-b':   { label: 'Ward B',      color: '#22c55e', shortLabel: 'WB' },
  icu:        { label: 'ICU',         color: '#a855f7', shortLabel: 'ICU' },
  emergency:  { label: 'Emergency',   color: '#ef4444', shortLabel: 'ER' },
  pharmacy:   { label: 'Pharmacy',    color: '#06b6d4', shortLabel: 'PHR' },
  lab:        { label: 'Laboratory',  color: '#f59e0b', shortLabel: 'LAB' },
  radiology:  { label: 'Radiology',   color: '#ec4899', shortLabel: 'RAD' },
  ot:         { label: 'OT / Surgery',color: '#f43f5e', shortLabel: 'OT' },
  reception:  { label: 'Reception',   color: '#3b82f6', shortLabel: 'REC' },
  cafeteria:  { label: 'Cafeteria',   color: '#84cc16', shortLabel: 'CAF' },
  admin:      { label: 'Admin Office',color: '#8b5cf6', shortLabel: 'ADM' },
  corridor:   { label: 'Corridor',    color: '#475569', shortLabel: '' },
};

// Pre-built hospital floor plan
const DEFAULT_MAP: AreaType[][] = [
  ['reception','reception','lobby','lobby','lobby','lobby','lobby','corridor','admin','admin'],
  ['reception','reception','lobby','lobby','lobby','lobby','lobby','corridor','admin','admin'],
  ['corridor','corridor','corridor','corridor','corridor','corridor','corridor','corridor','corridor','corridor'],
  ['ward-a','ward-a','ward-a','corridor','icu','icu','icu','corridor','pharmacy','pharmacy'],
  ['ward-a','ward-a','ward-a','corridor','icu','icu','icu','corridor','pharmacy','pharmacy'],
  ['ward-a','ward-a','ward-a','corridor','corridor','corridor','corridor','corridor','lab','lab'],
  ['corridor','corridor','corridor','corridor','emergency','emergency','emergency','corridor','lab','lab'],
  ['ward-b','ward-b','ward-b','corridor','emergency','emergency','emergency','corridor','radiology','radiology'],
  ['ward-b','ward-b','ward-b','corridor','ot','ot','corridor','corridor','radiology','radiology'],
  ['ward-b','ward-b','cafeteria','cafeteria','ot','ot','corridor','corridor','corridor','corridor'],
];

// Pre-computed static data — no random generation in render
const admissionsData = [
  { time: '06:00', value: 12 }, { time: '08:00', value: 28 }, { time: '10:00', value: 45 },
  { time: '12:00', value: 38 }, { time: '14:00', value: 52 }, { time: '16:00', value: 41 },
  { time: '18:00', value: 35 }, { time: '20:00', value: 22 }
];
const flowData = [
  { time: '06:00', inflow: 8, outflow: 5 }, { time: '08:00', inflow: 18, outflow: 12 },
  { time: '10:00', inflow: 32, outflow: 20 }, { time: '12:00', inflow: 25, outflow: 28 },
  { time: '14:00', inflow: 40, outflow: 30 }, { time: '16:00', inflow: 30, outflow: 35 },
  { time: '18:00', inflow: 22, outflow: 25 }, { time: '20:00', inflow: 15, outflow: 18 }
];

export const Simulator = () => {
  const [activeFloor, setActiveFloor] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedBrush, setSelectedBrush] = useState<AreaType>('ward-a');
  const [mapGrid, setMapGrid] = useState<AreaType[][]>(DEFAULT_MAP.map(r => [...r]));
  const [census, setCensus] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);

  const loadData = useCallback(() => {
    api.get('/stats/simulator').then(res => {
      setCensus(res.census || {});
      setLogs(res.monitoringLogs || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (!isEditing) return;
    setMapGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = selectedBrush;
      return newGrid;
    });
  }, [isEditing, selectedBrush]);

  const SimTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur-xl text-white px-3 py-2 rounded-lg shadow-2xl border border-white/10 text-[11px]">
          <p className="font-bold text-slate-400 mb-1">{label}</p>
          {payload.map((e: any, i: number) => (
            <p key={i} className="font-semibold" style={{ color: e.color }}>{e.name}: {e.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const brushOptions: AreaType[] = ['reception', 'lobby', 'ward-a', 'ward-b', 'icu', 'emergency', 'pharmacy', 'lab', 'radiology', 'ot', 'cafeteria', 'admin', 'corridor'];

  return (
    <div className="h-screen w-screen bg-[#0a0e1a] text-slate-100 overflow-hidden flex flex-col">
      {/* Ambient BG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-white/[0.06] rounded-lg transition-all"><ArrowLeft className="w-4 h-4 text-slate-400" /></Link>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                  HOSCORE <span className="text-[9px] font-medium text-cyan-400/80 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">SIMULATOR</span>
                </h1>
                <p className="text-[10px] text-slate-500">Hospital Site Map & Real-time Monitoring</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick stats */}
            {[
              { label: 'Occupancy', value: '78%', color: 'text-cyan-400' },
              { label: 'Wait', value: '18m', color: 'text-amber-400' },
              { label: 'Staff', value: '191', color: 'text-blue-400' },
              { label: 'Score', value: '91%', color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="hidden lg:block text-center px-3">
                <p className="text-[9px] text-slate-600 font-bold uppercase">{s.label}</p>
                <p className={`text-sm font-extrabold ${s.color} tabular-nums`}>{s.value}</p>
              </div>
            ))}
            <div className="w-px h-8 bg-white/10 hidden lg:block" />
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="font-mono font-bold tabular-nums text-slate-300">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            <button className="relative p-2 hover:bg-white/[0.06] rounded-lg transition-all">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* Main Content — fills remaining space */}
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 p-4">
          {/* Left - Departments & Performance */}
          <div className="col-span-2 flex flex-col gap-3 overflow-y-auto pr-1">
            <div className="bg-white/[0.04] backdrop-blur-sm p-4 rounded-xl border border-white/[0.06]">
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">Departments</h3>
              <div className="space-y-2.5">
                {[
                  { name: 'Emergency', load: 92, status: 'critical' },
                  { name: 'ICU', load: 95, status: 'critical' },
                  { name: 'Ward A', load: 68, status: 'normal' },
                  { name: 'Ward B', load: 52, status: 'normal' },
                  { name: 'Pediatrics', load: 45, status: 'normal' },
                ].map(d => (
                  <div key={d.name}>
                    <div className="flex justify-between text-[10px] mb-1"><span className="text-slate-300 font-semibold">{d.name}</span><span className={`font-bold ${d.status === 'critical' ? 'text-rose-400' : 'text-slate-500'}`}>{d.load}%</span></div>
                    <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${d.status === 'critical' ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`} style={{ width: `${d.load}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-sm p-4 rounded-xl border border-white/[0.06]">
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">Performance</h3>
              <div className="space-y-3">
                {[
                  { label: 'Wait Time', value: '18 min', icon: Clock, trend: '↓12%' },
                  { label: 'Stay', value: '3.2 days', icon: Activity, trend: '↓5%' },
                  { label: 'Satisfaction', value: '91%', icon: CheckCircle, trend: '↑3%' },
                  { label: 'Readmit', value: '4.2%', icon: TrendingUp, trend: '↓1.1%' },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5"><m.icon className="w-3 h-3 text-cyan-500/50" /><span className="text-[10px] text-slate-500">{m.label}</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-[11px] font-bold text-white">{m.value}</span><span className="text-[8px] font-bold text-emerald-400">{m.trend}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-sm p-4 rounded-xl border border-white/[0.06]">
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">Staff</h3>
              {[
                { role: 'Physicians', count: 34, max: 50, color: 'from-cyan-400 to-cyan-500' },
                { role: 'Nurses', count: 112, max: 150, color: 'from-blue-400 to-blue-500' },
                { role: 'Techs', count: 45, max: 60, color: 'from-emerald-400 to-emerald-500' },
              ].map(s => (
                <div key={s.role} className="mb-2.5">
                  <div className="flex justify-between text-[10px] mb-1"><span className="text-slate-400 font-medium">{s.role}</span><span className="font-bold text-white">{s.count}<span className="text-slate-600">/{s.max}</span></span></div>
                  <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${s.color} rounded-full`} style={{ width: `${(s.count/s.max)*100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Center — Site Map */}
          <div className="col-span-7 flex flex-col gap-3 min-h-0">
            {/* Map */}
            <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-cyan-500/10 flex-1 flex flex-col p-4 min-h-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-600/[0.04] rounded-full blur-[60px] pointer-events-none" />
              <div className="flex items-center justify-between mb-3 relative z-10 flex-shrink-0">
                <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.15em]">Hospital Site Map</h3>
                <div className="flex gap-1 bg-black/30 rounded-lg p-0.5 border border-white/[0.06]">
                  {['GF', '1F', '2F', '3F'].map((l, i) => (
                    <button key={l} onClick={() => setActiveFloor(i+1)} className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${activeFloor===i+1?'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30':'text-slate-600 hover:text-slate-400 border border-transparent'}`}>{l}</button>
                  ))}
                  <div className="w-px bg-white/10 mx-0.5" />
                  <button onClick={() => setIsEditing(!isEditing)} className={`px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 transition-all ${isEditing?'bg-amber-500/15 text-amber-300 border border-amber-500/30':'bg-white/[0.04] text-slate-500 hover:text-slate-300 border border-white/[0.06]'}`}>
                    {isEditing ? <><Save className="w-2.5 h-2.5" />Save</> : <><Plus className="w-2.5 h-2.5" />Edit</>}
                  </button>
                </div>
              </div>
              {/* Brush Palette */}
              {isEditing && (
                <div className="flex flex-wrap gap-1.5 mb-2 flex-shrink-0">
                  {brushOptions.map(type => (
                    <button key={type} onClick={() => setSelectedBrush(type)} className={`flex items-center gap-1 text-[8px] font-bold uppercase px-1.5 py-1 rounded transition-all ${selectedBrush===type?'bg-white/10 ring-1 ring-white/30 text-white':'text-slate-500 hover:text-slate-400'}`}>
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: AREA_CONFIG[type].color+'60', border: `1px solid ${AREA_CONFIG[type].color}` }} />
                      {AREA_CONFIG[type].label}
                    </button>
                  ))}
                  <button onClick={() => setSelectedBrush('empty')} className="flex items-center gap-1 text-[8px] font-bold uppercase px-1.5 py-1 rounded text-rose-400/60 hover:text-rose-400"><Trash2 className="w-2.5 h-2.5" />Erase</button>
                </div>
              )}
              {/* Grid */}
               <div className="flex-1 flex items-center justify-center min-h-0 py-4">
                 <div className="grid grid-cols-10 grid-rows-10 gap-0 w-full max-w-[650px] aspect-square relative border-[0.5px] border-white/5 shadow-2xl shadow-cyan-500/5">
                   {/* Background Blueprint Grid */}
                   <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                   
                   {mapGrid.map((row, r) => row.map((cell, c) => {
                     const cfg = AREA_CONFIG[cell];
                     const isEmpty = cell === 'empty';
                     const count = census[cell] || 0;
                     
                     // Only show count on central cells of a block for cleaner look
                     // We'll just show it on all for now but smaller
                     
                     return (
                       <div
                         key={`${r}-${c}`}
                         onClick={() => handleCellClick(r, c)}
                         className={`relative flex items-center justify-center transition-all duration-300 border-[0.5px] overflow-hidden ${isEditing?'cursor-pointer hover:bg-white/10 z-20':''} ${isEmpty?'bg-black/20 border-white/[0.02]':'border-white/[0.08]'}`}
                         style={!isEmpty ? { backgroundColor: cfg.color+'15' } : undefined}
                       >
                         {!isEmpty && cfg.shortLabel && (
                           <div className="flex flex-col items-center gap-0.5">
                             <span className="text-[6px] font-black text-white/20 select-none uppercase tracking-tighter">{cfg.shortLabel}</span>
                             {count > 0 && (
                               <span className="text-[10px] font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">{count}</span>
                             )}
                           </div>
                         )}
                         
                         {/* Room accent glow if active */}
                         {!isEmpty && count > 0 && (
                           <div className="absolute inset-0 bg-cyan-400/[0.03] animate-pulse pointer-events-none" />
                         )}
                       </div>
                     );
                   }))}
                 </div>
               </div>
              {/* Alert Banner */}
              {!isEditing && (
                <div className="mt-2 flex items-center justify-between text-[10px] bg-rose-500/[0.08] p-2.5 rounded-lg border border-rose-500/15 flex-shrink-0">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" />2 Critical Zones</span>
                  <span className="text-rose-300/60 font-medium">ER at capacity · ICU 95%</span>
                </div>
              )}
            </div>
            {/* Bottom Charts */}
            <div className="grid grid-cols-2 gap-3 h-[160px] flex-shrink-0">
              <div className="bg-white/[0.04] backdrop-blur-sm p-3 rounded-xl border border-white/[0.06] flex flex-col">
                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 flex-shrink-0">Admissions Today</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={admissionsData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs><linearGradient id="sAdm" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/><stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8 }} />
                      <Tooltip content={<SimTooltip />} />
                      <Area isAnimationActive={false} type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill="url(#sAdm)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-sm p-3 rounded-xl border border-white/[0.06] flex flex-col">
                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 flex-shrink-0">Patient Flow</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={flowData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs><linearGradient id="sIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient><linearGradient id="sOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8 }} />
                      <Tooltip content={<SimTooltip />} />
                      <Area isAnimationActive={false} type="monotone" dataKey="inflow" stroke="#8b5cf6" strokeWidth={1.5} fillOpacity={1} fill="url(#sIn)" dot={false} />
                      <Area isAnimationActive={false} type="monotone" dataKey="outflow" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#sOut)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Alerts & Resources */}
          <div className="col-span-3 flex flex-col gap-3 overflow-y-auto pl-1">
            <div className="bg-white/[0.04] backdrop-blur-sm p-4 rounded-xl border border-blue-500/10 min-h-0 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">Live Monitoring</h3>
                <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /><span className="text-[8px] font-bold text-blue-400 uppercase">Streaming</span></div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-10 opacity-30">
                    <p className="text-[9px] font-bold uppercase tracking-widest italic">Waiting for events...</p>
                  </div>
                ) : logs.map((log, i) => (
                  <div key={i} className="p-2.5 bg-white/[0.02] border border-white/[0.03] rounded-lg animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-bold text-blue-400 uppercase">{log.action}</span>
                      <span className="text-[7px] text-slate-600 font-mono">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
                    </div>
                    <p className="text-[10px] text-slate-300 font-medium leading-normal">
                      <span className="text-slate-500 font-bold">{log.entity}</span> {log.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-sm p-4 rounded-xl border border-white/[0.06]">
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">Resources</h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: 'Vent', used: 28, total: 40 },{ name: 'Mon', used: 65, total: 80 },{ name: 'Pump', used: 42, total: 60 },{ name: 'Defib', used: 8, total: 15 }]} layout="vertical" margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8 }} domain={[0, 'dataMax']} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 600 }} width={40} />
                    <Tooltip content={<SimTooltip />} />
                    <Bar isAnimationActive={false} dataKey="total" fill="rgba(255,255,255,0.04)" radius={[0, 3, 3, 0]} barSize={10} />
                    <Bar isAnimationActive={false} dataKey="used" fill="#06b6d4" radius={[0, 3, 3, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Map Legend */}
            <div className="bg-white/[0.04] backdrop-blur-sm p-4 rounded-xl border border-white/[0.06]">
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">Map Legend</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(AREA_CONFIG).filter(([k]) => k !== 'empty').map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5 text-[9px]">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: cfg.color+'40', border: `1px solid ${cfg.color}` }} />
                    <span className="text-slate-400 truncate">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-sm p-4 rounded-xl border border-white/[0.06]">
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Code Blue', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' },
                  { label: 'Lockdown', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' },
                  { label: 'Divert ED', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' },
                  { label: 'All Clear', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' },
                ].map(a => (
                  <button key={a.label} className={`px-2 py-2 rounded-lg text-[9px] font-bold border transition-all ${a.color}`}>{a.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
