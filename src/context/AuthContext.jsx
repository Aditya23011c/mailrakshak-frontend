import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, requestCode as apiRequestCode, verifyCode as apiVerifyCode, verifyStaffOtp as apiVerifyStaffOtp, setInitialPassword as apiSetInitialPassword, signupReporter as apiSignupReporter } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const readUser = () => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const save = (token, u) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // api.js fires this when the backend answers 401 (expired or invalid token)
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      logout,
      signIn: async (role, email, password) => { const r = await apiLogin(role, email, password); return save(r.token, r.user); },
      verifyStaffOtp: async (otp) => { const r = await apiVerifyStaffOtp(otp); return save(r.token, r.user); },
      setInitialPassword: async (pw) => { const r = await apiSetInitialPassword(pw); return save(r.token, r.user); },
      signupReporter: (details) => apiSignupReporter(details),
      requestCode: (email) => apiRequestCode(email),
      verifyCode: async (email, code) => { const r = await apiVerifyCode(email, code); return save(r.token, r.user); },
    }),
    [user, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
