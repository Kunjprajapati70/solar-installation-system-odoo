import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
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

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const Navbar = ({ toggleSidebar, isSidebarOpen, isCollapsed, toggleCollapse }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const socketCtx = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const notifPanelRef = useRef(null);

  const applyNotificationPayload = (res) => {
    const list = Array.isArray(res?.data) ? res.data : [];
    setNotifications(list);
    setUnreadCount(
      typeof res?.unreadCount === 'number'
        ? res.unreadCount
        : list.filter((n) => !n.isRead).length
    );
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) applyNotificationPayload(res);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const live = socketCtx?.notifications || [];
    if (!live.length) return;
    setNotifications((prev) => {
      const seen = new Set(prev.map((n) => String(n._id)));
      const incoming = live.filter((n) => n?._id && !seen.has(String(n._id)));
      if (!incoming.length) return prev;
      setUnreadCount((count) => count + incoming.filter((n) => !n.isRead).length);
      return [...incoming, ...prev];
    });
  }, [socketCtx?.notifications]);

  useEffect(() => {
    if (!showNotifications) return undefined;
    const onPointerDown = (event) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [showNotifications]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      try {
        await api.put('/notifications/read-all');
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (inner) {
        console.error(inner);
      }
    }
  };

  const openNotification = async (item) => {
    if (!item?._id) return;
    if (!item.isRead) {
      try {
        await api.put(`/notifications/${item._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (err) {
        console.error(err);
      }
    }
    if (item.link) {
      setShowNotifications(false);
      navigate(item.link);
    }
  };

  const roleColors = {
    admin: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    sales: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30',
    technician: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
    customer: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30'
  };

  return (
    <nav className="glass-panel sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Drawer Button & Brand (Mobile only), Status Indicator (Desktop) */}
        <div className="flex items-center space-x-3 min-w-0">
          {/* Mobile Drawer Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent transition shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Mobile Brand Logo */}
          <div className="flex items-center space-x-2 lg:hidden min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-solar-600 to-amber-300 flex items-center justify-center shadow-glow-solar shrink-0">
              <Sun className="w-4 h-4 text-midnight-950 font-bold" />
            </div>
            <span className="font-bold text-sm tracking-tight font-sans text-slate-900 dark:text-white truncate">
              SunPower <span className="gradient-solar-text">Solutions</span>
            </span>
          </div>

          {/* Desktop Operational Status */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Grid Operations Live</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-amber-700 dark:text-solar-400 font-mono text-[11px] font-semibold">{user?.role?.toUpperCase() || 'USER'} WORKSPACE</span>
          </div>
        </div>

        {/* Right: Actions, Notifications, Theme Toggle & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-700/60 transition text-xs shadow-sm"
            title="Global Search across customers, equipment, and orders (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-solar-500 dark:text-solar-400" />
            <span className="hidden md:inline text-slate-500 dark:text-slate-400">Search system...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-mono shadow-sm">
              ⌘K
            </kbd>
          </button>

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-solar-600 border border-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-solar-400 dark:border-slate-700/60 relative group transition shadow-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Light/Dark Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-500 dark:text-amber-400 transition-transform group-hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 dark:text-indigo-400 transition-transform group-hover:-rotate-12" />
            )}
          </button>

          {/* Active Role Badge */}
          {user && (
            <div className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border shadow-sm ${roleColors[user.role] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{user.role}</span>
            </div>
          )}

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifPanelRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-700/60 transition shadow-sm"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-solar-500 text-midnight-950 text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[22rem] sm:w-[26rem] rounded-2xl bg-white dark:bg-midnight-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-transparent">
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Notifications</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {unreadCount} unread · {notifications.length} total
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-solar-600 dark:text-solar-400 hover:text-solar-700 dark:hover:text-solar-300 transition shrink-0"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[28rem] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        type="button"
                        key={n._id || n.title + n.createdAt}
                        onClick={() => openNotification(n)}
                        className={`w-full text-left p-3.5 text-xs transition border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                          !n.isRead ? 'bg-solar-50/70 dark:bg-solar-500/10' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-2.5">
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            ) : n.type === 'warning' || n.type === 'danger' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            ) : (
                              <Info className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`font-semibold leading-snug ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                                {n.title}
                              </p>
                              {!n.isRead && (
                                <span className="mt-1 w-2 h-2 rounded-full bg-solar-500 dark:bg-solar-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                        </div>
                      </button>
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
              className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700/60 transition shadow-sm text-left"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-solar-600 to-amber-400 flex items-center justify-center text-midnight-950 font-bold text-xs">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight capitalize">{user?.role || 'Guest'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-midnight-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold text-solar-600 dark:text-solar-400">
                    Role: {user?.role}
                  </span>
                </div>
                <a
                  href="/profile"
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  onClick={() => setShowUserMenu(false)}
                >
                  <UserIcon className="w-4 h-4 text-solar-500 dark:text-solar-400" />
                  <span>My Account Profile</span>
                </a>
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition mt-1"
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
