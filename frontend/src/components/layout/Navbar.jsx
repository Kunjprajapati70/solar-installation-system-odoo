import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Sun,
  Moon,
  Bell,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  ChevronDown,
  Search,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import api from '../../api/client';
import GlobalSearchModal from './GlobalSearchModal';

const Navbar = ({ toggleSidebar, isSidebarOpen, isCollapsed, toggleCollapse }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.success) {
          setNotifications(res.data);
          setUnreadCount(res.unreadCount);
        }
      } catch (err) {
        // quiet error
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const roleColors = {
    admin: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    sales: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    technician: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    customer: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  };

  return (
    <nav className="glass-panel sticky top-0 z-20 border-b border-slate-800/80 px-4 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Drawer Button & Brand (Mobile only), Status Indicator (Desktop) */}
        <div className="flex items-center space-x-3 min-w-0">
          {/* Mobile Drawer Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Mobile Brand Logo */}
          <div className="flex items-center space-x-2 lg:hidden min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-solar-600 to-amber-300 flex items-center justify-center shadow-glow-solar shrink-0">
              <Sun className="w-4 h-4 text-midnight-950 font-bold" />
            </div>
            <span className="font-bold text-sm tracking-tight font-sans text-white truncate">
              SunPower <span className="gradient-solar-text">Solutions</span>
            </span>
          </div>

          {/* Desktop Operational Status */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-300 font-medium">Grid Operations Live</span>
            <span className="text-slate-600">•</span>
            <span className="text-solar-400 font-mono text-[11px] font-semibold">{user?.role?.toUpperCase() || 'USER'} WORKSPACE</span>
          </div>
        </div>

        {/* Right: Actions, Notifications, Theme Toggle & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition border border-slate-700/60 text-xs"
            title="Global Search across customers, equipment, and orders (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-solar-400" />
            <span className="hidden md:inline text-slate-400">Search system...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-500 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-solar-400 transition border border-slate-700/60 relative group"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Light/Dark Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400 transition-transform group-hover:-rotate-12" />
            )}
          </button>

          {/* Active Role Badge */}
          {user && (
            <div className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${roleColors[user.role] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{user.role}</span>
            </div>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-solar-500 text-midnight-950 text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl glass-card border border-slate-700/80 shadow-2xl py-3 z-50">
                <div className="px-4 pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-200">System Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-solar-400 hover:text-solar-300 transition"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div
                        key={idx}
                        className={`p-3 text-xs transition hover:bg-slate-800/40 ${!n.isRead ? 'bg-solar-500/5' : ''}`}
                      >
                        <div className="flex items-start space-x-2.5">
                          <div className="mt-0.5">
                            {n.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : n.type === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Info className="w-4 h-4 text-sky-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-200">{n.title}</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition border border-slate-700/60 text-left"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-solar-600 to-amber-400 flex items-center justify-center text-midnight-950 font-bold text-xs">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 leading-tight capitalize">{user?.role || 'Guest'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl glass-card border border-slate-700/80 shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-white">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold text-solar-400">
                    Role: {user?.role}
                  </span>
                </div>
                <a
                  href="/profile"
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 transition"
                  onClick={() => setShowUserMenu(false)}
                >
                  <UserIcon className="w-4 h-4 text-solar-400" />
                  <span>My Account Profile</span>
                </a>
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
