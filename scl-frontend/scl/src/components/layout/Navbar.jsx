import { Bell, Menu, User } from "lucide-react";
import { Button } from "../ui/Button";

export function Navbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-slate-900">Alex Student</span>
            <span className="text-xs text-slate-500">alex@university.edu</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
