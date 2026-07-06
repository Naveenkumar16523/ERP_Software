export const createDataSlice = (set, get) => ({
    // ── Preview Mode Data (Client-only mocks) ───────────────────────
  jobPostings: [],
  applicants: [],
  performanceReviews: [],
  onboardingChecklists: [],
  attendanceLogs: [],
  marketingCampaigns: [],
  marketingLeads: [],
  marketingAnalytics: [],
  addMarketingLead: (lead) => set((s) => ({ marketingLeads: [...s.marketingLeads, lead] })),
  
  updateOnboardingTask: (checklistId, taskId) => set((s) => ({
    onboardingChecklists: s.onboardingChecklists.map((c) =>
      c.id === checklistId
        ? { ...c, tasks: c.tasks.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t) }
        : c
    )
  })),

  // ── AI Chat (Client-only) ───────────────────────────────────────────────
  chatMessages: [],
  aiMessages: [],
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  clearChatMessages: () => set({ chatMessages: [] }),
  addAIMessage: (msg) => set((s) => ({ aiMessages: [...s.aiMessages, msg] })),
  clearAIMessages: () => set({ aiMessages: [] }),

  // ── Migration Jobs (Client-only) ────────────────────────────────────────
  migrationJobs: [],
  migrationValidationReport: null,
  
  // Note: Migration logic should be completely decoupled from global store and live in MigrationHub.jsx

  // ── Ecommerce Cart (Client-only) ────────────────────────────────────────
  cart: [],
  addToCart: (item) => set((s) => {
    const existing = s.cart.find((c) => c.id === item.id);
    if (existing) {
      return { cart: s.cart.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c) };
    }
    return { cart: [...s.cart, { ...item, qty: 1 }] };
  }),
  updateCartQty: (id, qty) => set((s) => ({
    cart: s.cart.map((c) => c.id === id ? { ...c, qty: Math.max(1, qty) } : c)
  })),
  removeFromCart: (id) => set((s) => ({
    cart: s.cart.filter((c) => c.id !== id)
  })),
});
