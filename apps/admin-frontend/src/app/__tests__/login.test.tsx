/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AdminLogin from '../page';
import { apiClient } from '../../services/api-client';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API client
jest.mock('../../services/api-client', () => ({
  apiClient: {
    login: jest.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AdminLogin', () => {
  const mockPush = jest.fn();
  const mockApiLogin = apiClient.login as jest.MockedFunction<typeof apiClient.login>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should render login form', () => {
    render(<AdminLogin />);

    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your administrative account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should redirect to dashboard if already logged in', () => {
    mockLocalStorage.getItem.mockReturnValue('existing-token');
    
    render(<AdminLogin />);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('should pre-fill email field', () => {
    render(<AdminLogin />);

    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
    expect(emailInput.value).toBe('admin@locod.ai');
  });

  it('should handle successful login', async () => {
    const mockLoginResponse = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '123',
        email: 'admin@locod.ai',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
      },
    };

    mockApiLogin.mockResolvedValueOnce(mockLoginResponse);

    render(<AdminLogin />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApiLogin).toHaveBeenCalledWith('admin@locod.ai', 'admin123');
    });

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('adminToken', 'mock-access-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('adminUser', JSON.stringify(mockLoginResponse.user));
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle login failure', async () => {
    mockApiLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<AdminLogin />);

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it('should handle non-admin user', async () => {
    const mockLoginResponse = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '123',
        email: 'user@locod.ai',
        role: 'user',
        firstName: 'Regular',
        lastName: 'User',
      },
    };

    mockApiLogin.mockResolvedValueOnce(mockLoginResponse);

    render(<AdminLogin />);

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(passwordInput, { target: { value: 'user123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Access denied. Admin privileges required.')).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it('should show loading state during login', async () => {
    mockApiLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<AdminLogin />);

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should prevent form submission with empty fields', () => {
    render(<AdminLogin />);

    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    
    // Clear the pre-filled email
    const emailInput = screen.getByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: '' } });
    
    fireEvent.click(submitButton);

    expect(mockApiLogin).not.toHaveBeenCalled();
  });

  it('should clear error message on new input', async () => {
    mockApiLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<AdminLogin />);

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    // First, trigger an error
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Then, try again with different input
    mockApiLogin.mockClear();
    fireEvent.change(passwordInput, { target: { value: 'new-password' } });
    fireEvent.click(submitButton);

    // Error should be cleared when new attempt is made
    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
  });

  it('should handle generic error fallback', async () => {
    mockApiLogin.mockRejectedValueOnce(new Error());

    render(<AdminLogin />);

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Authentication failed. Please check your credentials.')).toBeInTheDocument();
    });
  });
});