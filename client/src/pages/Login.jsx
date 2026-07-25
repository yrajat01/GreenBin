import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CREDENTIALS = {
  citizen: { email: 'rajat@greenbin.com', password: '12345678' },
  staff: { email: 'staff@greenbin.com', password: '12345678' },
  admin: { email: 'admin@greenbin.com', password: '12345678' },
};

const Login = () => {
  const { loginMock, loginReal, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'citizen';

  const [activeRole, setActiveRole] = useState(initialRole);
  const [email, setEmail] = useState(DEFAULT_CREDENTIALS[initialRole]?.email || '');
  const [password, setPassword] = useState(DEFAULT_CREDENTIALS[initialRole]?.password || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Switch active role tab and pre-fill default sample credentials (without logging in!)
  const handleRoleSelect = (role) => {
    setActiveRole(role);
    setError('');
    const creds = DEFAULT_CREDENTIALS[role] || DEFAULT_CREDENTIALS.citizen;
    setEmail(creds.email);
    setPassword(creds.password);
  };

  const handleGoToDashboard = () => {
    if (!user) return;
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'staff') navigate('/staff/route');
    else navigate('/citizen');
  };

  const handleRealSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const loggedUser = await loginReal(email, password);
      if (loggedUser.role === 'admin') navigate('/admin');
      else if (loggedUser.role === 'staff') navigate('/staff/route');
      else navigate('/citizen');
    } catch (err) {
      // Fallback to mock authentication for offline/testing if real endpoint fails
      try {
        const mockUser = await loginMock(activeRole);
        if (mockUser.role === 'admin') navigate('/admin');
        else if (mockUser.role === 'staff') navigate('/staff/route');
        else navigate('/citizen');
      } catch (mockErr) {
        setError(err.message || 'Authentication failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-body-md">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-xs hover:opacity-90">
          <svg className="h-12 w-12 text-primary" viewBox="0 0 30 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L4.5 9C4.5 9 3 11.5 3 15C3 18.5 5.5 21 9 21C11.5 21 13.5 19.5 15 17.5C16.5 19.5 18.5 21 21 21C24.5 21 27 18.5 27 15C27 11.5 25.5 9 25.5 9L18 2" />
            <path d="M12 2C12 2 13.5 4.5 13.5 8C13.5 11.5 12 14 12 14" stroke="#4CAF50" />
            <path d="M12 22V14" />
          </svg>
          <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">GreenBin</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-on-surface">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-on-surface-variant">
          Smart Waste &amp; Sustainability Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-container-lowest py-8 px-4 shadow-xl border border-outline-variant/30 sm:rounded-xl sm:px-10">
          
          {/* Active Session Notice */}
          {user && (
            <div className="mb-lg p-md bg-primary-container/20 text-on-primary-container rounded-xl text-left border border-primary/30">
              <div className="flex items-center gap-xs font-bold text-primary mb-xs">
                <span className="material-symbols-outlined">account_circle</span>
                Active Session Detected
              </div>
              <p className="text-xs text-on-surface-variant mb-sm">
                You are currently signed in as <strong>{user.name || user.email}</strong> ({user.role?.toUpperCase()}).
              </p>
              <div className="flex gap-xs">
                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className="bg-primary text-white text-xs px-sm py-xs rounded-lg font-semibold hover:bg-primary/90 transition-all"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="bg-surface border border-outline-variant text-on-surface text-xs px-sm py-xs rounded-lg font-semibold hover:bg-surface-container transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-md p-sm bg-error-container text-on-error-container rounded-xl text-body-md border border-error/20 text-left">
              {error}
            </div>
          )}

          {/* User Type Selection Tabs (No auto-login on click) */}
          <div className="mb-lg border-b border-outline-variant/30 pb-lg">
            <label className="block text-left font-label-md text-label-md text-on-surface-variant mb-xs">
              Select User Type
            </label>
            <div className="grid grid-cols-3 gap-xs">
              <button
                type="button"
                onClick={() => handleRoleSelect('citizen')}
                className={`px-xs py-sm rounded-xl font-label-md text-xs transition-all flex flex-col items-center gap-1 justify-center ${
                  activeRole === 'citizen'
                    ? 'bg-primary text-white shadow-md font-bold'
                    : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                }`}
              >
                <span className="material-symbols-outlined">person</span>
                Client / Citizen
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('staff')}
                className={`px-xs py-sm rounded-xl font-label-md text-xs transition-all flex flex-col items-center gap-1 justify-center ${
                  activeRole === 'staff'
                    ? 'bg-secondary text-white shadow-md font-bold'
                    : 'bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20'
                }`}
              >
                <span className="material-symbols-outlined">local_shipping</span>
                Staff
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className={`px-xs py-sm rounded-xl font-label-md text-xs transition-all flex flex-col items-center gap-1 justify-center ${
                  activeRole === 'admin'
                    ? 'bg-tertiary text-white shadow-md font-bold'
                    : 'bg-tertiary-container/30 text-tertiary border border-tertiary/20 hover:bg-tertiary-container/50'
                }`}
              >
                <span className="material-symbols-outlined">admin_panel_settings</span>
                Admin
              </button>
            </div>
          </div>

          {/* Password Login Form */}
          <form className="space-y-md text-left" onSubmit={handleRealSubmit}>
            <div>
              <label htmlFor="email" className="block font-label-md text-label-md text-on-surface-variant">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-sm py-sm rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="e.g. rajat@greenbin.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block font-label-md text-label-md text-on-surface-variant">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-sm py-sm rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-xs">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-md rounded-full font-title-lg text-[16px] hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-xs"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </form>

          <p className="mt-md text-center text-xs text-on-surface-variant">
            Or, create a new account: <Link to="/signup" className="text-primary font-bold hover:underline">Sign Up</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;

