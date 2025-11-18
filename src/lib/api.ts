import axios from 'axios';
import { mockAuth } from './mockAuth';

// Configure base URL - update this with your actual API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Enable mock auth in development (set NEXT_PUBLIC_USE_MOCK_AUTH=true in .env.local)
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}


// Auth API functions
export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Use mock auth if enabled
    if (USE_MOCK_AUTH) {
      const response = await mockAuth.login(credentials.email, credentials.password);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      return response;
    }

    // Real API call - Fetch all users from /users endpoint and filter by email
    try {
      // Fetch all users (JSON Server doesn't support query params by default)
      const response = await apiClient.get<Array<{ id: string; name: string; email: string; password: string }>>('/users');

      const users = response.data;
      
      // Find user with matching email
      const user = users?.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
      
      // Check if user exists
      if (!user) {
        const apiError: ApiError = {
          message: 'Invalid email or password',
          errors: {},
        };
        throw apiError;
      }

      // Validate that user has required fields
      if (!user.id || !user.email || !user.name) {
        const apiError: ApiError = {
          message: 'User data is incomplete. Please contact support.',
          errors: {},
        };
        throw apiError;
      }

      // Validate password
      if (!user.password || user.password !== credentials.password) {
        const apiError: ApiError = {
          message: 'Invalid email or password',
          errors: {},
        };
        throw apiError;
      }

      // Create auth response (generate a simple token for session management)
      const token = btoa(JSON.stringify({ id: user.id, email: user.email, timestamp: Date.now() }));
      const authResponse: AuthResponse = {
        token,
        user: {
          id: String(user.id), // Ensure ID is a string
          name: user.name,
          email: user.email,
        },
      };

      // Store token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', authResponse.token);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
      }

      return authResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle network errors
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}. If you're in development, make sure your backend server is started.`,
            errors: {},
          };
          throw apiError;
        }

        // Handle API errors
        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Login failed (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      // Re-throw if it's already an ApiError
      if (error && typeof error === 'object' && 'message' in error) {
        throw error;
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  /**
   * Signup user (does NOT automatically log in)
   */
  async signup(data: SignupData): Promise<{ success: boolean; message?: string }> {
    // Use mock auth if enabled
    if (USE_MOCK_AUTH) {
      await mockAuth.signup(data.name, data.email, data.password);
      // Don't store token - user must sign in manually
      return { success: true };
    }

    // Real API call - Check if user already exists, then create new user
    try {
      // First, check if user with this email already exists
      // Fetch all users and filter client-side (JSON Server doesn't support query params by default)
      const checkResponse = await apiClient.get<Array<{ id: string; email: string }>>('/users');

      const existingUser = checkResponse.data?.find(
        u => u.email.toLowerCase() === data.email.toLowerCase()
      );

      if (existingUser) {
        const apiError: ApiError = {
          message: 'Email already exists. Please use a different email or sign in.',
          errors: {
            email: ['Email is already registered'],
          },
        };
        throw apiError;
      }

      // Create new user
      const createResponse = await apiClient.post<{ id: string; name: string; email: string; password: string }>('/users', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // Verify that user was created successfully
      if (!createResponse.data || !createResponse.data.id) {
        const apiError: ApiError = {
          message: 'Failed to create user account. Please try again.',
          errors: {},
        };
        throw apiError;
      }

      // Don't store token - user must sign in manually
      // Just return success
      return { success: true, message: 'Account created successfully! You can now sign in.' };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle network errors
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}. If you're in development, make sure your backend server is started.`,
            errors: {},
          };
          throw apiError;
        }

        // Handle API errors
        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Signup failed (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      // Re-throw if it's already an ApiError
      if (error && typeof error === 'object' && 'message' in error) {
        throw error;
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  /**
   * Logout user
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user from token
   */
  getCurrentUser(): { id: string; name: string; email: string } | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('auth_token');
    }
    return false;
  },

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    // Use mock auth if enabled
    if (USE_MOCK_AUTH) {
      // Simulate sending email
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Password reset email sent successfully' };
    }

    // Real API call
    try {
      const response = await apiClient.post<{ success: boolean; message?: string }>('/auth/forgot-password', {
        email,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle network errors
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        // Handle API errors
        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to send reset email (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred' };
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    // Use mock auth if enabled
    if (USE_MOCK_AUTH) {
      // Simulate password reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Password reset successfully' };
    }

    // Real API call
    try {
      const response = await apiClient.post<{ success: boolean; message?: string }>('/auth/reset-password', {
        token,
        password: newPassword,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle network errors
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        // Handle API errors
        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to reset password (${error.response.status}). The token may be invalid or expired.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred' };
    }
  },
};

// Table data API functions
export interface TableDataItem {
  id?: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
}

export const tableApi = {
  /**
   * Fetch table data from /tables endpoint
   */
  async getTableData(): Promise<TableDataItem[]> {
    try {
      const response = await apiClient.get<TableDataItem[]>('/tables');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle network errors
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        // Handle API errors
        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to fetch table data (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred while fetching table data' };
    }
  },

  /**
   * Delete a table item by id
   */
  async deleteTableItem(id: number): Promise<void> {
    try {
      await apiClient.delete(`/tables/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle network errors
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        // Handle API errors
        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to delete item (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred while deleting the item' };
    }
  },

  /**
   * Update a table item
   */
  async updateTableItem(id: number, data: Partial<TableDataItem>): Promise<TableDataItem> {
    try {
      const response = await apiClient.put<TableDataItem>(`/tables/${id}`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle network errors
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        // Handle API errors
        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to update item (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred while updating the item' };
    }
  },

  /**
   * Create a new table item
   */
  async createTableItem(data: Omit<TableDataItem, 'id'>): Promise<TableDataItem> {
    try {
      const response = await apiClient.post<TableDataItem>('/tables', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle network errors
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        // Handle API errors
        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to create item (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred while creating the item' };
    }
  },
};

// Student Declaration Form API functions
export interface StudentDeclarationFormData {
  id?: string | number;
  membershipNumber: string;
  primaryMemberDetails: {
    name: { title: string; firstName: string; lastName: string };
    address: {
      streetAddress: string;
      city: string;
      state: string;
      postalCode: string;
    };
    birthDate: string;
    email: string;
    phone: {
      homePhone: string;
      workPhone: string;
      mobile: string;
    };
  };
}

export const studentDeclarationApi = {
  /**
   * Fetch all student declaration forms
   */
  async getStudentDeclarationForms(): Promise<StudentDeclarationFormData[]> {
    try {
      const response = await apiClient.get<StudentDeclarationFormData[]>('/studentDeclarationForm');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to fetch student declaration forms (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred while fetching student declaration forms' };
    }
  },

  /**
   * Get available membership numbers
   */
  async getMembershipNumbers(): Promise<string[]> {
    try {
      const forms = await this.getStudentDeclarationForms();
      return forms.map(form => form.membershipNumber);
    } catch (error) {
      // If API fails, return empty array or fallback to static list
      console.warn('Failed to fetch membership numbers from API:', error);
      return [];
    }
  },

  /**
   * Delete a student declaration form by id
   */
  async deleteStudentDeclarationForm(id: string | number): Promise<void> {
    try {
      await apiClient.delete(`/studentDeclarationForm/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to delete student declaration form (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      // Re-throw if it's already an ApiError
      if (error && typeof error === 'object' && 'message' in error) {
        throw error;
      }
      throw { message: 'An unexpected error occurred while deleting the student declaration form' };
    }
  },

  /**
   * Update a student declaration form by id
   */
  async updateStudentDeclarationForm(
    id: string | number,
    data: StudentDeclarationFormData
  ): Promise<StudentDeclarationFormData> {
    try {
      const response = await apiClient.put<StudentDeclarationFormData>(
        `/studentDeclarationForm/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to update student declaration form (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      // Re-throw if it's already an ApiError
      if (error && typeof error === 'object' && 'message' in error) {
        throw error;
      }
      throw { message: 'An unexpected error occurred while updating the student declaration form' };
    }
  },

  /**
   * Create a new student declaration form
   */
  async createStudentDeclarationForm(
    data: StudentDeclarationFormData
  ): Promise<StudentDeclarationFormData> {
    try {
      const response = await apiClient.post<StudentDeclarationFormData>(
        '/studentDeclarationForm',
        data
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to create student declaration form (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      // Re-throw if it's already an ApiError
      if (error && typeof error === 'object' && 'message' in error) {
        throw error;
      }
      throw { message: 'An unexpected error occurred while creating the student declaration form' };
    }
  },
};

// Marketing Statistics API functions
export interface MarketingStatistic {
  id?: string;
  productId: string;
  productName: string;
  totalStock: number;
  availableStock: number;
  soldQuantity: number;
  date: string;
}

export const marketingStatisticsApi = {
  /**
   * Fetch all marketing statistics
   */
  async getMarketingStatistics(): Promise<MarketingStatistic[]> {
    try {
      const response = await apiClient.get<MarketingStatistic[]>('/marketingStatistics');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to fetch marketing statistics (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred while fetching marketing statistics' };
    }
  },

  /**
   * Get a single marketing statistic by id
   */
  async getMarketingStatistic(id: string): Promise<MarketingStatistic> {
    try {
      const response = await apiClient.get<MarketingStatistic>(`/marketingStatistics/${id}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to fetch marketing statistic (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred while fetching the marketing statistic' };
    }
  },

  /**
   * Create a new marketing statistic
   */
  async createMarketingStatistic(data: Omit<MarketingStatistic, 'id'>): Promise<MarketingStatistic> {
    try {
      const response = await apiClient.post<MarketingStatistic>('/marketingStatistics', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to create marketing statistic (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred while creating the marketing statistic' };
    }
  },

  /**
   * Update a marketing statistic by id
   */
  async updateMarketingStatistic(id: string, data: Partial<MarketingStatistic>): Promise<MarketingStatistic> {
    try {
      const response = await apiClient.put<MarketingStatistic>(`/marketingStatistics/${id}`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to update marketing statistic (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred while updating the marketing statistic' };
    }
  },

  /**
   * Delete a marketing statistic by id
   */
  async deleteMarketingStatistic(id: string): Promise<void> {
    try {
      await apiClient.delete(`/marketingStatistics/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const apiError: ApiError = {
            message: `Cannot connect to server. Please check if the API is running at ${API_BASE_URL}.`,
            errors: {},
          };
          throw apiError;
        }

        const apiError: ApiError = {
          message: error.response?.data?.message ||
            error.response?.data?.error ||
            `Failed to delete marketing statistic (${error.response.status}). Please try again.`,
          errors: error.response?.data?.errors,
        };
        throw apiError;
      }
      throw { message: 'An unexpected error occurred while deleting the marketing statistic' };
    }
  },
};

export default apiClient;

