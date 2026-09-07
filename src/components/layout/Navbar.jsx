import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar = ({
  toggleSidebar,
  isMobile,
  sidebarOpen,
  isDesktopSidebarExpanded,
}) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    setOpenDropdown(false);
    try {
      await logout();
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('user');
    }
    navigate('/login');
  };

  const isSidebarOpen = isMobile ? sidebarOpen : isDesktopSidebarExpanded;
  const displayName = user?.username || localStorage.getItem('username') || 'Admin';
  const initial = String(displayName).charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-40 h-14 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-full items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 rounded-md focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-500 text-white shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div className="text-left leading-tight">
              <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                OOMS <span className="font-normal text-slate-500 dark:text-slate-400">Admin</span>
              </p>
              <p className="hidden text-[10px] uppercase tracking-[0.14em] text-slate-400 sm:block">
                Control panel
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-sky-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-sky-300 dark:ring-slate-700">
                {initial}
              </div>
              <div className="hidden text-left md:block">
                <p className="max-w-[10rem] truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{displayName}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Administrator</p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 md:block" />
            </button>

            {openDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(false)} />
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{displayName}</p>
                    <p className="text-xs text-slate-500">Platform administrator</p>
                  </div>
                  <button
                    onClick={() => { setOpenDropdown(false); navigate('/profile'); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => { setOpenDropdown(false); navigate('/settings'); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    Settings
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
