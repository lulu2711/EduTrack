import { create } from 'zustand';
import { api } from '../services/api';

interface User {
  id: string;
  name?: string;
  username?: string;
  studentId?: string;
  role: 'student' | 'teacher' | 'admin';
  classId?: string;
  className?: string;
  grade?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (role: 'student' | 'teacher' | 'admin', credentials: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (role, credentials) => {
    set({ isLoading: true, error: null });
    try {
      let response;
      if (role === 'admin') {
        response = await api.loginAdmin(credentials.username, credentials.password);
      } else if (role === 'teacher') {
        response = await api.loginTeacher(credentials.name, credentials.password);
      } else {
        response = await api.loginStudent(credentials.studentId, credentials.password);
      }

      if (response.success) {
        api.setToken(response.data.token);
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || '登录失败',
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
    }
  },

  logout: () => {
    api.clearToken();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = api.getToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await api.getCurrentUser();
      if (response.success) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (error) {
      api.clearToken();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
