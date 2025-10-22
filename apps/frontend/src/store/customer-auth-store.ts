import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Customer-specific types
export interface CustomerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer';
  isEmailVerified: boolean;
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface CustomerRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface CustomerAuthState {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface CustomerAuthStore extends CustomerAuthState {
  // Actions
  login: (credentials: CustomerLoginRequest) => Promise<void>;
  register: (userData: CustomerRegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: CustomerUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Customer API client - uses relative URLs for Next.js rewrites
const customerApiClient = axios.create({
  baseURL: '', // Use relative URLs to leverage Next.js rewrites
  timeout: 10000,
  withCredentials: true,
});

// Token management for customers
const setCustomerAuthTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('customer_access_token', accessToken);
  document.cookie = `customer_refresh_token=${refreshToken}; path=/; httpOnly=false; secure=${process.env.NODE_ENV === 'production'}; samesite=strict; max-age=${7 * 24 * 60 * 60}`;
  
  customerApiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
};

const clearCustomerAuthTokens = () => {
  localStorage.removeItem('customer_access_token');
  document.cookie = 'customer_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  delete customerApiClient.defaults.headers.common['Authorization'];
};

const getCustomerAccessToken = () => {
  return localStorage.getItem('customer_access_token');
};

const getCustomerRefreshToken = () => {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('customer_refresh_token='))
    ?.split('=')[1];
};

// Set up request interceptor
customerApiClient.interceptors.request.use((config) => {
  const token = getCustomerAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Set up response interceptor for token refresh
customerApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      
      try {
        const refreshToken = getCustomerRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post('/customer/auth/refresh', {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        setCustomerAuthTokens(accessToken, newRefreshToken);
        
        return customerApiClient(original);
      } catch (refreshError) {
        console.log('🚫 Token refresh failed, forcing logout and redirect');
        clearCustomerAuthTokens();
        // Force logout in store
        if (typeof window !== 'undefined') {
          const store = useCustomerAuthStore.getState();
          store.setUser(null);
          // Force immediate redirect
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const useCustomerAuthStore = create<CustomerAuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: CustomerLoginRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await customerApiClient.post('/customer/auth/login', credentials);
          const { user, accessToken, refreshToken } = response.data;

          // Store tokens
          setCustomerAuthTokens(accessToken, refreshToken);

          // Update state
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (userData: CustomerRegisterRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await customerApiClient.post('/customer/auth/register', userData);
          const { user, accessToken, refreshToken } = response.data;

          // Store tokens
          setCustomerAuthTokens(accessToken, refreshToken);

          // Update state
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Registration failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });

          // Try to logout on server
          try {
            const refreshToken = getCustomerRefreshToken();
            if (refreshToken) {
              await customerApiClient.post('/customer/auth/logout', { refreshToken });
            }
          } catch (error) {
            console.warn('Server logout failed, proceeding with client logout');
          }

          // Clear tokens and state
          clearCustomerAuthTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Redirect to login page (Issue #140-1)
          if (typeof window !== 'undefined') {
            console.log('✅ Logout successful, redirecting to login page');
            window.location.href = '/login';
          }
        } catch (error) {
          // Even if logout fails, clear local state and redirect
          clearCustomerAuthTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Redirect to login page (Issue #140-1)
          if (typeof window !== 'undefined') {
            console.log('⚠️ Logout error, but redirecting to login page anyway');
            window.location.href = '/login';
          }
        }
      },

      setUser: (user: CustomerUser | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });

          const response = await customerApiClient.get('/customer/auth/profile');
          const user = response.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          // Token is invalid or expired
          clearCustomerAuthTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshToken: async () => {
        try {
          const refreshToken = getCustomerRefreshToken();

          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await customerApiClient.post('/customer/auth/refresh', {
            refreshToken: refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          setCustomerAuthTokens(accessToken, newRefreshToken);

          // Update user info
          await get().checkAuth();
        } catch (error) {
          // Refresh failed, logout user
          clearCustomerAuthTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          throw error;
        }
      },
    }),
    {
      name: 'customer-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);