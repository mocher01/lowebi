import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RegisterForm from '../components/auth/register-form';
import { authService } from '../services/auth-service';
import { setAuthTokens } from '../lib/api-client';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('../services/auth-service');
jest.mock('../lib/api-client');
jest.mock('../components/ui/toast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));
const mockSetError = jest.fn();
jest.mock('../store/auth-store', () => ({
  useAuthStore: jest.fn(() => ({
    isLoading: false,
    error: null,
    setError: mockSetError,
  })),
}));

const mockRouter = {
  push: jest.fn(),
};

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockSetAuthTokens = setAuthTokens as jest.MockedFunction<typeof setAuthTokens>;

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should render all form fields', () => {
    render(<RegisterForm />);
    
    expect(screen.getByPlaceholderText(/Enter your first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your last name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Create a strong password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });

  it('should validate password requirements', async () => {
    render(<RegisterForm />);
    
    const passwordInput = screen.getByPlaceholderText(/Create a strong password/i);
    
    // Test weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.blur(passwordInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    });
    
    // Test strong password
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Strong/i)).toBeInTheDocument();
    });
  });

  it('should handle successful registration - AC1', async () => {
    const mockResponse = {
      success: true,
      user: { id: '1', email: 'test@example.com', createdAt: '2023-01-01' },
      tokens: { accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' },
    };
    
    mockAuthService.register.mockResolvedValueOnce(mockResponse);
    
    render(<RegisterForm />);
    
    // Fill form with valid data
    fireEvent.change(screen.getByPlaceholderText(/Enter your email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Create a strong password/i), {
      target: { value: 'StrongPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Confirm your password/i), {
      target: { value: 'StrongPass123!' },
    });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));
    
    await waitFor(() => {
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: '',
        lastName: '',
      });
      expect(mockSetAuthTokens).toHaveBeenCalledWith(
        'mock-access-token',
        'mock-refresh-token'
      );
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle registration errors - AC2', async () => {
    const mockError = new Error('Email already exists');
    mockAuthService.register.mockRejectedValueOnce(mockError);
    
    render(<RegisterForm />);
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Enter your email address/i), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Create a strong password/i), {
      target: { value: 'StrongPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Confirm your password/i), {
      target: { value: 'StrongPass123!' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));
    
    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Email already exists');
    });
  });

  it('should validate password confirmation match - AC3', async () => {
    render(<RegisterForm />);
    
    fireEvent.change(screen.getByPlaceholderText(/Create a strong password/i), {
      target: { value: 'StrongPass123!' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Confirm your password/i), {
      target: { value: 'Different123!' },
    });
    fireEvent.blur(screen.getByPlaceholderText(/Confirm your password/i));
    
    await waitFor(() => {
      expect(screen.getByText(/Passwords don't match/i)).toBeInTheDocument();
    });
  });
});