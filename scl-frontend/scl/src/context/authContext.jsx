import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

// Helper: read the stored user synchronously so we never start as null
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Initialize synchronously from localStorage — avoids the flash-of-null
  // that causes the Navbar to fire an unauthenticated /notifications request
  // before the useEffect hydration runs, triggering the 401 interceptor logout.
  const [user, setUser] = useState(() => getStoredUser());

  // Keep localStorage in sync whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
