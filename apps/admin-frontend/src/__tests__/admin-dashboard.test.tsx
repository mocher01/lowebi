/**
 * Admin Dashboard Component Unit Tests
 * Issue #79 - Admin Portal Security
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '../app/dashboard/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockRouter = {
  push: jest.fn(),
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('AdminDashboard Component', () => {
  const mockStats = {
    customers: { total: 150, active: 142, monthlyGrowth: 12 },
    sites: { total: 89, active: 78, pending: 11 },
    aiQueue: { pending: 5, processing: 2, completed24h: 23 },
    systemHealth: { status: 'healthy', database: 'healthy', services: 'healthy', uptime: 99.9 }
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
    
    // Default localStorage mock - user is authenticated
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'adminToken') return 'mock-admin-token';
      if (key === 'refreshToken') return 'mock-refresh-token';
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication Protection', () => {
    test('should redirect to login if no admin token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<AdminDashboard />);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    test('should stay on dashboard if admin token exists', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adminToken') return 'valid-admin-token';
        if (key === 'adminUser') return JSON.stringify({ id: '1', email: 'admin@locod.ai', role: 'admin' });
        return null;
      });
      
      render(<AdminDashboard />);
      
      expect(mockRouter.push).not.toHaveBeenCalledWith('/');
    });
  });

  describe('Dashboard Loading States', () => {
    test('should show loading state initially', () => {
      // Mock localStorage to have valid token
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'adminToken') return 'valid-token';
        return null;
      });
      
      // Mock a delayed API response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<AdminDashboard />);
      
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    test('should show dashboard content after loading', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('LOGEN Admin Portal')).toBeInTheDocument();
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Header', () => {
    test('should display admin portal branding', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('LOGEN Admin Portal')).toBeInTheDocument();
        expect(screen.getByText('LA')).toBeInTheDocument(); // Logo
      });
    });

    test('should have sign out button', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
      });
    });

    test('should handle logout functionality', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        const signOutButton = screen.getByText('Sign Out');
        fireEvent.click(signOutButton);
      });
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  describe('Statistics Display', () => {
    beforeEach(async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
    });

    test('should display customer statistics', () => {
      expect(screen.getByText('Total Customers')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    test('should display site statistics', () => {
      expect(screen.getByText('Active Sites')).toBeInTheDocument();
      expect(screen.getByText('78')).toBeInTheDocument();
    });

    test('should display AI queue statistics', () => {
      expect(screen.getByText('AI Queue')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Pending count
    });

    test('should display system health', () => {
      expect(screen.getByText('System Health')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    test('should have proper stat card structure', () => {
      // Each stat card should have an icon, title, and value
      const statCards = screen.getAllByRole('generic').filter(el => 
        el.className.includes('bg-gray-800') && el.className.includes('rounded-lg')
      );
      
      expect(statCards.length).toBeGreaterThan(0);
    });
  });

  describe('Quick Actions', () => {
    beforeEach(async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
    });

    test('should display quick actions section', () => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    test('should have customer management action', () => {
      expect(screen.getByText('Manage Customers')).toBeInTheDocument();
      expect(screen.getByText('View and edit customer accounts')).toBeInTheDocument();
    });

    test('should have AI queue action', () => {
      expect(screen.getByText('AI Queue')).toBeInTheDocument();
      expect(screen.getByText('Process content generation requests')).toBeInTheDocument();
    });

    test('should have system monitoring action', () => {
      expect(screen.getByText('System Monitoring')).toBeInTheDocument();
      expect(screen.getByText('Check system status and logs')).toBeInTheDocument();
    });

    test('should have clickable action buttons', () => {
      const actionButtons = screen.getAllByRole('button').filter(button => 
        button.textContent?.includes('Manage Customers') ||
        button.textContent?.includes('AI Queue') ||
        button.textContent?.includes('System Monitoring')
      );
      
      expect(actionButtons.length).toBeGreaterThanOrEqual(3);
      
      actionButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('API Integration', () => {
    test('should call admin stats endpoint with correct headers', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/stats', {
          headers: {
            'Authorization': 'Bearer mock-admin-token',
          },
        });
      });
    });

    test('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });

    test('should redirect on unauthorized response', async () => {
      const mockResponse = {
        ok: false,
        status: 401
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
    });

    test('should handle missing stats gracefully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}) // Empty stats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Default values
      });
    });
  });

  describe('Responsive Design', () => {
    test('should have responsive grid classes', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        const statsGrid = screen.getByText('Dashboard Overview').parentElement;
        expect(statsGrid?.innerHTML).toContain('grid-cols-1 md:grid-cols-2 lg:grid-cols-4');
      });
    });

    test('should have mobile-friendly layout', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        const content = screen.getByText('Dashboard Overview').closest('main');
        expect(content).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
      });
    });
  });

  describe('Security Features', () => {
    test('should not display sensitive information', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        const pageContent = document.body.textContent || '';
        expect(pageContent).not.toMatch(/password/i);
        expect(pageContent).not.toMatch(/secret/i);
        expect(pageContent).not.toMatch(/api[_-]?key/i);
      });
    });

    test('should use secure token storage', () => {
      render(<AdminDashboard />);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('adminToken');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('Admin-Specific Styling', () => {
    test('should use admin color scheme', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        // Should use red/orange admin colors
        const adminElements = screen.getByText('LA').parentElement;
        expect(adminElements).toHaveClass('bg-gradient-to-r', 'from-red-600', 'to-orange-600');
        
        // Should use gray/dark theme
        const backgroundElements = document.querySelector('.bg-gray-900');
        expect(backgroundElements).toBeInTheDocument();
      });
    });

    test('should not use customer portal colors', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        const pageContent = document.body.innerHTML;
        expect(pageContent).not.toContain('from-indigo-600');
        expect(pageContent).not.toContain('to-purple-600');
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading structure', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /LOGEN Admin Portal/ })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /Dashboard Overview/ })).toBeInTheDocument();
      });
    });

    test('should have keyboard navigation support', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockStats
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      render(<AdminDashboard />);
      
      await waitFor(() => {
        const signOutButton = screen.getByText('Sign Out');
        expect(signOutButton).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });
});