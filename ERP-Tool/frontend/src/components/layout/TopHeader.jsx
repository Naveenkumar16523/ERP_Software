import React, { useState, useEffect } from 'react';
import { Menu, Bell, Database, Calendar, Clock, Check, Trash2 } from 'lucide-react';
import { useERPStore } from '../../store/useERPStore';
import AnimatedThemeToggler from '../ui/AnimatedThemeToggler';
import GlobalSearch from '../ui/GlobalSearch';

export default function TopHeader() {
  const {
    dbLive,
    setDbLive,
    notifications,
    clearNotifications,
    markNotificationRead,
    activeModule,
    setMobileSidebar,
    currentUser
  } = useERPStore();

  const [time, setTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll database health status with exponential backoff
  useEffect(() => {
    let timeoutId;
    let failCount = 0;
    let isMounted = true;

    const checkHealth = async () => {
      if (!isMounted) return;
      if (failCount >= 5) {
        setDbLive(false);
        return; // Stop polling after 5 consecutive failures
      }

      try {
        const API_URL = '';
        const res = await fetch(`${API_URL}/api/v1/health`, { signal: AbortSignal.timeout(5000) });
        if (isMounted) {
          setDbLive(res.ok);
          if (res.ok) {
            failCount = 0; // Reset counter on success
          } else {
            failCount++;
          }
        }
      } catch (error) {
        if (isMounted) {
          setDbLive(false);
          failCount++;
        }
      }

      if (isMounted && failCount < 5) {
        // Exponential backoff: 20s, 30s, 45s, 60s, max 60s
        const nextInterval = Math.min(20000 * Math.pow(1.5, failCount), 60000);
        timeoutId = setTimeout(checkHealth, nextInterval);
      }
    };

    checkHealth();
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [setDbLive]);

  // Open search on Ctrl+K / Cmd+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (d) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d) =>
    d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className="bg-card border-b border-main px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileSidebar(true)}
            className="md:hidden p-2 rounded-lg hover:bg-surface text-muted hover:text-main transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Page Title & Subtitle */}
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-main capitalize">
              {activeModule === 'dashboard' ? 'Overview' : activeModule}
            </h1>
            <p className="text-[12px] text-muted mt-0.5">Track your key insights, performance, and growth in one place.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* DB Status */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              dbLive
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <Database className="w-3 h-3" />
            <span>{dbLive ? 'DB Live' : 'DB Offline'}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${dbLive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          </div>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg bg-surface border border-main text-muted hover:text-main transition-colors"
            title="Search (Ctrl+K)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-lg bg-surface border border-main flex items-center justify-center text-muted hover:text-main transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 theme-card shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-main bg-surface/30">
                  <h3 className="text-sm font-semibold text-main">Notifications</h3>
                  <button
                    onClick={() => { clearNotifications(); setShowNotifications(false); }}
                    className="text-xs text-muted hover:text-main flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear all
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto custom-scrollbar bg-card">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-dimmed">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`px-4 py-3 border-b border-main hover:bg-surface/50 cursor-pointer transition-colors ${notif.read ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />}
                          <p className="text-xs text-muted leading-relaxed">{notif.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="w-9 h-9 flex items-center justify-center bg-surface border border-main rounded-lg">
            <AnimatedThemeToggler />
          </div>

          {/* User Avatar */}
          {currentUser && (
            <div className="w-9 h-9 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-400 text-sm font-bold border border-indigo-500/30 ml-1">
              {currentUser.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
