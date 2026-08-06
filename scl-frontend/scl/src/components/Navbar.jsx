import { useContext, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { AuthContext } from "../context/authContext.jsx";
import { SearchIcon, LogOutIcon, Menu, X, Sun, Moon, Users, Bell } from "lucide-react";
import OwnerNotificationsModal from "./collaboration/OwnerNotificationsModal.jsx";
import api from "../lib/axios.js";

const Navbar = ({ onSearch, toggleTheme, currentTheme }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count when logged in
  const fetchUnreadCount = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    try {
      const res = await api.get('/notifications');
      const data = res.data?.data || [];
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch {
      // Silently fail - don't disturb UX if this call fails
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 60s for new notifications
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const confirmLogout = () => {
    logout();
    navigate("/");
    setIsLogoutModalOpen(false);
  };

  return (
    <>
      <nav className="backdrop-blur-md bg-base-100/80 border-b border-base-content/5 p-4 sticky top-0 z-30 transition-all duration-300">
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="font-bold text-2xl text-primary flex items-center gap-2 font-display tracking-tight hover:scale-[1.02] transition-transform">
            📚 SCL Library
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                placeholder="Search resources, topics, or authors..."
                onChange={(e) => onSearch(e.target.value)}
                className="bg-base-200/60 text-neutral placeholder-base-content/50 w-full py-2 pl-10 pr-4 rounded-full border border-base-content/10 focus:border-primary focus:bg-base-100 focus:outline-none transition-all text-sm shadow-2xs"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            </div>
          </div>

          {/* Right-side buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/contact" className="btn btn-ghost btn-sm text-primary btn-interactive">Contact Us</Link>
            {user ? (
              <>
                <span className="text-primary text-xs font-semibold">
                  Hi, {user.username || user.name || user.email}
                </span>

                {(user.role === "ROLE_ADMIN" || user.role === "admin" || user.role === "ADMIN") && (
                  <Link to="/admin" className="btn btn-ghost btn-sm text-primary btn-interactive">
                    Admin
                  </Link>
                )}

                <Link to="/collaboration" className="btn btn-ghost btn-sm text-primary flex items-center gap-1 btn-interactive">
                  <Users className="h-4 w-4" /> Study Groups
                </Link>

                {/* Notifications Bell */}
                <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="btn btn-ghost btn-circle btn-sm text-primary relative btn-interactive"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="badge badge-xs badge-error absolute top-1 right-1 min-w-[14px] h-[14px] text-[9px]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <Link to="/create" className="btn btn-primary btn-sm btn-interactive shadow-xs">
                  Upload Resource
                </Link>

                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="btn btn-secondary btn-sm flex items-center gap-1.5 btn-interactive shadow-xs"
                >
                  <LogOutIcon className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary btn-sm btn-interactive shadow-xs">Login</Link>
                <Link to="/signup" className="btn btn-secondary btn-sm btn-interactive shadow-xs">Sign Up</Link>
              </>
            )}
            <button onClick={toggleTheme} className="btn btn-ghost btn-circle text-primary btn-interactive">
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
          <div className="md:hidden mt-4 space-y-3 p-2 bg-base-200 rounded-xl">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search notes..."
                onChange={(e) => onSearch(e.target.value)}
                className="bg-base-100 text-neutral placeholder-base-content/60 w-full py-2 pl-10 pr-4 rounded-full border-2 border-primary focus:border-primary focus:outline-none transition-colors text-xs"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            </div>
            <Link to="/contact" className="btn btn-ghost btn-sm w-full">Contact Us</Link>
            {user ? (
              <>
                <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="btn btn-ghost btn-sm w-full flex items-center gap-2 justify-center text-primary"
                >
                  <Bell className="h-4 w-4" />
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <Link to="/collaboration" className="btn btn-ghost btn-sm w-full flex items-center gap-1 justify-center">
                  <Users className="h-4 w-4" /> Study Groups
                </Link>
                <Link to="/create" className="btn btn-primary btn-sm w-full">Upload</Link>
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="btn btn-secondary btn-sm w-full flex items-center gap-2 justify-center"
                >
                  <LogOutIcon className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn btn-primary btn-sm flex-1">Login</Link>
                <Link to="/signup" className="btn btn-secondary btn-sm flex-1">Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-neutral">Confirm Logout</h3>
            <p className="py-4 text-base-content text-sm">Are you sure you want to log out?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setIsLogoutModalOpen(false)}>Cancel</button>
              <button className="btn btn-error" onClick={confirmLogout}>Logout</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setIsLogoutModalOpen(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}

      {/* Owner Notifications Inbox Modal */}
      <OwnerNotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          // Re-fetch fresh count from server when modal closes
          fetchUnreadCount();
        }}
        onCountChange={(count) => setUnreadCount(count)}
      />
    </>
  );
};

export default Navbar;
