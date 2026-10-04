import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; role?: UserRole }) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  activeRole: UserRole | 'guest';
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  updateUser: (updatedUser: User) => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Check saved session in localStorage
    try {
      const saved = localStorage.getItem('arogyavahini_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load user from storage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      setUser(res.user);
      localStorage.setItem('arogyavahini_user', JSON.stringify(res.user));
      if (res.token) {
        localStorage.setItem('arogyavahini_token', res.token);
      }
      showToast(`Welcome back, ${res.user.name}!`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Login failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string; role?: UserRole }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setUser(res.user);
      localStorage.setItem('arogyavahini_user', JSON.stringify(res.user));
      if (res.token) {
        localStorage.setItem('arogyavahini_token', res.token);
      }
      showToast('Registration successful! Logged in.', 'success');
    } catch (error: any) {
      showToast(error.message || 'Registration failed', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.demoLogin(role);
      setUser(res.user);
      localStorage.setItem('arogyavahini_user', JSON.stringify(res.user));
      if (res.token) {
        localStorage.setItem('arogyavahini_token', res.token);
      }
      showToast(`Logged in as ${res.user.name} (${role.toUpperCase()})`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('arogyavahini_user');
    localStorage.removeItem('arogyavahini_token');
    showToast('Logged out successfully', 'info');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    try {
      localStorage.setItem('arogyavahini_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Could not save updated user to storage', e);
    }
  };

  const refreshUserProfile = async () => {
    if (!user?.id) return;
    try {
      const res = await api.getPatientProfile(user.id);
      if (res.user) {
        updateUser(res.user);
      }
    } catch (e) {
      console.warn('Could not refresh user profile', e);
    }
  };

  const activeRole: UserRole | 'guest' = user?.role || 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updateUser,
        refreshUserProfile,
        activeRole,
        toast,
        showToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
