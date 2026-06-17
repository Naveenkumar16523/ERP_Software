import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      // Theme State
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),

      // Sidebar State
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Mobile Sidebar State
      mobileSidebarOpen: false,
      setMobileSidebar: (isOpen) => set({ mobileSidebarOpen: isOpen }),
      
      // Active Module State
      activeModule: 'dashboard',
      setActiveModule: (moduleId) => set({ activeModule: moduleId }),
      
      // Demo Mode State
      demoMode: false,
      setDemoMode: (isDemo) => set({ demoMode: isDemo }),
    }),
    {
      name: 'clarix-app-storage',
    }
  )
);
