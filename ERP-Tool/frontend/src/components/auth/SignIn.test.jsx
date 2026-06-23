import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SignIn from './SignIn';
import { AuthProvider } from '../../context/AuthContext';

// Mock the AuthContext so we don't actually hit the API during UI tests
vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      login: vi.fn().mockResolvedValue(true),
      loading: false
    })
  };
});

describe('SignIn Component', () => {
  it('renders login form correctly', () => {
    render(
      <AuthProvider>
        <SignIn />
      </AuthProvider>
    );
    
    // Check if the logo/title is rendered
    expect(screen.getByText(/Clarix/i)).toBeInTheDocument();
    
    // Check if email and password fields exist
    expect(screen.getByPlaceholderText(/john@company.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    
    // Check for login button
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('allows user to type in email and password', () => {
    render(
      <AuthProvider>
        <SignIn />
      </AuthProvider>
    );
    
    const emailInput = screen.getByPlaceholderText(/john@company.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});
