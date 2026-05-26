import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = () => {
    try {
      const token = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');
      
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    window.location.reload();
  };

  return { user, isLoading, checkSession, logout };
}
