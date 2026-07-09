import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { useAuthStore } from "./store/authStore";

// Placeholder imports for pages
import { Login } from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { DocumentList } from "./pages/Documents/DocumentList";
import { DocumentDetail } from "./pages/Documents/DocumentDetail";
import { Search } from "./pages/Search/Search";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected Routes */}
        <Route 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/documents" element={<DocumentList />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/collab" element={<div className="p-8">Collab coming soon</div>} />
          <Route path="/settings" element={<div className="p-8">Settings coming soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
