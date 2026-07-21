import { createContext, useCallback, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const login = useCallback(async (username, password) => {
    const res = await window.vizo.login(username, password);
    if (res.ok) {
      setUser(res.user);
      setMustChangePassword(!!res.mustChangePassword);
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    await window.vizo.logout();
    setUser(null);
    setMustChangePassword(false);
  }, []);

  const can = useCallback(
    (permission) => {
      if (!user) return false;
      if (user.role === 'owner') return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, login, logout, can, mustChangePassword, setMustChangePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
