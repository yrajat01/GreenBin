import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Leaderboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [leaderboardData, setLeaderboardData] = useState({ global: [], zones: {} });
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'zones'
  const [activeZone, setActiveZone] = useState('Zone-A');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const data = await api.get('/api/leaderboard');
      setLeaderboardData(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getActiveList = () => {
    if (activeTab === 'global') {
      return leaderboardData.global || [];
    }
    return leaderboardData.zones?.[activeZone] || [];
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex text-left">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col h-screen left-0 w-64 bg-surface-container-low border-r border-outline-variant py-md px-sm gap-xs shrink-0">
        <Link to="/" className="flex flex-col gap-base mb-lg px-sm hover:opacity-85 transition-opacity">
          <span className="font-title-lg text-title-lg font-black text-primary">Smart Waste</span>
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Operator Portal</span>
        </Link>
        <nav className="flex flex-col gap-xs flex-1">
          <Link className="flex items-center gap-sm text-on-surface-variant px-sm py-xs hover:bg-surface-variant transition-all rounded-xl" to="/citizen">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md">Dashboard</span>
          </Link>
          <Link className="flex items-center gap-sm text-on-surface-variant px-sm py-xs hover:bg-surface-variant transition-all rounded-xl" to="/report">
            <span className="material-symbols-outlined">report_problem</span>
            <span className="font-label-md text-label-md">Report Issue</span>
          </Link>
          <Link className="flex items-center gap-sm bg-primary-container text-on-primary-container rounded-xl px-sm py-xs border-l-4 border-primary transition-all translate-x-1 font-semibold" to="/leaderboard">
            <span className="material-symbols-outlined">leaderboard</span>
            <span className="font-label-md text-label-md">Leaderboard</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-sm text-on-surface-variant px-sm py-xs hover:bg-surface-variant transition-all rounded-xl mt-xl text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto px-margin-mobile md:px-margin-desktop py-md">
        
        {/* Header Section */}
        <div className="mb-lg flex justify-between items-start flex-wrap gap-sm">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs font-bold">Community Leaderboard</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Honoring our most active citizens in keeping our city districts clean.</p>
          </div>
          
          {/* Quick tabs */}
          <div className="flex bg-surface-container rounded-xl p-1 border border-outline-variant/30">
            <button
              onClick={() => setActiveTab('global')}
              className={`px-md py-xs rounded-lg font-label-md text-xs transition-colors ${
                activeTab === 'global' ? 'bg-primary text-white font-bold' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Global Rank
            </button>
            <button
              onClick={() => setActiveTab('zones')}
              className={`px-md py-xs rounded-lg font-label-md text-xs transition-colors ${
                activeTab === 'zones' ? 'bg-primary text-white font-bold' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Zone Rank
            </button>
          </div>
        </div>

        {/* Zone sub-tabs if activeTab === 'zones' */}
        {activeTab === 'zones' && (
          <div className="flex gap-sm mb-md border-b border-outline-variant/30 pb-xs">
            {['Zone-A', 'Zone-B', 'Zone-C'].map(zone => (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                className={`pb-xs px-sm font-label-md text-xs border-b-2 transition-all ${
                  activeZone === zone ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        )}

        {/* Rankings Table */}
        <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-xl text-center text-on-surface-variant animate-pulse">Loading rankings...</div>
          ) : getActiveList().length === 0 ? (
            <div className="py-xl text-center text-on-surface-variant">No citizen profiles found in this selection.</div>
          ) : (
            <table className="min-w-full divide-y divide-outline-variant/20 text-left">
              <thead className="bg-surface-container-high">
                <tr>
                  <th scope="col" className="px-md py-sm text-left font-label-md text-[11px] text-outline uppercase tracking-wider">Rank</th>
                  <th scope="col" className="px-md py-sm text-left font-label-md text-[11px] text-outline uppercase tracking-wider">Citizen</th>
                  {activeTab === 'global' && (
                    <th scope="col" className="px-md py-sm text-left font-label-md text-[11px] text-outline uppercase tracking-wider">Zone</th>
                  )}
                  <th scope="col" className="px-md py-sm text-left font-label-md text-[11px] text-outline uppercase tracking-wider">Reports</th>
                  <th scope="col" className="px-md py-sm text-left font-label-md text-[11px] text-outline uppercase tracking-wider">Badges</th>
                  <th scope="col" className="px-md py-sm text-right font-label-md text-[11px] text-outline uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 bg-white">
                {getActiveList().map((citizen, idx) => (
                  <tr 
                    key={citizen.uid} 
                    className="hover:bg-surface-variant/20 transition-colors group relative cursor-pointer"
                  >
                    {/* Rank Badge */}
                    <td className="px-md py-sm whitespace-nowrap font-bold text-on-surface text-sm">
                      <div className="flex items-center gap-xs">
                        <span className="w-1 group-hover:bg-primary h-full absolute left-0 top-0 transition-all"></span>
                        {idx === 0 ? '🏆 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                      </div>
                    </td>
                    
                    {/* Citizen Info */}
                    <td className="px-md py-sm whitespace-nowrap">
                      <div className="flex items-center gap-sm">
                        <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs uppercase">
                          {citizen.name.charAt(0)}
                        </div>
                        <span className="font-bold text-on-surface text-sm">{citizen.name}</span>
                      </div>
                    </td>
                    
                    {/* Zone (for Global rank) */}
                    {activeTab === 'global' && (
                      <td className="px-md py-sm whitespace-nowrap text-on-surface-variant text-sm">
                        {citizen.zone}
                      </td>
                    )}
                    
                    {/* Reports count */}
                    <td className="px-md py-sm whitespace-nowrap text-on-surface-variant text-sm font-mono-data">
                      {citizen.reportCount || 0} reports
                    </td>
                    
                    {/* Badges */}
                    <td className="px-md py-sm whitespace-nowrap">
                      <div className="flex flex-wrap gap-xs">
                        {citizen.badgesEarned && citizen.badgesEarned.length > 0 ? (
                          citizen.badgesEarned.map(badge => (
                            <span 
                              key={badge}
                              className="px-xs py-0.5 rounded-full text-[9px] font-bold bg-primary-container text-on-primary-container border border-primary/20 uppercase"
                            >
                              {badge}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-outline italic">No badges</span>
                        )}
                      </div>
                    </td>
                    
                    {/* Points */}
                    <td className="px-md py-sm whitespace-nowrap text-right text-sm font-black text-primary font-mono-data">
                      {citizen.points} 🌿
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

    </div>
  );
};

export default Leaderboard;
