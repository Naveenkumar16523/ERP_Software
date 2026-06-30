import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, User, Key, Shield, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';

import { useERPStore } from '../../store/useERPStore';
import { api } from '../../utils/api';

export default function SignIn() {
  const { setToken, setCurrentUser, setDemoMode, addToast, theme, setUserPermissions, setActiveModule } = useERPStore();

  const [authView, setAuthView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const isSubmittingRef = useRef(false); // prevents double-submit on fast clicks / Enter key

  useEffect(() => {
    // Check if self-registration is enabled on backend
    const checkRegStatus = async () => {
      try {
        const data = await api.auth.getRegistrationStatus();
        setRegistrationEnabled(data.registrationEnabled);
      } catch (err) {
        setRegistrationEnabled(false);
      }
    };
    checkRegStatus();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Hard guard against double-submit (covers both rapid clicks and Enter key)
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      const data = await api.auth.login({ email: email.trim(), password });

      setToken(data.accessToken || data.access_token || data.token);
      if (data.refreshToken) {
        localStorage.setItem('erp_refresh_token', data.refreshToken);
      }

      const userObj = {
        ...data.user,
        name: data.user.fullName || `${data.user.firstName || 'User'} ${data.user.lastName || ''}`.trim()
      };

      setCurrentUser(userObj);

      const permissions = data.permissions || data.user?.permissions || [];
      setUserPermissions(permissions);

      setDemoMode(false);
      addToast(`Welcome back, ${userObj.fullName || userObj.name || 'User'}!`, 'success');

      if (data.user?.isCEO) {
        setActiveModule('admin');
      } else {
        setActiveModule('dashboard');
      }
    } catch (err) {
      console.warn('Backend login failed:', err.message);
      setAuthError(
        err.message === 'Invalid credentials'
          ? 'Invalid username or password. Try: username · ceo · password · admin123'
          : (err.message || 'Login failed. Please check your credentials.')
      );
    } finally {
      setAuthLoading(false);
      // Release the guard after a short delay to prevent instant re-trigger
      setTimeout(() => { isSubmittingRef.current = false; }, 800);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setAuthSuccess('Registration successful! Please sign in.');
      setAuthView('login');
      addToast("Account created successfully!", "success");
      
      // Clear fields
      setFirstName('');
      setLastName('');
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Self-registration may be disabled.');
      addToast(err.message || "Registration failed", "danger");
    } finally {
      setAuthLoading(false);
    }
  };



  return (
    <div className="min-h-screen w-full flex items-center justify-center text-slate-100 bg-[#020617] overflow-hidden relative font-sans">
      <div className="gradient-bg"></div>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-20 -right-20 w-[400px] h-[400px] blur-[120px] bg-primary/10 rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] blur-[120px] bg-violet-600/10 rounded-full mix-blend-screen pointer-events-none"></div>

      <main className="w-full max-w-[440px] px-6 z-10 flex flex-col gap-6 animate-fade-up">
        
        {/* Brand Header */}
        <header className="flex flex-col items-center text-center">
          <div className="w-16 h-16 flex items-center justify-center mb-3">
            <img src="/favicon.svg" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-heading">
            CLARIX
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1.5 font-semibold">
            Enterprise Resource Planning
          </p>
        </header>

        {/* Auth Panel Card */}
        <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-slate-950/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Subtle top accent */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

          {/* Title Header */}
          <div className="flex flex-col gap-1 mb-6">
            <h2 className="text-lg font-bold text-white">
              {authView === 'login' ? 'Secure Access' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {authView === 'login'
                ? 'Sign in to access your administrative workspace.'
                : 'Setup your operator account in the core ERP.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={authView === 'login' ? handleLogin : handleRegister} className="flex flex-col gap-4">
            
            {authView === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">First Name</label>
                  <div className="relative border border-white/10 focus-within:border-primary rounded-lg bg-black/20 overflow-hidden transition-all duration-200">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required 
                      value={firstName} 
                      onChange={e => setFirstName(e.target.value)} 
                      className="w-full bg-transparent border-0 px-9 py-2.5 text-white placeholder:text-slate-600 text-sm outline-none" 
                      placeholder="First name"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Name</label>
                  <div className="relative border border-white/10 focus-within:border-primary rounded-lg bg-black/20 overflow-hidden transition-all duration-200">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required 
                      value={lastName} 
                      onChange={e => setLastName(e.target.value)} 
                      className="w-full bg-transparent border-0 px-9 py-2.5 text-white placeholder:text-slate-600 text-sm outline-none" 
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="email">
                {authView === 'login' ? 'Username / Email' : 'Email Address'}
              </label>
              <div className="relative border border-white/10 focus-within:border-primary rounded-lg bg-black/20 overflow-hidden transition-all duration-200">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-transparent border-0 px-9 py-2.5 text-white placeholder:text-slate-600 text-sm outline-none"
                  placeholder={authView === 'login' ? "ceo or admin@example.com" : "Your email address"}
                  id="email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="password">
                {authView === 'login' ? 'Access Key' : 'Choose Password'}
              </label>
              <div className="relative border border-white/10 focus-within:border-primary rounded-lg bg-black/20 overflow-hidden transition-all duration-200">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full bg-transparent border-0 px-9 py-2.5 pr-10 text-white placeholder:text-slate-600 text-sm outline-none" 
                  placeholder="••••••••••••"
                  id="password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center p-0"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message Display */}
            {authError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{authError}</p>
              </div>
            )}

            {/* Success Message Display */}
            {authSuccess && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{authSuccess}</p>
              </div>
            )}

            <div className="flex items-center justify-between py-1 text-xs text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input className="w-3.5 h-3.5 rounded border-white/10 bg-black/30 text-primary focus:ring-0" type="checkbox"/>
                <span>Remember console</span>
              </label>

              {(registrationEnabled || authView === 'register') && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthView(authView === 'login' ? 'register' : 'login');
                    setAuthError('');
                    setAuthSuccess('');
                  }}
                  className="text-primary hover:text-primary-hover transition-colors bg-transparent border-0 cursor-pointer p-0 font-medium"
                >
                  {authView === 'login' ? 'Create Account' : 'Back to Login'}
                </button>
              )}
            </div>

            <button 
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-2.5 rounded-lg shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 border border-white/10 cursor-pointer text-sm" 
              type="submit"
              disabled={authLoading}
            >
              <span>{authLoading ? 'Verifying Session...' : (authView === 'login' ? 'Initialize Session' : 'Register Operator')}</span>
              {!authLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>


        </div>

        {/* Footer Info */}
        <footer className="text-center">
          <p className="text-[10px] text-slate-500 leading-normal">
            Authorized admin access only. All sessions audited under security standard <span className="text-primary/80 font-mono">AETHER-SEC-09</span>.
          </p>
        </footer>
      </main>
    </div>
  );
}
