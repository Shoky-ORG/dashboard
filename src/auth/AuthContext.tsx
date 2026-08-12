import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types/api';
import { authApi, LoginParams } from '@/api/auth';
import { usersApi } from '@/api/users';
import { handleLogout } from '@/api/client';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('shoky_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem('shoky_access_token')
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    localStorage.getItem('shoky_refresh_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await usersApi.getProfile();
      setUser(profile);
      localStorage.setItem('shoky_user', JSON.stringify(profile));
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }

    const onLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    };

    window.addEventListener('shoky-logout', onLogoutEvent);
    return () => window.removeEventListener('shoky-logout', onLogoutEvent);
  }, [accessToken, fetchProfile]);

  const login = async (params: LoginParams) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(params);
      localStorage.setItem('shoky_access_token', data.accessToken);
      localStorage.setItem('shoky_refresh_token', data.refreshToken);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      if (data.user) {
        setUser(data.user);
        localStorage.setItem('shoky_user', JSON.stringify(data.user));
      } else {
        await fetchProfile();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (e) {
        // ignore logout endpoint errors
      }
    }
    handleLogout();
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken && !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
