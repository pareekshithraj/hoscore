import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

import { BASE_URL } from '../utils/apiConfig';

interface ContextItem {
  type: 'hospital' | 'patient' | 'superadmin';
  hospitalId?: string;
  hospitalName?: string;
  role?: string;
  department?: string;
  permissions?: string[];
  staffTypeId?: string;
  staffTypeName?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  isSuperAdmin?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'URGENT' | 'SUCCESS';
  createdAt: Date;
  isRead: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  contexts: ContextItem[];
  activeContext: ContextItem | null;
  login: (userData: User, token: string, contexts: ContextItem[], activeContext: ContextItem) => void;
  logout: () => void;
  switchContext: (ctx: ContextItem) => Promise<void>;
  isLoading: boolean;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: Notification[];
  addNotification: (title: string, message: string, type?: Notification['type']) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { ContextItem, User, Notification };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [activeContext, setActiveContext] = useState<ContextItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientIdState] = useState<string | null>(null);

  // Theme support (defaulting to light as requested)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  // Client-side notification list
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    return [
      {
        id: 'init-1',
        title: 'System Encrypted & Active',
        message: 'HOSCORE clinical environment initialized in secure mode.',
        type: 'SUCCESS',
        createdAt: new Date(),
        isRead: false,
      },
      {
        id: 'init-2',
        title: 'Shift Schedule Synced',
        message: 'The shift schedules for this week have been updated and rostered.',
        type: 'INFO',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        isRead: false,
      },
      {
        id: 'init-3',
        title: 'IV Fluids Reorder Alert',
        message: 'Stock check warning: Saline IV Bags are low in Central Pharmacy.',
        type: 'WARNING',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: false,
      }
    ];
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const addNotification = (title: string, message: string, type: Notification['type'] = 'INFO') => {
    setNotifications(prev => [
      {
        id: Math.random().toString(36).substring(7),
        title,
        message,
        type,
        createdAt: new Date(),
        isRead: false,
      },
      ...prev
    ]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const setSelectedPatientId = (id: string | null) => {
    setSelectedPatientIdState(id);
    if (id) {
      localStorage.setItem('selectedPatientId', id);
    } else {
      localStorage.removeItem('selectedPatientId');
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedContexts = localStorage.getItem('contexts');
    const storedActive = localStorage.getItem('activeContext');
    const storedSelected = localStorage.getItem('selectedPatientId');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedContexts) setContexts(JSON.parse(storedContexts));
      if (storedActive) setActiveContext(JSON.parse(storedActive));
      if (storedSelected) setSelectedPatientIdState(storedSelected);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const bridge = (window as any).AndroidBridge;
    if (bridge) {
      if (user && activeContext) {
        try {
          if (typeof bridge.syncUser === 'function') {
            bridge.syncUser(user.name, activeContext.role || 'STAFF', activeContext.type);
          }
        } catch (e) {
          console.error("Failed to sync user via AndroidBridge", e);
        }
      } else {
        try {
          if (typeof bridge.clearUser === 'function') {
            bridge.clearUser();
          }
        } catch (e) {
          console.error("Failed to clear user via AndroidBridge", e);
        }
      }
    }
  }, [user, activeContext]);


  const login = (userData: User, newToken: string, ctxs: ContextItem[], active: ContextItem) => {
    setUser(userData);
    setToken(newToken);
    setContexts(ctxs);
    setActiveContext(active);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('contexts', JSON.stringify(ctxs));
    localStorage.setItem('activeContext', JSON.stringify(active));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setContexts([]);
    setActiveContext(null);
    setSelectedPatientIdState(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('contexts');
    localStorage.removeItem('activeContext');
    localStorage.removeItem('selectedPatientId');
  };

  const switchContext = async (ctx: ContextItem) => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/auth/switch-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contextType: ctx.type, hospitalId: ctx.hospitalId }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setActiveContext(ctx);
        localStorage.setItem('token', data.token);
        localStorage.setItem('activeContext', JSON.stringify(ctx));
      }
    } catch (err) {
      console.error('Switch context failed', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, contexts, activeContext, login, logout, switchContext, isLoading,
      selectedPatientId, setSelectedPatientId, theme, toggleTheme, notifications,
      addNotification, markNotificationAsRead, clearNotifications
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
