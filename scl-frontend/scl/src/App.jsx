import { Route, Routes, Navigate, useLocation } from "react-router";
import HomePage from "./pages/HomePage.jsx";
import CreatePage from "./pages/CreatePage.jsx";
import UpdateNotePage from "./pages/UpdateNotePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignUpPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ResetPage from "./pages/ResetPage.jsx";
import RequestReset from "./pages/RequestReset.jsx";
import ContactUs from "./pages/ContactUs.jsx";
import { AuthProvider, AuthContext } from "./context/authContext.jsx";
import { useContext, useState, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

// Normal protected route
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

// Admin protected route
const ProtectedAdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "admin")
    return (
      <div className="text-center mt-10 text-red-500 font-bold">
        Access Denied: Admins only
      </div>
    );
  return children;
};

const App = () => {
  const location = useLocation();
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Initialize theme from localStorage or default to 'youtubeDark'
    return localStorage.getItem('theme') || 'retro';
  });

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Update localStorage whenever theme changes
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme(prevTheme =>
      prevTheme === 'retro' ? 'coffee' : 'retro'
    );
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <AuthProvider>
      <div className="relative min-h-screen w-full flex flex-col" data-theme={currentTheme}>
        <Navbar onSearch={handleSearch} toggleTheme={toggleTheme} currentTheme={currentTheme} />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <div key={location.pathname} className="fade-in">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage searchQuery={searchQuery} />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<RequestReset />} />
              <Route path="/reset-password" element={<ResetPage />} />
              <Route path="/contact" element={<ContactUs />} />

              {/* Protected user routes */}
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/update/:id"
                element={
                  <ProtectedRoute>
                    <UpdateNotePage />
                  </ProtectedRoute>
                }
              />

              {/* Protected admin route */}
              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <AdminPage />
                  </ProtectedAdminRoute>
                }
              />
            </Routes>
          </div>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
};

export default App;



