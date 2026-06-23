import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: localStorage.getItem('theme') || 'dark',
  sidebarCollapsed: false,
  activeTab: 'dashboard',
  searchQuery: '',
  showNotifications: false,
  showAIChat: false,
  chatHistory: [
    { sender: 'ai', text: "Welcome to ERP AI! How can I help you manage your enterprise today? Try asking: \"Show me last month's revenue\" or \"What is our current Business Health Score?\"" }
  ]
};

export const erpSlice = createSlice({
  name: 'erp',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      document.documentElement.setAttribute('data-theme', action.payload);
    },
    toggleTheme: (state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = nextTheme;
      localStorage.setItem('theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setShowNotifications: (state, action) => {
      state.showNotifications = action.payload;
    },
    toggleNotifications: (state) => {
      state.showNotifications = !state.showNotifications;
    },
    setShowAIChat: (state, action) => {
      state.showAIChat = action.payload;
    },
    toggleAIChat: (state) => {
      state.showAIChat = !state.showAIChat;
    },
    addChatMessage: (state, action) => {
      state.chatHistory.push(action.payload);
    },
    clearChatHistory: (state) => {
      state.chatHistory = [];
    }
  }
});

export const {
  setTheme,
  toggleTheme,
  setSidebarCollapsed,
  toggleSidebar,
  setActiveTab,
  setSearchQuery,
  setShowNotifications,
  toggleNotifications,
  setShowAIChat,
  toggleAIChat,
  addChatMessage,
  clearChatHistory
} = erpSlice.actions;

export default erpSlice.reducer;
