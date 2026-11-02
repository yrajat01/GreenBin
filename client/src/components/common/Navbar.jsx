import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import {
  Recycle,
  LayoutDashboard,
  MapPin,
  Award,
  AlertCircle,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  Truck,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!user) {
      return [
        { label: 'Home', path: '/', icon: Recycle },
        { label: 'Leaderboard', path: '/leaderboard', icon: Award },
      ];
    }

    if (user.role === ROLES.ADMIN) {
      return [
        { label: 'Admin Portal', path: '/admin', icon: Shield },
        { label: 'Report Issue', path: '/report', icon: AlertCircle },
        { label: 'Leaderboard', path: '/leaderboard', icon: Award },
      ];
    }

    if (user.role === ROLES.STAFF) {
      return [
        { label: 'Route View', path: '/staff/route', icon: Truck },
        { label: 'Leaderboard', path: '/leaderboard', icon: Award },
      ];
    }

    // Citizen
    return [
      { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
      { label: 'Report Issue', path: '/report', icon: AlertCircle },
      { label: 'Leaderboard', path: '/leaderboard', icon: Award },
    ];
  };

  const navLinks = getNavLinks();

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case ROLES.STAFF:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Recycle className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Green<span className="text-emerald-400">Bin</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block -mt-1">
                Smart Waste Management
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live Socket Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                connected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
              title={connected ? 'Live telemetry connected' : 'Connecting to live telemetry...'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {connected ? 'Live' : 'Offline'}
            </div>

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                {/* Profile Pill */}
                <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 py-1.5 px-3 rounded-2xl">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                      {user.name || user.email?.split('@')[0]}
                    </p>
                    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded border uppercase tracking-wider ${getRoleBadgeStyle(user.role)}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition border border-transparent hover:border-rose-500/20"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-600/20"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}

          {user ? (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{user.name || user.email}</div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-800">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full block text-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;

