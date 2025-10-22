/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '../page';
import { apiClient } from '../../../services/api-client';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API client
jest.mock('../../../services/api-client', () => ({
  apiClient: {
    getDashboardStats: jest.fn(),
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

describe('AdminDashboard', () => {
  const mockPush = jest.fn();
  const mockGetDashboardStats = apiClient.getDashboardStats as jest.MockedFunction<typeof apiClient.getDashboardStats>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should redirect to login if no token', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    render(<AdminDashboard />);

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should show loading state initially', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'adminToken') return 'mock-token';
      if (key === 'adminUser') return null; // No user data
      return null;
    });
    mockGetDashboardStats.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AdminDashboard />);

    expect(screen.getByText('Loading Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('should render dashboard with stats after loading', async () => {
    const mockStats = {
      customers: { total: 50, active: 35 },
      sites: { total: 100, active: 85 },
      aiQueue: {
        total: 25,
        pending: 5,
        assigned: 3,
        processing: 2,
        completed: 12,
        rejected: 3,
        averageProcessingTime: 120,
        totalRevenue: 125.75,
      },
      systemHealth: { status: 'Healthy' },
    };

    const mockUser = {
      id: '123',
      email: 'admin@locod.ai',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
    };

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'adminToken') return 'mock-token';
      if (key === 'adminUser') return JSON.stringify(mockUser);
      return null;
    });

    mockGetDashboardStats.mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });

    // Check stats display
    expect(screen.getByText('25')).toBeInTheDocument(); // Total requests
    expect(screen.getByText('5')).toBeInTheDocument(); // Pending
    expect(screen.getByText('2')).toBeInTheDocument(); // Processing
    expect(screen.getByText('12')).toBeInTheDocument(); // Completed
    expect(screen.getByText('$125.75')).toBeInTheDocument(); // Revenue

    // Check performance metrics
    expect(screen.getByText('120 seconds')).toBeInTheDocument(); // Avg processing time
    expect(screen.getByText('48%')).toBeInTheDocument(); // Success rate (12/25 * 100)

    // Check user info in header
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('should display user email as fallback when no first name', async () => {
    const mockStats = {
      customers: { total: 0, active: 0 },
      sites: { total: 0, active: 0 },
      aiQueue: {
        total: 0,
        pending: 0,
        assigned: 0,
        processing: 0,
        completed: 0,
        rejected: 0,
        averageProcessingTime: 0,
        totalRevenue: 0,
      },
      systemHealth: { status: 'Healthy' },
    };

    const mockUser = {
      id: '123',
      email: 'admin@locod.ai',
      role: 'admin',
    };

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'adminToken') return 'mock-token';
      if (key === 'adminUser') return JSON.stringify(mockUser);
      return null;
    });

    mockGetDashboardStats.mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('admin@locod.ai')).toBeInTheDocument();
    });
  });

  it('should handle API error and redirect to login', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'adminToken') return 'mock-token';
      return null;
    });

    mockGetDashboardStats.mockRejectedValueOnce(new Error('Unauthorized'));

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should handle logout correctly', async () => {
    const mockStats = {
      customers: { total: 0, active: 0 },
      sites: { total: 0, active: 0 },
      aiQueue: {
        total: 0,
        pending: 0,
        assigned: 0,
        processing: 0,
        completed: 0,
        rejected: 0,
        averageProcessingTime: 0,
        totalRevenue: 0,
      },
      systemHealth: { status: 'Healthy' },
    };

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'adminToken') return 'mock-token';
      return null;
    });

    mockGetDashboardStats.mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Sign Out');
    logoutButton.click();

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminToken');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminUser');
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should display correct success rate calculation', async () => {
    const mockStats = {
      customers: { total: 0, active: 0 },
      sites: { total: 0, active: 0 },
      aiQueue: {
        total: 10,
        pending: 1,
        assigned: 1,
        processing: 1,
        completed: 7,
        rejected: 0,
        averageProcessingTime: 90,
        totalRevenue: 35.00,
      },
      systemHealth: { status: 'Healthy' },
    };

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'adminToken') return 'mock-token';
      return null;
    });

    mockGetDashboardStats.mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('70%')).toBeInTheDocument(); // 7/10 * 100 = 70%
    });
  });

  it('should handle zero total requests for success rate', async () => {
    const mockStats = {
      customers: { total: 0, active: 0 },
      sites: { total: 0, active: 0 },
      aiQueue: {
        total: 0,
        pending: 0,
        assigned: 0,
        processing: 0,
        completed: 0,
        rejected: 0,
        averageProcessingTime: 0,
        totalRevenue: 0,
      },
      systemHealth: { status: 'Healthy' },
    };

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'adminToken') return 'mock-token';
      return null;
    });

    mockGetDashboardStats.mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument(); // 0 total should show 0%
    });
  });

  it('should display system status indicators', async () => {
    const mockStats = {
      customers: { total: 0, active: 0 },
      sites: { total: 0, active: 0 },
      aiQueue: {
        total: 0,
        pending: 0,
        assigned: 0,
        processing: 0,
        completed: 0,
        rejected: 0,
        averageProcessingTime: 0,
        totalRevenue: 0,
      },
      systemHealth: { status: 'Healthy' },
    };

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'adminToken') return 'mock-token';
      return null;
    });

    mockGetDashboardStats.mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument(); // Backend API
      expect(screen.getByText('Connected')).toBeInTheDocument(); // Database
    });
  });

  it('should have working AI Queue navigation link', async () => {
    const mockStats = {
      customers: { total: 0, active: 0 },
      sites: { total: 0, active: 0 },
      aiQueue: {
        total: 0,
        pending: 0,
        assigned: 0,
        processing: 0,
        completed: 0,
        rejected: 0,
        averageProcessingTime: 0,
        totalRevenue: 0,
      },
      systemHealth: { status: 'Healthy' },
    };

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'adminToken') return 'mock-token';
      return null;
    });

    mockGetDashboardStats.mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      const aiQueueLink = screen.getByRole('link', { name: /AI Queue/ });
      expect(aiQueueLink).toBeInTheDocument();
      expect(aiQueueLink).toHaveAttribute('href', '/dashboard/ai-queue');
    });
  });
});