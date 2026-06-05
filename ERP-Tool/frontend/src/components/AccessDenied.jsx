import React from 'react';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { useERPStore } from '../store/useERPStore';

export default function AccessDenied() {
  const { setActiveModule, currentUser } = useERPStore();

  const handleGoHome = () => {
    setActiveModule('dashboard');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] text-slate-100">
      <div className="max-w-md w-full mx-4">
        <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl shadow-2xl text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Shield className="w-8 h-8 text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            You don't have permission to access this module. Please contact your administrator if you believe this is an error.
          </p>

          {/* User Info */}
          {currentUser && (
            <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Logged in as</p>
              <p className="text-sm font-semibold text-white">{currentUser.fullName || currentUser.name || 'User'}</p>
              <p className="text-xs text-slate-400">{currentUser.email}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors border border-indigo-500/30"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>

          {/* Help Text */}
          <p className="text-[10px] text-slate-500 mt-6">
            If you need access to this module, please submit an access request through your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
