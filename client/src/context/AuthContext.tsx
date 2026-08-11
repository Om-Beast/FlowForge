import { createContext, useContext, type ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  role: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userId: null,
  role: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO: Implement auth state management
  return (
    <AuthContext.Provider value={{ isAuthenticated: false, userId: null, role: null }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
export default AuthContext;
