import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createUISlice } from './slices/createUISlice.js';
import { createDataSlice } from './slices/createDataSlice.js';

export const useERPStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...createUISlice(set, get),
        ...createDataSlice(set, get),
      }),
      {
        name: 'erp-ui-store',
        // Only persist auth + UI preferences. Never persist server data arrays.
        partialize: (state) => ({
          token: state.token,
          currentUser: state.currentUser,
          userPermissions: state.userPermissions,
          demoMode: state.demoMode,
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    { name: 'ERPStore' }
  )
);
