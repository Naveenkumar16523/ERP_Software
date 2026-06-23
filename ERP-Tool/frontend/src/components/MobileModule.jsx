import React, { useState } from 'react';
import { Smartphone, Monitor, Tablet, Eye, Download, Zap } from 'lucide-react';

export default function MobileModule() {
  const [device, setDevice] = useState('phone');

  const DEVICES = [
    { id: 'phone', label: 'Phone', icon: Smartphone, w: 375, h: 812 },
    { id: 'tablet', label: 'Tablet', icon: Tablet, w: 768, h: 1024 },
    { id: 'desktop', label: 'Desktop', icon: Monitor, w: 1280, h: 800 }
  ];
  const selected = DEVICES.find(d => d.id === device);

  const previewUrl = window.location.href;

  const features = [
    { title: 'Responsive Layout', desc: 'Adapts to any screen size automatically', status: 'Active' },
    { title: 'Touch Gestures', desc: 'Swipe navigation and pull-to-refresh', status: 'Active' },
    { title: 'Offline Mode', desc: 'Zustand-persisted state works offline', status: 'Active' },
    { title: 'PWA Support', desc: 'Installable as a Progressive Web App', status: 'Planned' },
    { title: 'Push Notifications', desc: 'Web push notification integration', status: 'Planned' }
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-main">Mobile Preview</h1>
        <p className="text-sm text-muted mt-1">Preview the application across different device form factors</p>
      </div>

      <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit border border-main">
        {DEVICES.map(d => {
          const Icon = d.icon;
          return (
            <button key={d.id} onClick={() => setDevice(d.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${device === d.id ? 'bg-indigo-600 text-white' : 'text-muted hover:text-main'}`}>
              <Icon className="w-3.5 h-3.5" />{d.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-6">
        {/* Device Frame */}
        <div className="flex-shrink-0">
          <div className={`border-2 border-main rounded-2xl overflow-hidden relative bg-card shadow-2xl ${device === 'phone' ? 'w-[280px] h-[580px]' : device === 'tablet' ? 'w-[400px] h-[560px]' : 'w-[640px] h-[400px]'}`}>
            <div className="absolute top-0 left-0 right-0 h-8 bg-surface border-b border-main flex items-center justify-center z-10">
              {device === 'phone' && <div className="w-20 h-3 bg-surface-elevated rounded-full border border-main" />}
            </div>
            <iframe
              src={previewUrl}
              title="Mobile Preview"
              className="w-full h-full border-0 pt-8"
              style={{ transform: `scale(${device === 'phone' ? 0.75 : device === 'tablet' ? 0.85 : 1})`, transformOrigin: 'top left', width: `${selected.w}px`, height: `${selected.h}px` }}
            />
          </div>
          <p className="text-xs text-center text-dimmed mt-2">{selected.w}×{selected.h} viewport</p>
        </div>

        {/* Features */}
        <div className="flex-1 space-y-3">
          <h3 className="text-sm font-semibold text-main">Mobile-First Features</h3>
          {features.map(f => (
            <div key={f.title} className="theme-card p-3 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-main">{f.title}</p>
                <p className="text-xs text-muted">{f.desc}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${f.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{f.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}