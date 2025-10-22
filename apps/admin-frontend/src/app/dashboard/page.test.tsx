import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import AdminDashboard from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('AdminDashboard Component - Complete Test Suite', () => {
  let mockPush: jest.Mock;
  let mockRouter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    mockPush = jest.fn();
    mockRouter = { push: mockPush };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication Check', () => {
    test('redirects to login when no token is present', () => {
      // No token in localStorage
      render(<AdminDashboard />);
      
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    test('stays on dashboard when valid token is present', async () => {
      localStorage.setItem('adminToken', 'valid-token-123');
      
      const mockStats = {
        totalUsers: 10,
        activeUsers: 8,
        inactiveUsers: 2,
        adminUsers: 2,
        customerUsers: 8,
        activeSessions: 5,
        totalSessions: 15,
        recentLogins: 3,
        lastUpdated: '2025-08-21T14:00:00.000Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      render(<AdminDashboard />);
      
      expect(mockPush).not.toHaveBeenCalledWith('/');
      
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Data Loading', () => {
    test('✅ SUCCESSFULLY loads dashboard stats with valid admin token', async () => {
      localStorage.setItem('adminToken', 'valid-admin-token');
      
      const mockStats = {
        totalUsers: 15,
        activeUsers: 12,
        inactiveUsers: 3,
        adminUsers: 2,
        customerUsers: 13,
        activeSessions: 8,
        totalSessions: 25,
        recentLogins: 5,
        lastUpdated: '2025-08-21T14:30:00.000Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/admin/dashboard/stats', {
          headers: {
            'Authorization': 'Bearer valid-admin-token',
          },
        });
      });
      
      // Verify stats are displayed
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // Total Users
        expect(screen.getByText('12')).toBeInTheDocument(); // Active Users
        expect(screen.getByText('3')).toBeInTheDocument();  // Inactive Users
        expect(screen.getByText('2')).toBeInTheDocument();  // Admin Users
        expect(screen.getByText('13')).toBeInTheDocument(); // Customer Users
        expect(screen.getByText('8')).toBeInTheDocument();  // Active Sessions
        expect(screen.getByText('25')).toBeInTheDocument(); // Total Sessions
        expect(screen.getByText('5')).toBeInTheDocument();  // Recent Logins
      });
    });

    test('redirects to login on unauthorized dashboard access', async () => {
      localStorage.setItem('adminToken', 'invalid-token');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    test('redirects to login on forbidden dashboard access', async () => {
      localStorage.setItem('adminToken', 'customer-token');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: 'Forbidden' }),
      });

      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    test('handles network errors during dashboard loading', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching dashboard:', expect.any(Error));
        expect(mockPush).toHaveBeenCalledWith('/');
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Loading States', () => {
    test('shows loading state initially', () => {
      localStorage.setItem('adminToken', 'valid-token');
      
      // Mock a pending promise
      (fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));
      
      render(<AdminDashboard />);
      
      expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
    });

    test('hides loading state after data loads', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalUsers: 5,
          activeUsers: 5,
          inactiveUsers: 0,
          adminUsers: 1,
          customerUsers: 4,
          activeSessions: 2,
          totalSessions: 10,
          recentLogins: 1,
        }),
      });
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });

    test('hides loading state after error', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Logout Functionality', () => {
    test('clears tokens and redirects on logout', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalUsers: 1,
          activeUsers: 1,
          inactiveUsers: 0,
          adminUsers: 1,
          customerUsers: 0,
          activeSessions: 1,
          totalSessions: 1,
          recentLogins: 1,
        }),
      });
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
      
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toBeInTheDocument();
      
      logoutButton.click();
      
      expect(localStorage.getItem('adminToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Dashboard UI Elements', () => {
    test('displays all required dashboard elements', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      
      const mockStats = {
        totalUsers: 100,
        activeUsers: 95,
        inactiveUsers: 5,
        adminUsers: 5,
        customerUsers: 95,
        activeSessions: 50,
        totalSessions: 200,
        recentLogins: 25,
        lastUpdated: '2025-08-21T14:30:00.000Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      render(<AdminDashboard />);
      
      await waitFor(() => {
        // Check main dashboard title
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        
        // Check stat cards
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('Inactive Users')).toBeInTheDocument();
        expect(screen.getByText('Admin Users')).toBeInTheDocument();
        expect(screen.getByText('Customer Users')).toBeInTheDocument();
        expect(screen.getByText('Active Sessions')).toBeInTheDocument();
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('Recent Logins')).toBeInTheDocument();
        
        // Check logout button
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });
    });

    test('displays formatted timestamps', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      
      const mockStats = {
        totalUsers: 1,
        activeUsers: 1,
        inactiveUsers: 0,
        adminUsers: 1,
        customerUsers: 0,
        activeSessions: 1,
        totalSessions: 1,
        recentLogins: 1,
        lastUpdated: '2025-08-21T14:30:00.000Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/last updated/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Scenarios', () => {
    test('handles malformed JSON response', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching dashboard:', expect.any(Error));
        expect(mockPush).toHaveBeenCalledWith('/');
      });
      
      consoleErrorSpy.mockRestore();
    });

    test('handles server errors (5xx)', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching dashboard:', expect.any(Error));
        expect(mockPush).toHaveBeenCalledWith('/');
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('handles zero values in stats', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      
      const mockStats = {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        adminUsers: 0,
        customerUsers: 0,
        activeSessions: 0,
        totalSessions: 0,
        recentLogins: 0,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      render(<AdminDashboard />);
      
      await waitFor(() => {
        const zeroElements = screen.getAllByText('0');
        expect(zeroElements.length).toBeGreaterThan(0);
      });
    });

    test('handles very large numbers in stats', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      
      const mockStats = {
        totalUsers: 999999,
        activeUsers: 888888,
        inactiveUsers: 111111,
        adminUsers: 999,
        customerUsers: 998999,
        activeSessions: 50000,
        totalSessions: 2000000,
        recentLogins: 10000,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('999999')).toBeInTheDocument();
        expect(screen.getByText('2000000')).toBeInTheDocument();
      });
    });

    test('handles missing lastUpdated field', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      
      const mockStats = {
        totalUsers: 5,
        activeUsers: 5,
        inactiveUsers: 0,
        adminUsers: 1,
        customerUsers: 4,
        activeSessions: 2,
        totalSessions: 10,
        recentLogins: 1,
        // lastUpdated missing
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        // Should not crash when lastUpdated is missing
      });
    });
  });
});