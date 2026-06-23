let toastIdCounter = 1;
let notifIdCounter = 100;

export const createUISlice = (set, get) => ({
  // ── Navigation & UI ──────────────────────────────────────────────
  activeModule: 'dashboard',
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  theme: localStorage.getItem('erp-theme') || 'dark',
  searchQuery: '',
  searchResults: [],
  dbLive: true,
  token: localStorage.getItem('erp_token') || null,
  demoMode: localStorage.getItem('erp_demo') === 'true',
  currentUser: (() => {
    try {
      const stored = localStorage.getItem('erp_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  userPermissions: (() => {
    try {
      const stored = localStorage.getItem('erp_permissions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),
  allowedModules: (() => {
    try {
      const stored = localStorage.getItem('erp_allowed_modules');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),

  // ── Notifications & Toasts ────────────────────────────────────────
  notifications: [],
  toasts: [],

  // ── Navigation ────────────────────────────────────────────────────
  setActiveModule: (m) => set({ activeModule: m }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebar: (o) => set({ mobileSidebarOpen: o }),
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('erp-theme', next);
    return { theme: next };
  }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchResults: (r) => set({ searchResults: r }),
  setDbLive: (v) => set({ dbLive: v }),
  setToken: (t) => {
    if (t) {
      localStorage.setItem('erp_token', t);
    } else {
      localStorage.removeItem('erp_token');
    }
    set({ token: t });
  },
  setCurrentUser: (u, permissions = [], allowedModules = []) => {
    if (u) {
      localStorage.setItem('erp_user', JSON.stringify(u));
    } else {
      localStorage.removeItem('erp_user');
    }
    set({ currentUser: u, userPermissions: permissions, allowedModules });
  },
  setUserPermissions: (permissions) => {
    localStorage.setItem('erp_permissions', JSON.stringify(permissions));
    set({ userPermissions: permissions });
  },
  setAllowedModules: (allowedModules) => {
    localStorage.setItem('erp_allowed_modules', JSON.stringify(allowedModules));
    set({ allowedModules });
  },
  setDemoMode: (d) => {
    localStorage.setItem('erp_demo', d ? 'true' : 'false');
    set({ demoMode: d });
  },
  logout: () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_refresh_token');
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_permissions');
    localStorage.removeItem('erp_allowed_modules');
    localStorage.setItem('erp_demo', 'false');
    set({ token: null, currentUser: null, userPermissions: [], allowedModules: [], demoMode: false, activeModule: 'dashboard' });
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
