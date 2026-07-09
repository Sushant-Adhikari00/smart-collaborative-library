import { Link, useLocation } from "react-router-dom";
import { cn } from "../../utils/cn";
import { LayoutDashboard, FileText, Search, Users, Settings, LogOut } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Search", href: "/search", icon: Search },
  { name: "Collab", href: "/collab", icon: Users },
];

export function Sidebar({ className }) {
  const location = useLocation();

  return (
    <div className={cn("flex h-full w-64 flex-col bg-primary-950 text-white", className)}>
      <div className="flex h-16 items-center px-6 border-b border-primary-900">
        <div className="flex items-center gap-2 text-xl font-display font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-white">
            <span className="text-lg">S</span>
          </div>
          <span>SCL Platform</span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-800 text-white"
                    : "text-primary-100 hover:bg-primary-900 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-accent-400" : "text-primary-300 group-hover:text-accent-400"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 pt-6 border-t border-primary-900">
          <Link
            to="/settings"
            className="group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-primary-100 hover:bg-primary-900 hover:text-white transition-colors"
          >
            <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-primary-300 group-hover:text-white" />
            Settings
          </Link>
          <button
            className="w-full group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-primary-100 hover:bg-primary-900 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-primary-300 group-hover:text-white" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
