import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserAuth = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const logout = useCallback(async () => {
    await base44.auth.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), checkUserAuth, logout, setUser }),
    [user, loading, checkUserAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>.');
  return ctx;
}

export default AuthProvider;
