import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { logout as logoutApi } from '../api/auth.api';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore error, clear local state anyway
    } finally {
      clearAuth();
      navigate('/login');
    }
  }, [clearAuth, navigate]);

  return {
    user,
    isAuthenticated,
    role: user?.role,
    isAdmin: user?.role === 'ADMIN',
    isHR: user?.role === 'HR',
    isEmployee: user?.role === 'EMPLOYEE',
    isIntern: user?.role === 'INTERN',
    logout,
  };
};
