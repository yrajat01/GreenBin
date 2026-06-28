import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { initiateSocketConnection, disconnectSocket } from '../services/socket';
import MapComponent from '../components/MapComponent';

const CitizenDashboard = () => {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  
  // Quick Report form states
  const [binId, setBinId] = useState('');
  const [issueType, setIssueType] = useState('Foul Smell');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Stats interactive details state
  const [showBinsModal, setShowBinsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Fetch bins
  const fetchBins = async () => {
    try {
      const data = await api.get('/api/bins');
      setBins(data);
    } catch (err) {
      console.error('Error fetching bins:', err);
    }
  };

  // Fetch my reports
  const fetchMyReports = async () => {
    setLoadingReports(true);
    try {
      const data = await api.get('/api/reports/my');
      setMyReports(data);
    } catch (err) {
      console.error('Error fetching my reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchBins();
    fetchMyReports();
    
    // Connect Socket.io client for real-time updates
    const socket = initiateSocketConnection();
    
    socket.on('bin_update', (updatedBin) => {
      console.log('Socket: Bin updated:', updatedBin);
      setBins(prevBins => prevBins.map(b => b.binId === updatedBin.binId ? updatedBin : b));
    });

    socket.on('bin_collected', ({ binId }) => {
      console.log('Socket: Bin collected:', binId);
      fetchBins();
      refreshProfile();
    });

    socket.on('new_report', () => {
      fetchBins();
      refreshProfile();
      fetchMyReports();
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickReportSubmit = async (e) => {
    e.preventDefault();
    if (!binId) {
      setError('Please enter a Bin ID');
      return;
    }
    setError('');
    setSubmitting(true);
    
    try {
      const res = await api.post('/api/reports', {
        binId: binId.toUpperCase().trim(),
        issueType,
        description: notes
      });
      
      setSuccess(true);
      setBinId('');
      setNotes('');
      refreshProfile(); // Refresh points in header
      fetchMyReports(); // Reload my reports!
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Make sure Bin ID is valid (e.g. GB-042).');
    } finally {
      setSubmitting(false);
    }
  };

  // Populate quick report bin code if clicked on map
  const handleBinSelect = (bin) => {
    setSelectedBin(bin);
    setBinId(bin.binId);
  };

  // Filter bins to calculate Bins Nearby (in same Zone-A/B/C as user)
  const nearbyBinsCount = bins.filter(b => b.zone === (user?.zone || 'Zone-A')).length;

  return (
    <div className="flex h-screen overflow-hidden bg-surface font-body-md text-on-surface antialiased text-left">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col h-full py-md px-sm gap-xs bg-primary-container text-primary-fixed docked w-64 border-r border-outline-variant">
        <Link to="/" className="flex items-center gap-sm mb-lg px-xs hover:opacity-90">
          <svg className="h-10 w-10 text-secondary-fixed" viewBox="0 0 30 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L4.5 9C4.5 9 3 11.5 3 15C3 18.5 5.5 21 9 21C11.5 21 13.5 19.5 15 17.5C16.5 19.5 18.5 21 21 21C24.5 21 27 18.5 27 15C27 11.5 25.5 9 25.5 9L18 2" />
            <path d="M12 2C12 2 13.5 4.5 13.5 8C13.5 11.5 12 14 12 14" stroke="#4CAF50" />
            <path d="M12 22V14" />
          </svg>
          <div className="flex flex-col text-left text-primary-fixed">
            <span className="font-title-lg text-title-lg font-black text-secondary-fixed">GreenBin</span>
            <span className="font-label-md text-label-md text-on-primary-container opacity-80 uppercase tracking-widest">Citizen App</span>
          </div>
        </Link>
        
        <nav className="flex-grow space-y-base">
          <Link className="flex items-center gap-sm bg-primary-fixed text-on-primary-fixed rounded-xl px-sm py-xs border-l-4 border-secondary transition-all translate-x-1 font-semibold" to="/citizen">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md">Dashboard</span>
          </Link>
          <Link className="flex items-center gap-sm text-primary-fixed hover:text-white hover:bg-on-primary-fixed-variant transition-all px-sm py-xs rounded-xl" to="/report">
            <span className="material-symbols-outlined">report_problem</span>
            <span className="font-label-md text-label-md">Report Issue</span>
          </Link>
          <Link className="flex items-center gap-sm text-primary-fixed hover:text-white hover:bg-on-primary-fixed-variant transition-all px-sm py-xs rounded-xl" to="/leaderboard">
            <span className="material-symbols-outlined">leaderboard</span>
            <span className="font-label-md text-label-md">Leaderboard</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-sm text-primary-fixed hover:text-white hover:bg-on-primary-fixed-variant transition-all px-sm py-xs rounded-xl mt-xl text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Logout</span>
          </button>
        </nav>

        {/* User Info Anchor */}
        <div className="mt-auto p-sm bg-on-primary-fixed-variant rounded-xl flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full border-2 border-secondary-fixed overflow-hidden bg-surface-variant flex items-center justify-center text-white font-bold bg-primary text-lg">
            {user?.name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-label-md text-label-md text-secondary-fixed">{user?.name || 'Citizen'}</span>
            <span className="font-mono-data text-mono-data text-primary-fixed">{user?.points || 0} pts 🌿</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        
        {/* Top App Bar / Stats */}
        <header className="w-full px-margin-desktop py-md flex flex-wrap items-center justify-between gap-md border-b border-outline-variant/20 bg-surface-container-lowest">
          <div className="flex-grow text-left">
            <h1 className="font-headline-md text-headline-md text-on-surface">Citizen Dashboard</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Welcome back, {user?.name || 'Citizen'}. Let's keep our city clean.</p>
          </div>
          
          {/* Stats cards */}
          <div className="flex gap-gutter items-center">
            <div 
              onClick={() => setShowBinsModal(true)}
              className="bg-surface-container border border-outline-variant p-sm px-md rounded-xl shadow-sm flex items-center gap-sm cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <div className="p-xs bg-secondary-container rounded-lg">
                <span className="material-symbols-outlined text-on-secondary-container">delete</span>
              </div>
              <div className="text-left">
                <p className="font-label-md text-label-md text-on-surface-variant">Bins Nearby</p>
                <p className="font-title-lg text-title-lg text-on-surface">{nearbyBinsCount}</p>
              </div>
            </div>
            <div 
              onClick={() => { setShowReportsModal(true); fetchMyReports(); }}
              className="bg-surface-container border border-outline-variant p-sm px-md rounded-xl shadow-sm flex items-center gap-sm cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <div className="p-xs bg-tertiary-container text-on-tertiary-container rounded-lg">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div className="text-left">
                <p className="font-label-md text-label-md text-on-surface-variant">My Reports</p>
                <p className="font-title-lg text-title-lg text-on-surface">{user?.reportCount || 0}</p>
              </div>
            </div>
            <div className="bg-primary-container p-sm px-md rounded-xl shadow-sm flex items-center gap-sm border border-primary">
              <div className="p-xs bg-secondary-fixed rounded-lg">
                <span className="material-symbols-outlined text-on-secondary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              </div>
              <div className="text-left">
                <p className="font-label-md text-label-md text-primary-fixed opacity-80">Points Earned</p>
                <p className="font-title-lg text-title-lg text-primary-fixed">{user?.points || 0} 🌿</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content Grid */}
        <div className="flex-1 overflow-y-auto px-margin-desktop py-md custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter h-full">
            
            {/* Interactive Map Component */}
            <div className="lg:col-span-8 flex flex-col gap-sm h-full min-h-[500px]">
              <div className="flex items-center justify-between">
                <h3 className="font-title-lg text-title-lg flex items-center gap-xs text-primary font-bold">
                  <span className="material-symbols-outlined text-primary">map</span>
                  Smart Bin Map ({user?.zone || 'All Zones'})
                </h3>
                <div className="flex gap-xs">
                  <span className="flex items-center gap-1 font-label-md text-label-md px-xs py-1 bg-surface-container-high rounded-full"><span className="w-2 h-2 rounded-full bg-secondary"></span> &lt;60%</span>
                  <span className="flex items-center gap-1 font-label-md text-label-md px-xs py-1 bg-surface-container-high rounded-full"><span className="w-2 h-2 rounded-full bg-[#FFA000]"></span> 60%-90%</span>
                  <span className="flex items-center gap-1 font-label-md text-label-md px-xs py-1 bg-surface-container-high rounded-full"><span className="w-2 h-2 rounded-full bg-error"></span> 90%+</span>
                  <span className="flex items-center gap-1 font-label-md text-label-md px-xs py-1 bg-surface-container-high rounded-full"><span className="w-2 h-2 rounded-full bg-tertiary"></span> Smell Alert</span>
                </div>
              </div>
              
              {/* Map Container wrapper */}
              <div className="relative flex-grow min-h-[400px] rounded-xl border border-outline-variant overflow-hidden shadow-sm bg-surface-container-lowest h-[85%]">
                <MapComponent 
                  bins={bins} 
                  onBinSelect={handleBinSelect} 
                  selectedBin={selectedBin} 
                />
              </div>
            </div>

            {/* Quick Report Panel */}
            <div className="lg:col-span-4 flex flex-col gap-gutter">
              <section className="bg-surface-container-low border border-outline-variant rounded-xl p-md shadow-sm text-left">
                <h3 className="font-title-lg text-title-lg mb-md flex items-center gap-sm text-primary font-bold">
                  <span className="material-symbols-outlined">report_problem</span>
                  Quick Report
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                  Notice something wrong? Select a bin on the map or enter its code below to earn clean-up points.
                </p>

                {success && (
                  <div className="mb-md p-sm bg-secondary-container text-on-secondary-container rounded-xl font-bold flex items-center gap-xs border border-secondary/20">
                    <span className="material-symbols-outlined">check_circle</span>
                    Report submitted! +10 points awarded! 🌿
                  </div>
                )}
                {error && (
                  <div className="mb-md p-sm bg-error-container text-on-error-container rounded-xl text-xs border border-error/20">
                    {error}
                  </div>
                )}

                <form className="space-y-md" onSubmit={handleQuickReportSubmit}>
                  <div className="space-y-base">
                    <label className="block font-label-md text-label-md text-on-surface ml-base">Bin ID / Location Code</label>
                    <input 
                      className="w-full px-sm py-sm rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-mono-data"
                      placeholder="e.g. GB-042" 
                      type="text"
                      value={binId}
                      onChange={(e) => setBinId(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-base">
                    <label className="block font-label-md text-label-md text-on-surface ml-base">Issue Type</label>
                    <select 
                      className="w-full px-sm py-sm rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-body-md"
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                    >
                      <option value="Foul Smell">Foul Smell</option>
                      <option value="Overflow">Overflow</option>
                      <option value="Damage/Vandalism">Damage/Vandalism</option>
                      <option value="Missed Collection">Missed Collection</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="space-y-base">
                    <label className="block font-label-md text-label-md text-on-surface ml-base">Notes (Optional)</label>
                    <textarea 
                      className="w-full px-sm py-sm rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-body-md" 
                      placeholder="Describe the issue details..." 
                      rows="3"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <button 
                    className="w-full bg-primary text-on-primary py-md rounded-full font-title-lg text-[16px] hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-sm" 
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </form>
              </section>

              {/* Rewards Banner */}
              <section className="bg-primary-container p-md rounded-xl text-primary-fixed border border-primary/20 relative overflow-hidden text-left shadow-sm">
                <div className="relative z-10">
                  <h4 className="font-title-lg text-title-lg mb-sm font-bold flex items-center gap-xs">
                    Rewards Tip 🌿
                  </h4>
                  <p className="font-body-md text-body-md opacity-90">
                    Reporting a smelly or overflowing bin helps our routing AI optimize paths, reducing municipal carbon emissions by up to 30%.
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                </div>
              </section>
            </div>

          </div>
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container border-t border-outline-variant flex justify-around items-center py-sm px-gutter z-50 shadow-lg">
        <Link className="flex flex-col items-center gap-1 text-primary" to="/citizen">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <span className="font-label-md text-[10px]">Dashboard</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-on-surface-variant" to="/report">
          <span className="material-symbols-outlined">report_problem</span>
          <span className="font-label-md text-[10px]">Report</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 text-on-surface-variant" to="/leaderboard">
          <span className="material-symbols-outlined">leaderboard</span>
          <span className="font-label-md text-[10px]">Rank</span>
        </Link>
        <button className="flex flex-col items-center gap-1 text-on-surface-variant" onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-md text-[10px]">Logout</span>
        </button>
      </nav>

      {/* Bins Nearby Modal */}
      {showBinsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <header className="p-md border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low text-left">
              <div>
                <h3 className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-xs">
                  <span className="material-symbols-outlined">delete</span>
                  Bins Near My Location ({user?.zone || 'Zone-A'})
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Check fill levels and active complaints in your district.</p>
              </div>
              <button 
                onClick={() => setShowBinsModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            
            <main className="p-md overflow-y-auto flex-1 text-left">
              {bins.filter(b => b.zone === (user?.zone || 'Zone-A')).length === 0 ? (
                <p className="text-center py-lg text-on-surface-variant italic">No bins found in your current zone.</p>
              ) : (
                <div className="space-y-sm">
                  {bins.filter(b => b.zone === (user?.zone || 'Zone-A')).map(bin => {
                    let statusLabel = 'Normal';
                    let statusColor = 'bg-secondary';
                    
                    if (bin.status === 'smell_reported') {
                      statusLabel = 'Complaint Registered';
                      statusColor = 'bg-tertiary';
                    } else if (bin.fillLevel <= 10) {
                      statusLabel = 'Empty';
                      statusColor = 'bg-secondary';
                    } else if (bin.status === 'critical' || bin.fillLevel >= 90) {
                      statusLabel = 'Overflowing';
                      statusColor = 'bg-error';
                    } else if (bin.status === 'warning' || bin.fillLevel >= 60) {
                      statusLabel = 'Near Capacity';
                      statusColor = 'bg-[#FFA000]';
                    }
                    
                    return (
                      <div key={bin.binId} className="flex flex-col md:flex-row md:items-center justify-between gap-sm p-sm rounded-xl bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 transition-colors">
                        <div className="flex gap-sm items-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold font-mono-data text-xs ${statusColor}`}>
                            #{bin.binId.split('-')[1] || bin.binId}
                          </div>
                          <div>
                            <h4 className="font-bold text-on-surface text-sm">#{bin.binId}</h4>
                            <p className="text-xs text-on-surface-variant">{bin.location.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-md justify-between md:justify-end">
                          <div className="text-right">
                            <span className={`px-xs py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider ${statusColor}`}>
                              {statusLabel}
                            </span>
                            <div className="flex items-center gap-xs mt-1">
                              <div className="w-16 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${statusColor}`} style={{ width: `${bin.fillLevel}%` }}></div>
                              </div>
                              <span className="text-xs font-mono-data font-bold text-on-surface">{bin.fillLevel}%</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              handleBinSelect(bin);
                              setShowBinsModal(false);
                            }}
                            className="px-sm py-1 bg-primary text-white rounded-full text-xs font-bold hover:bg-opacity-95 transition-all"
                          >
                            Report
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
            
            <footer className="p-sm bg-surface-container-low border-t border-outline-variant/30 flex justify-end">
              <button 
                onClick={() => setShowBinsModal(false)}
                className="px-md py-sm bg-outline text-white hover:bg-opacity-90 font-label-md rounded-full transition-colors"
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* My Reports Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <header className="p-md border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low text-left">
              <div>
                <h3 className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-xs">
                  <span className="material-symbols-outlined">description</span>
                  My Filed Reports
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Review status and resolution updates for your tickets.</p>
              </div>
              <button 
                onClick={() => setShowReportsModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>
            
            <main className="p-md overflow-y-auto flex-1 text-left">
              {loadingReports ? (
                <div className="py-xl text-center text-on-surface-variant animate-pulse font-label-md">Loading tickets...</div>
              ) : myReports.length === 0 ? (
                <p className="text-center py-lg text-on-surface-variant italic">You have not submitted any reports yet.</p>
              ) : (
                <div className="space-y-sm">
                  {myReports.map(report => {
                    const isPending = report.status === 'pending';
                    const badgeColor = isPending ? 'bg-[#FFA000]' : 'bg-secondary';
                    const dateStr = new Date(report.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <div key={report.reportId} className="p-sm rounded-xl bg-surface-container-low border border-outline-variant/30 text-left">
                        <div className="flex justify-between items-start mb-xs">
                          <div>
                            <span className="font-mono-data text-[10px] text-outline uppercase tracking-wider block">Ticket #{report.reportId}</span>
                            <h4 className="font-bold text-on-surface text-sm mt-0.5">Bin #{report.binId} &bull; {report.issueType}</h4>
                          </div>
                          <span className={`px-xs py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider ${badgeColor}`}>
                            {isPending ? 'Under Assistance' : 'Resolved'}
                          </span>
                        </div>
                        
                        {report.description && (
                          <p className="text-xs text-on-surface-variant bg-surface-container p-xs rounded-lg mt-xs">
                            <span className="font-bold">My Note:</span> {report.description}
                          </p>
                        )}
                        
                        {report.notes && (
                          <p className="text-xs text-primary bg-primary-container/10 p-xs rounded-lg mt-xs border border-primary/10">
                            <span className="font-bold text-primary">Resolution Note:</span> {report.notes}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center text-[10px] text-outline mt-sm border-t border-outline-variant/10 pt-xs">
                          <span>Filed: {dateStr}</span>
                          {!isPending && report.resolvedAt && (
                            <span>Resolved: {new Date(report.resolvedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
            
            <footer className="p-sm bg-surface-container-low border-t border-outline-variant/30 flex justify-end">
              <button 
                onClick={() => setShowReportsModal(false)}
                className="px-md py-sm bg-outline text-white hover:bg-opacity-90 font-label-md rounded-full transition-colors"
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

    </div>
  );
};

export default CitizenDashboard;
