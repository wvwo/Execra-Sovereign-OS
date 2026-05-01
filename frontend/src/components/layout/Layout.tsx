import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, Settings, History,
  LogOut, Shield, Zap, Menu, X, Bell, BarChart2,
  BookTemplate, Variable, Clock, ChevronDown, Radio, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { Notification } from '../../types';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: PlusCircle, label: 'New Workflow', path: '/upload' },
  { icon: BarChart2, label: 'Analytics', path: '/analytics' },
  { icon: BookTemplate, label: 'Templates', path: '/templates' },
  { icon: Variable, label: 'Variables', path: '/variables' },
  { icon: Clock, label: 'Scheduler', path: '/schedule' },
  { icon: History, label: 'Audit Logs', path: '/audit' },
  { icon: Radio, label: 'Live Capture', path: '/live-capture' },
  { icon: Zap, label: 'Triggers', path: '/triggers' },
  { icon: EyeOff, label: 'Privacy Shield', path: '/privacy' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent — notifications are non-critical */ }
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const NOTIF_ICONS: Record<string, string> = {
    success: '✅', error: '❌', info: '💡', milestone: '🎉', schedule: '🕐',
  };

  return (
    <div className="flex h-screen bg-[#0B0F14] text-slate-300 overflow-hidden font-sans">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="w-64 bg-slate-900/50 border-r border-white/5 flex flex-col z-50 backdrop-blur-xl shrink-0"
          >
            {/* Logo */}
            <div className="p-6 flex items-center gap-3 border-b border-white/5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-black text-purple-400 tracking-tight">Execra</span>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-sm
                    ${isActive
                      ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                      : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-white/5">
              <div className="bg-slate-800/40 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white uppercase text-xs shrink-0">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user.name || 'User'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email || ''}</p>
                </div>
                <button onClick={handleLogout} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/20 backdrop-blur-md sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400"
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
              Sovereign Environment
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full text-[9px] font-black text-white flex items-center justify-center border-2 border-[#0B0F14]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <p className="text-sm font-black text-white">Notifications</p>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-purple-400 hover:text-purple-300 font-bold">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-slate-600 text-sm text-center py-8">No notifications yet.</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-4 border-b border-white/5 flex gap-3 ${!n.isRead ? 'bg-purple-500/5' : ''}`}
                          >
                            <span className="text-base shrink-0">{NOTIF_ICONS[n.type] || '📋'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                              <p className="text-[10px] text-slate-700 mt-1">
                                {new Date(n.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!n.isRead && (
                              <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-5 w-px bg-white/10" />
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Online</span>
            </div>
          </div>
        </header>

        {/* Click outside to close notifications */}
        {showNotifications && (
          <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
        )}

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
