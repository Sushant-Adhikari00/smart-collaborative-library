import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AuthContext } from "../context/authContext.jsx";
import { SearchIcon, LogOutIcon, Menu, X, Sun, Moon } from "lucide-react";

const Navbar = ({ onSearch, toggleTheme, currentTheme }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-base-100 shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="font-bold text-2xl text-primary">
          SCL Library
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 justify-center px-4">
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Search notes..."
                onChange={(e) => onSearch(e.target.value)}
                className="bg-base-200 text-neutral placeholder-base-content w-full py-2 pl-10 pr-4 rounded-full border-2 border-primary focus:border-primary focus:outline-none transition-colors"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            </div>
          </div>

        {/* Right-side buttons (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/contact" className="btn btn-ghost btn-sm text-primary">Contact Us</Link>
          {user ? (
            <>
              <span className="text-primary">Welcome, {user.username || user.name || user.email}</span>
              {(user.role === "ROLE_ADMIN" || user.role === "admin") && (
                <Link to="/admin" className="btn btn-ghost btn-sm text-primary">
                  Admin
                </Link>
              )}
              <Link to="/create" className="btn btn-primary btn-sm">
                Upload
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <LogOutIcon className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-secondary btn-sm">Sign Up</Link>
            </>
          )}
          <button onClick={toggleTheme} className="btn btn-ghost btn-circle text-primary">
            {currentTheme === 'retro' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="btn btn-ghost text-neutral">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4">
          <div className="flex flex-col space-y-4">
            <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search notes..."
                  onChange={(e) => onSearch(e.target.value)}
                  className="bg-base-200 text-neutral placeholder-base-content w-full py-2 pl-10 pr-4 rounded-full border-2 border-primary focus:border-primary focus:outline-none transition-colors"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              </div>
            <Link to="/contact" className="btn btn-ghost text-neutral">Contact Us</Link>
            {user ? (
              <>
                <span className="text-neutral text-center">Welcome, {user.username || user.name || user.email}</span>
                {(user.role === "ROLE_ADMIN" || user.role === "admin") && (
                  <Link to="/admin" className="btn btn-ghost text-neutral">Admin</Link>
                )}
                <Link to="/create" className="btn btn-primary">Upload</Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <LogOutIcon className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">Login</Link>
                <Link to="/signup" className="btn btn-secondary">Sign Up</Link>
              </>
            )}
            <button onClick={toggleTheme} className="btn btn-ghost btn-circle text-primary">
              {currentTheme === 'retro' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
