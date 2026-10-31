import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const { signupReal } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zone, setZone] = useState('Zone-A');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // Citizen role is enforced
      await signupReal(name, email, password, 'citizen', zone);
      setSuccess(true);
      
      // Redirect to citizen dashboard
      setTimeout(() => {
        navigate('/citizen');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different email address.');
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
          Create Citizen Account
        </h2>
        <p className="mt-2 text-center text-sm text-on-surface-variant">
          Join the smart municipal sustainability network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-container-lowest py-8 px-4 shadow-xl border border-outline-variant/30 sm:rounded-xl sm:px-10">
          
          {error && (
            <div className="mb-md p-sm bg-error-container text-on-error-container rounded-xl text-body-md border border-error/20 text-left">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-md p-sm bg-secondary-container text-on-secondary-container rounded-xl font-bold border border-secondary/20 text-left">
              Registration successful! Redirecting to your dashboard...
            </div>
          )}

          <form className="space-y-md text-left" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block font-label-md text-label-md text-on-surface-variant">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-sm py-sm rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block font-label-md text-label-md text-on-surface-variant">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-sm py-sm rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="e.g. john@example.com"
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-sm py-sm rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant">
                City District Zone
              </label>
              <div className="mt-1">
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full px-sm py-sm rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-body-md"
                >
                  <option value="Zone-A">Zone-A (Central District)</option>
                  <option value="Zone-B">Zone-B (East District)</option>
                  <option value="Zone-C">Zone-C (North Suburbs)</option>
                </select>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">
                Used to show smart bins and report issues in your neighborhood.
              </p>
            </div>

            <div className="pt-xs">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-primary text-white py-md rounded-full font-title-lg text-[16px] hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-xs"
              >
                {loading ? 'Creating Citizen Account...' : 'Sign Up as Citizen'}
                <span className="material-symbols-outlined">person_add</span>
              </button>
            </div>
          </form>

          <div className="mt-md text-center">
            <span className="text-xs text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login?role=citizen" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;
