import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// ─── Storage keys (token only — no passwords stored) ───────────────────────
const TOKEN_KEY = 'verhus_token';
const USERS_KEY = 'verhus_users'; // demo-only local store

// ─── Helpers ────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const generateToken = (userId) => {
  const payload = { userId, exp: Date.now() + 8 * 60 * 60 * 1000 }; // 8h
  return btoa(JSON.stringify(payload));
};

const parseToken = (token) => {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) return null; // expired
    return payload;
  } catch {
    return null;
  }
};

const getUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
};

const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

// Seed a default admin if no users exist
const seedAdmin = () => {
  const users = getUsers();
  if (users.length === 0) {
    saveUsers([{
      id: generateId(),
      full_name: 'Admin VERHUS',
      email: 'admin@verhus.cm',
      password: 'Admin1234!',
      role: 'admin',
      createdAt: new Date().toISOString(),
    }]);
  }
};

// ─── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext();

export const ROLES = {
  COLLECTOR: 'collector',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Auto-login as admin — no password required
  useEffect(() => {
    seedAdmin();
    const users = getUsers();
    const admin = users.find(u => u.role === 'admin');
    if (admin) {
      const token = generateToken(admin.id);
      localStorage.setItem(TOKEN_KEY, token);
      const { password: _, ...safeUser } = admin;
      setUser(safeUser);
      setIsAuthenticated(true);
    }
    setIsLoadingAuth(false);
  }, []);

  // Online/offline detection
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const login = useCallback(async (email, password) => {
    const users = getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) throw new Error('Invalid email or password');
    const token = generateToken(found.id);
    localStorage.setItem(TOKEN_KEY, token);
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    setIsAuthenticated(true);
    return safeUser;
  }, []);

  const register = useCallback(async ({ full_name, email, password, role = ROLES.COLLECTOR }) => {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists');
    }
    const newUser = { id: generateId(), full_name, email, password, role, createdAt: new Date().toISOString() };
    saveUsers([...users, newUser]);
    const token = generateToken(newUser.id);
    localStorage.setItem(TOKEN_KEY, token);
    const { password: _, ...safeUser } = newUser;
    setUser(safeUser);
    setIsAuthenticated(true);
    return safeUser;
  }, []);

  const resetPassword = useCallback(async (email, newPassword) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) throw new Error('No account found with this email');
    users[idx].password = newPassword;
    saveUsers(users);
  }, []);

  // Magic link: in a real app this sends an email; here we auto-login for demo
  const sendMagicLink = useCallback(async (email) => {
    const users = getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) throw new Error('No account found with this email');
    // Demo: auto-login immediately
    const token = generateToken(found.id);
    localStorage.setItem(TOKEN_KEY, token);
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    setIsAuthenticated(true);
    return safeUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const hasRole = useCallback((...roles) => roles.includes(user?.role), [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isOnline,
      login,
      register,
      resetPassword,
      sendMagicLink,
      logout,
      hasRole,
      ROLES,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
