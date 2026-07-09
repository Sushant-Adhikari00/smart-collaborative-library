import { create } from 'zustand';
import { api } from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Mock API call
      // const response = await api.post('/auth/login', { email, password });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = { id: 1, name: 'Alex Student', email, role: 'student' };
      const mockToken = 'mock_jwt_token';
      
      localStorage.setItem('scl_auth_token', mockToken);
      set({ user: mockUser, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: error.message || 'Login failed', isLoading: false });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUser = { id: 1, name, email, role: 'student' };
      const mockToken = 'mock_jwt_token';
      
      localStorage.setItem('scl_auth_token', mockToken);
      set({ user: mockUser, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: error.message || 'Registration failed', isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('scl_auth_token');
    set({ user: null, isAuthenticated: false });
  },
}));
