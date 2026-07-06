let toastIdCounter = 1;
let notifIdCounter = 100;

export const createUISlice = (set, get) => ({
  // ── Navigation & UI ──────────────────────────────────────────────
  activeModule: 'dashboard',
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  theme: 'dark',
  searchQuery: '',
  searchResults: [],
  dbLive: true,
  isRealtimeConnected: false,
  token: null,
  refreshToken: null,
  demoMode: false,
  currentUser: null,
  userPermissions: [],

  // ── Notifications & Toasts ────────────────────────────────────────
  notifications: [],
  toasts: [],

  // ── Navigation ────────────────────────────────────────────────────
  setActiveModule: (m) => set({ activeModule: m }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebar: (o) => set({ mobileSidebarOpen: o }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchResults: (r) => set({ searchResults: r }),
  setDbLive: (v) => set({ dbLive: v }),
  setRealtimeConnected: (v) => set({ isRealtimeConnected: v }),
  setToken: (t) => set({ token: t }),
  setRefreshToken: (t) => set({ refreshToken: t }),
  setCurrentUser: (u, permissions = []) => set({ currentUser: u, userPermissions: permissions }),
  setUserPermissions: (permissions) => set({ userPermissions: permissions }),
  setDemoMode: (d) => set({ demoMode: d }),
  logout: () => {
    // Clear legacy tokens if they exist, to ensure clean slate during migration
    localStorage.removeItem('erp_refresh_token');
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_permissions');
    localStorage.removeItem('erp_demo');
    set({ token: null, refreshToken: null, currentUser: null, userPermissions: [], demoMode: false, activeModule: 'dashboard' });
  },

  // ── Toasts ────────────────────────────────────────────────────────
  addToast: (message, type = 'info') => set((s) => ({
    toasts: [...s.toasts, { id: toastIdCounter++, message, type }]
  })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ── Notifications ────────────────────────────────────────────────
  addNotification: (message, type = 'info') => set((s) => ({
    notifications: [
      { id: `notif-${notifIdCounter++}`, message, type, createdAt: new Date().toISOString(), read: false },
      ...s.notifications
    ]
  })),
  clearNotifications: () => set({ notifications: [] }),
  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
  })),

});
