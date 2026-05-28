import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

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

interface AuthContextType {
  user: User | null;
  token: string | null;
  contexts: ContextItem[];
  activeContext: ContextItem | null;
  login: (userData: User, token: string, contexts: ContextItem[], activeContext: ContextItem) => void;
  logout: () => void;
  switchContext: (ctx: ContextItem) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { ContextItem, User };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [activeContext, setActiveContext] = useState<ContextItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedContexts = localStorage.getItem('contexts');
    const storedActive = localStorage.getItem('activeContext');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedContexts) setContexts(JSON.parse(storedContexts));
      if (storedActive) setActiveContext(JSON.parse(storedActive));
    }
    setIsLoading(false);
  }, []);

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('contexts');
    localStorage.removeItem('activeContext');
  };

  const switchContext = async (ctx: ContextItem) => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/auth/switch-context', {
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
    <AuthContext.Provider value={{ user, token, contexts, activeContext, login, logout, switchContext, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
