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
    <nav className="sticky top-0 z-40 h-14 border-b border-admin-border bg-admin-surface">
      <div className="flex h-full items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-admin-muted transition-colors hover:bg-admin-raised hover:text-admin-text"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 rounded-lg focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <div className="text-left leading-tight">
              <p className="text-sm font-bold tracking-tight text-admin-text">
                OOMS{' '}
                <span className="font-medium text-admin-muted">Admin</span>
              </p>
              <p className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-admin-muted sm:block">
                Control panel
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-admin-muted transition-colors hover:bg-admin-raised hover:text-admin-text"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setOpenDropdown(!openDropdown)}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-admin-raised"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-admin-accent-soft text-xs font-bold text-admin-accent-text ring-1 ring-admin-border">
                {initial}
              </div>
              <div className="hidden text-left md:block">
                <p className="max-w-[10rem] truncate text-xs font-semibold text-admin-text">
                  {displayName}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-admin-muted">
                  Administrator
                </p>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-admin-muted md:block" />
            </button>

            {openDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(false)} />
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-admin-border bg-admin-surface shadow-panel">
                  <div className="border-b border-admin-border bg-admin-raised px-4 py-3">
                    <p className="truncate text-sm font-semibold text-admin-text">
                      {displayName}
                    </p>
                    <p className="text-xs text-admin-muted">Platform administrator</p>
                  </div>
                  <button
                    onClick={() => {
                      setOpenDropdown(false);
                      navigate('/profile');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-admin-text-sub transition-colors hover:bg-admin-raised"
                  >
                    <User className="h-4 w-4 text-admin-muted" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setOpenDropdown(false);
                      navigate('/settings');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-admin-text-sub transition-colors hover:bg-admin-raised"
                  >
                    <Settings className="h-4 w-4 text-admin-muted" />
                    Settings
                  </button>
                  <div className="my-1 border-t border-admin-border" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
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
