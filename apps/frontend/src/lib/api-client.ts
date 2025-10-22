import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';

// API Configuration for V2 Backend
// Frontend makes calls through nginx reverse proxy (relative paths)
// This avoids mixed content issues (HTTPS → HTTP) by using the same domain
// For AI Queue requests, use admin.dev.lowebi.com
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || '';
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Network error retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Network error detection
const isNetworkError = (error: AxiosError): boolean => {
  return !error.response && (
    error.code === 'ECONNABORTED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.message.includes('Network Error')
  );
};

// Retry logic for network errors
const retryRequest = async (error: AxiosError, retryCount = 0): Promise<any> => {
  if (retryCount >= MAX_RETRY_ATTEMPTS || !isNetworkError(error)) {
    throw error;
  }

  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
  
  try {
    return await apiClient.request(error.config as any);
  } catch (retryError) {
    return retryRequest(retryError as AxiosError, retryCount + 1);
  }
};

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle network errors with retry logic
    if (isNetworkError(error) && originalRequest && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
      try {
        return await retryRequest(error);
      } catch (retryError) {
        // All retries failed
        const networkError = retryError as AxiosError;
        return Promise.reject({
          ...networkError,
          message: 'Network error: Please check your internet connection and try again.',
          isNetworkError: true,
        });
      }
    }

    // Handle 401 Unauthorized - Token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken,
          });

          const { accessToken } = response.data;
          Cookies.set(TOKEN_KEY, accessToken, { expires: 7 }); // 7 days

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove(TOKEN_KEY);
        Cookies.remove(REFRESH_TOKEN_KEY);
        
        // Only redirect if we're in the browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=session_expired';
        }
      }
    }

    // Handle specific error statuses
    let enhancedError = error;
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 400:
          enhancedError.message = data?.message || 'Bad request. Please check your input.';
          break;
        case 403:
          enhancedError.message = data?.message || 'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          enhancedError.message = data?.message || 'Resource not found.';
          break;
        case 409:
          enhancedError.message = data?.message || 'Conflict. This resource already exists.';
          break;
        case 422:
          enhancedError.message = data?.message || 'Validation error. Please check your input.';
          break;
        case 429:
          enhancedError.message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          enhancedError.message = 'Server error. Please try again later.';
          break;
        case 502:
        case 503:
        case 504:
          enhancedError.message = 'Service temporarily unavailable. Please try again later.';
          break;
        default:
          enhancedError.message = data?.message || 'An unexpected error occurred.';
      }
    } else if (error.request) {
      enhancedError.message = 'No response from server. Please check your internet connection.';
    }

    return Promise.reject(enhancedError);
  }
);

// Authentication helpers
export const setAuthTokens = (accessToken: string, refreshToken?: string) => {
  Cookies.set(TOKEN_KEY, accessToken, { expires: 7 });
  if (refreshToken) {
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 30 }); // 30 days
  }
};

export const clearAuthTokens = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

export const getAuthToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Admin API client for AI Queue requests to admin.dev.lowebi.com
export const adminApiClient: AxiosInstance = axios.create({
  baseURL: ADMIN_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds for AI requests
});

// Admin API doesn't need auth for AI queue endpoints
adminApiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const data = error.response.data as any;
      error.message = data?.message || 'Admin API request failed';
    }
    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;