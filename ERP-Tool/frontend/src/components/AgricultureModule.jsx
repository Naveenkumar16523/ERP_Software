import React, { useState } from 'react';
import { Sprout, Droplets, Beef, Plus, Zap } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

export default function AgricultureModule() {
  const { agricultureFields, agricultureLivestock, toggleIrrigationZone, registerCropCycle, addToast } = useERPStore();
  const [activeTab, setActiveTab] = useState('fields');

  const irrigatedFields = agricultureFields.filter(f => f.irrigationOn).length;
  const totalArea = agricultureFields.reduce((s, f) => s + (f.area || 0), 0);

  const STATUS_COLORS = { GROWING: 'text-emerald-400 bg-emerald-500/10', HARVESTED: 'text-amber-400 bg-amber-500/10', PLANTED: 'text-sky-400 bg-sky-500/10', FALLOW: 'text-slate-400 bg-slate-500/10' };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-main">Agriculture Management</h1>
        <p className="text-sm text-muted mt-1">Field monitoring, crop cycles, irrigation, and livestock</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Fields', value: agricultureFields.length, color: 'text-emerald-400' },
          { label: 'Total Area', value: `${totalArea} ha`, color: 'text-sky-400' },
          { label: 'Irrigating Now', value: irrigatedFields, color: 'text-blue-400' },
          { label: 'Livestock Types', value: agricultureLivestock.length, color: 'text-amber-400' }
        ].map(s => (
          <div key={s.label} className="theme-card p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className={`text-xl font-bold mt-1 font-data ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit">
        {['fields', 'livestock'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted hover:text-main'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'fields' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agricultureFields.map(f => (
            <div key={f.id} className="theme-card p-4 hover:border-emerald-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-main">{f.name}</h4>
                  <p className="text-xs text-muted">{f.area} ha · {f.crop}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[f.status] || 'text-muted bg-surface'}`}>{f.status}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-muted mb-1"><span>Soil Moisture</span><span>{f.soilMoisture}%</span></div>
                  <div className="h-1.5 bg-surface rounded-full">
                    <div className={`h-full rounded-full ${f.soilMoisture > 70 ? 'bg-blue-500' : f.soilMoisture > 40 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${f.soilMoisture}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-muted mb-1"><span>NDVI (Vegetation)</span><span>{f.ndvi}</span></div>
                  <div className="h-1.5 bg-surface rounded-full">
                    <div className="h-full bg-lime-500 rounded-full" style={{ width: `${f.ndvi * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-main/50">
                <span className={`text-xs flex items-center gap-1 ${f.irrigationOn ? 'text-blue-400' : 'text-dimmed'}`}>
                  <Droplets className="w-3 h-3" />
                  {f.irrigationOn ? 'Irrigating' : 'Irrigation Off'}
                </span>
                <button onClick={() => { toggleIrrigationZone(f.id); addToast(`Irrigation ${f.irrigationOn ? 'stopped' : 'started'} for ${f.name}`, 'info'); }}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${f.irrigationOn ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10' : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'}`}>
                  {f.irrigationOn ? 'Stop' : 'Start'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'livestock' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agricultureLivestock.map(ls => (
            <div key={ls.id} className="theme-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Beef className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-semibold text-main">{ls.type}</h4>
                    <p className="text-xs text-muted">{ls.count} animals</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${ls.health === 'GOOD' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{ls.health}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface rounded-lg p-2">
                  <p className="text-muted mb-0.5">Last Vet Check</p>
                  <p className="text-main">{ls.lastVetCheck}</p>
                </div>
                <div className="bg-surface rounded-lg p-2">
                  <p className="text-muted mb-0.5">{ls.avgMilkYield ? 'Avg Milk Yield' : 'Avg Egg Yield'}</p>
                  <p className="text-main font-data">{ls.avgMilkYield ? `${ls.avgMilkYield}L/day` : `${ls.avgEggYield}/day`}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}