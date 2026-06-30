import React from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import ToastContainer from '../ui/Toast';
import { useERPStore } from '../../store/useERPStore';
import { useRealtimeEvents } from '../../hooks/useRealtimeEvents';

export default function AppShell({ children }) {
  const { sidebarCollapsed } = useERPStore();
  
  useRealtimeEvents();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <TopHeader />
        <main className="main-scroll custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
