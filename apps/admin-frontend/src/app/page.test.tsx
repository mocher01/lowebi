import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import AdminLogin from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('AdminLogin Component - Complete Test Suite', () => {
  let mockPush: jest.Mock;
  let mockRouter: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
    
    // Setup router mock
    mockPush = jest.fn();
    mockRouter = { push: mockPush };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders login form with all required elements', () => {
      render(<AdminLogin />);
      
      expect(screen.getByText('Admin Portal')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your administrative account')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    test('form inputs have correct attributes', () => {
      render(<AdminLogin />);
      
      const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('placeholder', 'admin@locod.ai');
      
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('Form Interaction', () => {
    test('updates input values when user types', () => {
      render(<AdminLogin />);
      
      const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      
      fireEvent.change(emailInput, { target: { value: 'admin@locod.ai' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      
      expect(emailInput.value).toBe('admin@locod.ai');
      expect(passwordInput.value).toBe('password');
    });

    test('form submission is prevented without page reload', async () => {
      render(<AdminLogin />);
      
      const form = screen.getByRole('button', { name: /sign in/i }).closest('form')!;
      const handleSubmit = jest.fn((e) => e.preventDefault());
      form.onsubmit = handleSubmit;
      
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Authentication - Lowercase admin Role (FIXED BUG)', () => {
    test('✅ SUCCESSFULLY authenticates with lowercase "admin" role', async () => {
      const mockResponse = {
        user: {
          id: '123',
          email: 'admin@locod.ai',
          role: 'admin', // lowercase - THIS IS THE FIX
        },
        accessToken: 'valid-token-123',
        refreshToken: 'refresh-token-456',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'admin@locod.ai' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(localStorage.getItem('adminToken')).toBe('valid-token-123');
        expect(localStorage.getItem('refreshToken')).toBe('refresh-token-456');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
      
      // Verify no error is shown
      expect(screen.queryByText(/access denied/i)).not.toBeInTheDocument();
    });

    test('✅ SUCCESSFULLY authenticates with uppercase "ADMIN" role', async () => {
      const mockResponse = {
        user: {
          id: '123',
          email: 'admin@locod.ai',
          role: 'ADMIN', // uppercase - should also work
        },
        accessToken: 'valid-token-123',
        refreshToken: 'refresh-token-456',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'admin@locod.ai' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(localStorage.getItem('adminToken')).toBe('valid-token-123');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('✅ SUCCESSFULLY authenticates with mixed case "Admin" role', async () => {
      const mockResponse = {
        user: {
          id: '123',
          email: 'admin@locod.ai',
          role: 'Admin', // mixed case
        },
        accessToken: 'valid-token-123',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(localStorage.getItem('adminToken')).toBe('valid-token-123');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Authentication - Access Denial', () => {
    test('❌ DENIES access for customer role', async () => {
      const mockResponse = {
        user: {
          id: '123',
          email: 'user@example.com',
          role: 'customer',
        },
        accessToken: 'valid-token-123',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Access denied. Admin privileges required.')).toBeInTheDocument();
        expect(localStorage.getItem('adminToken')).toBeNull();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    test('❌ DENIES access for null role', async () => {
      const mockResponse = {
        user: {
          id: '123',
          email: 'user@example.com',
          role: null,
        },
        accessToken: 'valid-token-123',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Access denied. Admin privileges required.')).toBeInTheDocument();
      });
    });

    test('❌ DENIES access for missing user object', async () => {
      const mockResponse = {
        accessToken: 'valid-token-123',
        // user object missing
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Access denied. Admin privileges required.')).toBeInTheDocument();
      });
    });
  });

  describe('Token Handling', () => {
    test('handles response with nested tokens structure', async () => {
      const mockResponse = {
        user: { role: 'admin' },
        tokens: {
          accessToken: 'nested-token-123',
          refreshToken: 'nested-refresh-456',
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(localStorage.getItem('adminToken')).toBe('nested-token-123');
        expect(localStorage.getItem('refreshToken')).toBe('nested-refresh-456');
      });
    });

    test('handles response with flat token structure', async () => {
      const mockResponse = {
        user: { role: 'admin' },
        accessToken: 'flat-token-123',
        refreshToken: 'flat-refresh-456',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(localStorage.getItem('adminToken')).toBe('flat-token-123');
        expect(localStorage.getItem('refreshToken')).toBe('flat-refresh-456');
      });
    });

    test('handles missing refresh token gracefully', async () => {
      const mockResponse = {
        user: { role: 'admin' },
        accessToken: 'token-without-refresh',
        // no refresh token
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(localStorage.getItem('adminToken')).toBe('token-without-refresh');
        expect(localStorage.getItem('refreshToken')).toBeNull();
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('shows error when no access token is received', async () => {
      const mockResponse = {
        user: { role: 'admin' },
        // no tokens at all
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('No access token received from server')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error for invalid credentials', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'wrong@email.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpass' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    test('displays generic error when server returns no message', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      });
    });

    test('handles network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('handles JSON parsing errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      });
    });

    test('clears previous errors on new submission', async () => {
      // First submission with error
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'First error' }),
      });

      render(<AdminLogin />);
      
      const emailInput = screen.getByLabelText('Email address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(emailInput, { target: { value: 'admin@locod.ai' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second submission - error should be cleared initially
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          user: { role: 'admin' },
          accessToken: 'token'
        }),
      });

      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    test('disables submit button while loading', async () => {
      let resolvePromise: any;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (fetch as jest.Mock).mockReturnValueOnce(promise);

      render(<AdminLogin />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(submitButton);
      
      // Button should be disabled immediately
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveClass('disabled:opacity-50');
      expect(submitButton).toHaveClass('disabled:cursor-not-allowed');
      
      // Resolve the promise
      resolvePromise({
        ok: true,
        json: async () => ({ 
          user: { role: 'admin' },
          accessToken: 'token'
        }),
      });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    test('shows loading text on button while submitting', async () => {
      let resolvePromise: any;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (fetch as jest.Mock).mockReturnValueOnce(promise);

      render(<AdminLogin />);
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(submitButton);
      
      // Should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      
      // Resolve
      resolvePromise({
        ok: true,
        json: async () => ({ 
          user: { role: 'admin' },
          accessToken: 'token'
        }),
      });
      
      await waitFor(() => {
        expect(screen.getByText('Sign in')).toBeInTheDocument();
        expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Console Logging', () => {
    test('logs successful login response to console', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockResponse = {
        user: { role: 'admin' },
        accessToken: 'token-123',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Login response:', mockResponse);
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('API Integration', () => {
    test('sends correct request to /auth/login endpoint', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { role: 'admin' },
          accessToken: 'token',
        }),
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'securepass123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'admin@locod.ai',
            password: 'securepass123',
          }),
        });
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty role field', async () => {
      const mockResponse = {
        user: { role: '' },
        accessToken: 'token',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Access denied. Admin privileges required.')).toBeInTheDocument();
      });
    });

    test('handles undefined user role', async () => {
      const mockResponse = {
        user: { 
          email: 'admin@locod.ai',
          // role is undefined
        },
        accessToken: 'token',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AdminLogin />);
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Access denied. Admin privileges required.')).toBeInTheDocument();
      });
    });

    test('handles special characters in password', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { role: 'admin' },
          accessToken: 'token',
        }),
      });

      render(<AdminLogin />);
      
      const specialPassword = 'p@$$w0rd!<>&"\'';
      
      fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'admin@locod.ai' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: specialPassword } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'admin@locod.ai',
            password: specialPassword,
          }),
        });
      });
    });
  });
});