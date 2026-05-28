import { Users, Bed, DollarSign, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const Analytics = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/analytics')
       .then(res => setData(res))
       .catch(err => console.error(err));
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Loading aggregated analytics...</div>;

  const { admissionsMonthly, revenueData, occupancyData, stayDurationData, kpis, departmentRevenue } = data;
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Analytics & Reports</h2>
        <p className="text-slate-500">Hospital performance metrics at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi: any, i: number) => (
          <div key={kpi.label} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${i===0?'bg-blue-100':i===1?'bg-emerald-100':i===2?'bg-purple-100':'bg-amber-100'}`}>
                {i===0 && <DollarSign className={`w-6 h-6 text-blue-600`} />}
                {i===1 && <Users className={`w-6 h-6 text-emerald-600`} />}
                {i===2 && <Bed className={`w-6 h-6 text-purple-600`} />}
                {i===3 && <Activity className={`w-6 h-6 text-amber-600`} />}
              </div>
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${kpi.up ? 'text-emerald-700' : 'text-red-600'}`}>
                {kpi.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Admissions vs Discharges</h3>
            <span className="text-xs text-slate-400 font-medium">Last 6 Months</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={admissionsMonthly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar dataKey="admissions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} name="Admissions" />
                <Bar dataKey="discharges" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} name="Discharges" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Monthly Revenue</h3>
            <span className="text-xs text-slate-400 font-medium">Last 6 Months</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Bed Occupancy Breakdown</h3>
            <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-md">Live</span>
          </div>
          <div className="flex items-center">
            <div className="h-60 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {occupancyData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {occupancyData.map((entry: any, i: number) => (
                <div key={entry.name} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{entry.name}</p>
                    <p className="text-xs text-slate-400">{entry.value}% of beds</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Patient Stay Duration</h3>
            <span className="text-xs text-slate-400 font-medium">All Time</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stayDurationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis dataKey="range" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={70} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-bold text-slate-900 mb-6">Revenue by Department</h3>
        <div className="grid grid-cols-3 gap-4">
          {departmentRevenue.map((d: any) => (
            <div key={d.dept} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{d.dept}</span>
                <span className="text-slate-500">${(d.revenue / 1000).toFixed(0)}k</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${d.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
