import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

describe('Auth Flow', () => {
  it('renders login page by default for unauthenticated users', async () => {
    // Basic test to ensure the App renders the login form when no token is present
    render(<App />, { wrapper });
    
    // Check if the login form elements are present
    expect(await screen.findByPlaceholderText(/Email or Username/i)).toBeInTheDocument();
    expect(await screen.findByPlaceholderText(/Password/i)).toBeInTheDocument();
  });
});
