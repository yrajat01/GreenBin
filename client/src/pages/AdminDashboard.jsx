import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { initiateSocketConnection, disconnectSocket } from '../services/socket';
import MapComponent from '../components/MapComponent';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [bins, setBins] = useState([]);
  const [reports, setReports] = useState([]);
  const [routeDetails, setRouteDetails] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [selectedZone, setSelectedZone] = useState('All Zones');
  
  // Stats
  const [kpis, setKpis] = useState({
    totalBins: 0,
    criticalBins: 0,
    smellReports: 0,
    collectedToday: 14
  });

  // Fetch initial data
  const fetchData = async () => {
    try {
      const binsData = await api.get('/api/bins');
      setBins(binsData);
      
      const reportsData = await api.get('/api/reports');
      setReports(reportsData);

      // Check if there is already a pending generated route to display
      const currentRouteRes = await api.get('/api/route/current').catch(() => null);
      if (currentRouteRes && currentRouteRes.route && currentRouteRes.bins) {
        setRouteDetails(currentRouteRes);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Connect Socket.io client
    const socket = initiateSocketConnection();

    socket.on('bin_update', (updatedBin) => {
      console.log('Admin Socket: Bin updated:', updatedBin);
      setBins(prevBins => prevBins.map(b => b.binId === updatedBin.binId ? updatedBin : b));
    });

    socket.on('new_report', ({ report }) => {
      console.log('Admin Socket: New report:', report);
      setReports(prev => [report, ...prev]);
      
      // Add notification
      const alertMsg = {
        id: `${report.reportId}-${Date.now()}`,
        message: `New Smell Alert on Bin #${report.binId}!`,
        timestamp: new Date()
      };
      setNotifications(prev => [alertMsg, ...prev]);
    });

    socket.on('admin_notification', (alertMsg) => {
      console.log('Admin Socket: Critical bin alert:', alertMsg);
      setNotifications(prev => [alertMsg, ...prev]);
      fetchData(); // Reload stats and list
    });

    socket.on('bin_collected', ({ binId, staffName }) => {
      console.log('Admin Socket: Bin collected:', binId, staffName);
      fetchData();
      
      const collectionAlert = {
        id: `collect-${binId}-${Date.now()}`,
        message: `Staff ${staffName} collected Bin #${binId}.`,
        timestamp: new Date()
      };
      setNotifications(prev => [collectionAlert, ...prev]);
    });

    socket.on('route_generated', (data) => {
      console.log('Admin Socket: Route generated:', data);
      // Fetch details or set directly
      setRouteDetails({
        route: data.route,
        bins: data.binSequenceDetails
      });
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  // Update KPIs whenever bins or reports change
  useEffect(() => {
    const totalBins = bins.length;
    const criticalBins = bins.filter(b => b.status === 'critical' || b.fillLevel >= 90).length;
    const smellReports = reports.filter(r => r.status === 'pending').length;
    
    setKpis(prev => ({
      ...prev,
      totalBins,
      criticalBins,
      smellReports
    }));
  }, [bins, reports]);

  const handleGenerateRoute = async () => {
    try {
      const res = await api.get('/api/route/generate');
      alert(`Optimized route generated successfully! Total distance: ${res.totalDistance} km. Saved ${res.percentSaved}% travel distance.`);
      
      // Reload route
      const currentRouteRes = await api.get('/api/route/current').catch(() => null);
      if (currentRouteRes) {
        setRouteDetails(currentRouteRes);
      }
    } catch (err) {
      alert('Routing Error: ' + err.message);
    }
  };

  const handleResolveReport = async (reportId, actionNotes = 'Resolved by administrator') => {
    try {
      await api.patch(`/api/reports/${reportId}`, {
        status: 'resolved',
        notes: actionNotes
      });
      fetchData(); // Reload list
    } catch (err) {
      alert('Failed to resolve report: ' + err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleClearAlerts = () => {
    setNotifications([]);
  };

  // Filter bins based on selected zone
  const filteredBins = selectedZone === 'All Zones' 
    ? bins 
    : bins.filter(b => b.zone === selectedZone);

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col overflow-hidden text-left h-screen">
      
      {/* Top Navbar */}
      <nav className="bg-primary text-primary-fixed h-16 flex items-center justify-between px-margin-desktop shadow-sm z-50 shrink-0">
        <div className="flex items-center gap-md">
          <Link to="/" className="flex items-center gap-md hover:opacity-85 transition-opacity">
            <svg className="h-8 w-8 text-primary-fixed" viewBox="0 0 30 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L4.5 9C4.5 9 3 11.5 3 15C3 18.5 5.5 21 9 21C11.5 21 13.5 19.5 15 17.5C16.5 19.5 18.5 21 21 21C24.5 21 27 18.5 27 15C27 11.5 25.5 9 25.5 9L18 2" />
              <path d="M12 2C12 2 13.5 4.5 13.5 8C13.5 11.5 12 14 12 14" stroke="#4CAF50" />
              <path d="M12 22V14" />
            </svg>
            <span className="font-headline-md text-headline-md font-bold tracking-tight text-white">GreenBin Admin</span>
          </Link>
          <div className="h-8 w-px bg-white/30 mx-base"></div>
          
          {/* Zone Selector */}
          <div className="relative">
            <select 
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="flex items-center gap-xs bg-primary-container/20 text-white hover:bg-primary-container/40 px-sm py-1.5 rounded-xl border border-white/20 text-label-md font-semibold cursor-pointer outline-none"
            >
              <option value="All Zones" className="text-on-surface">Zone: All Districts</option>
              <option value="Zone-A" className="text-on-surface">Zone-A (Central)</option>
              <option value="Zone-B" className="text-on-surface">Zone-B (East)</option>
              <option value="Zone-C" className="text-on-surface">Zone-C (North)</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-md">
          {/* Notifications Dropdown (Simulated badge) */}
          <div className="relative">
            <button 
              onClick={() => {
                if (notifications.length > 0) {
                  alert(notifications.map(n => n.message).join('\n'));
                  handleClearAlerts();
                } else {
                  alert("No new alerts!");
                }
              }}
              className="p-xs rounded-full hover:bg-white/20 transition-all text-white flex items-center justify-center relative"
            >
              <span className="material-symbols-outlined text-white">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-primary animate-pulse"></span>
              )}
            </button>
          </div>
          
          <div className="flex items-center gap-sm bg-white/10 pr-sm py-1 pl-1 rounded-full border border-white/10 text-white">
            <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center font-bold text-white bg-secondary">
              A
            </div>
            <span className="font-label-md text-label-md">Officer Sarah K.</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Side Navigation */}
        <aside className="w-64 bg-surface-container-low border-r border-outline-variant flex flex-col py-md px-sm gap-xs shrink-0">
          <div className="px-sm mb-md text-left">
            <h2 className="font-title-lg text-title-lg font-black text-primary">Smart Waste</h2>
            <p className="font-label-md text-label-md text-on-surface-variant/70">Operator Portal</p>
          </div>
          <nav className="space-y-xs flex-1 text-left">
            <Link className="flex items-center gap-sm bg-primary-container text-on-primary-container rounded-xl px-sm py-xs border-l-4 border-primary transition-all font-semibold" to="/admin">
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-label-md text-label-md">Dashboard</span>
            </Link>
            <Link className="flex items-center gap-sm text-on-surface-variant hover:bg-surface-variant transition-all px-sm py-xs rounded-xl" to="/report">
              <span className="material-symbols-outlined">report_problem</span>
              <span className="font-label-md text-label-md">Report Issue</span>
            </Link>
            <Link className="flex items-center gap-sm text-on-surface-variant hover:bg-surface-variant transition-all px-sm py-xs rounded-xl" to="/leaderboard">
              <span className="material-symbols-outlined">leaderboard</span>
              <span className="font-label-md text-label-md">Leaderboard</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-sm text-on-surface-variant hover:bg-surface-variant transition-all px-sm py-xs rounded-xl mt-xl text-left"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-md text-label-md">Logout</span>
            </button>
          </nav>
          
          <button 
            onClick={handleGenerateRoute}
            className="mt-auto bg-primary text-on-primary font-label-md text-label-md py-sm rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-xs shadow-lg"
          >
            <span className="material-symbols-outlined">route</span>
            Optimize Routes
          </button>
        </aside>

        {/* Core Dashboard Workspace */}
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-background">
          
          {/* Top KPIs Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter p-gutter shrink-0">
            {/* KPI 1 */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-sm shadow-sm flex items-center gap-md">
              <div className="h-12 w-12 rounded-lg bg-surface-variant flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">delete_sweep</span>
              </div>
              <div className="text-left">
                <p className="font-label-md text-label-md text-on-surface-variant">Total Bins</p>
                <p className="font-headline-md text-headline-md font-bold text-on-surface">{kpis.totalBins}</p>
              </div>
            </div>
            
            {/* KPI 2 */}
            <div className={`rounded-xl border p-sm shadow-sm flex items-center gap-md transition-colors ${
              kpis.criticalBins > 0 ? 'bg-error-container border-error/20' : 'bg-surface-container-lowest border-outline-variant/30'
            }`}>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-on-error ${
                kpis.criticalBins > 0 ? 'bg-error pulse-critical' : 'bg-surface-variant text-primary'
              }`}>
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <div className="text-left">
                <p className={`font-label-md text-label-md ${kpis.criticalBins > 0 ? 'text-on-error-container' : 'text-on-surface-variant'}`}>Critical Bins</p>
                <p className={`font-headline-md text-headline-md font-bold ${kpis.criticalBins > 0 ? 'text-on-error-container' : 'text-on-surface'}`}>{kpis.criticalBins}</p>
              </div>
            </div>
            
            {/* KPI 3 */}
            <div className={`rounded-xl border p-sm shadow-sm flex items-center gap-md transition-colors ${
              kpis.smellReports > 0 ? 'bg-tertiary-fixed border-tertiary-container/20' : 'bg-surface-container-lowest border-outline-variant/30'
            }`}>
              <div className="h-12 w-12 rounded-lg bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
                <span className="material-symbols-outlined text-3xl">air</span>
              </div>
              <div className="text-left">
                <p className={`font-label-md text-label-md ${kpis.smellReports > 0 ? 'text-on-tertiary-fixed-variant' : 'text-on-surface-variant'}`}>Smell Reports</p>
                <p className={`font-headline-md text-headline-md font-bold ${kpis.smellReports > 0 ? 'text-on-tertiary-fixed-variant' : 'text-on-surface'}`}>{kpis.smellReports}</p>
              </div>
            </div>
            
            {/* KPI 4 */}
            <div className="bg-secondary-container rounded-xl border border-secondary/20 p-sm shadow-sm flex items-center gap-md">
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center text-on-secondary">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <div className="text-left">
                <p className="font-label-md text-label-md text-on-secondary-container">Collected Today</p>
                <p className="font-headline-md text-headline-md font-bold text-on-secondary-container">{kpis.collectedToday}</p>
              </div>
            </div>
          </div>

          {/* Interactive map and sidebar grid */}
          <div className="flex flex-1 px-gutter pb-gutter gap-gutter overflow-hidden h-[75%] min-h-[500px]">
            
            {/* Left Section: Interactive Leaflet Map */}
            <section className="flex-[3] relative rounded-xl overflow-hidden border border-outline-variant shadow-sm bg-surface-variant/20 h-full">
              <MapComponent 
                bins={filteredBins} 
                routePath={routeDetails ? routeDetails.bins : []} 
              />
              
              {/* Map floating legend */}
              <div className="absolute bottom-sm left-sm bg-surface/90 backdrop-blur-sm px-sm py-xs rounded-full shadow-lg border border-outline-variant flex items-center gap-sm z-[1000]">
                <div className="flex items-center gap-xs">
                  <span className="w-3 h-3 rounded-full bg-secondary"></span>
                  <span className="text-[10px] font-bold">Normal</span>
                </div>
                <div className="flex items-center gap-xs">
                  <span className="w-3 h-3 rounded-full bg-[#FFA000]"></span>
                  <span className="text-[10px] font-bold">Warning</span>
                </div>
                <div className="flex items-center gap-xs">
                  <span className="w-3 h-3 rounded-full bg-error"></span>
                  <span className="text-[10px] font-bold">Critical</span>
                </div>
                <div className="flex items-center gap-xs">
                  <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                  <span className="text-[10px] font-bold">Odor</span>
                </div>
              </div>
            </section>

            {/* Right Section: Action Panel */}
            <section className="flex-[2] flex flex-col gap-gutter overflow-hidden h-full">
              
              {/* Pending Reports List */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col overflow-hidden max-h-[35%] shadow-sm text-left">
                <div className="px-sm py-xs bg-surface-container-high flex justify-between items-center border-b border-outline-variant/20">
                  <h3 className="font-label-md text-label-md font-bold text-primary flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[18px]">forum</span>
                    Pending Reports
                  </h3>
                  <span className="bg-tertiary text-on-tertiary px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {reports.filter(r => r.status === 'pending').length} PENDING
                  </span>
                </div>
                <div className="overflow-y-auto custom-scrollbar p-xs space-y-xs flex-1">
                  {reports.filter(r => r.status === 'pending').length === 0 ? (
                    <p className="text-center text-xs text-on-surface-variant py-md">No pending reports.</p>
                  ) : (
                    reports.filter(r => r.status === 'pending').map(report => (
                      <div key={report.reportId} className="p-sm rounded-lg bg-surface hover:bg-surface-variant/30 border border-outline-variant/10 transition-colors flex justify-between items-center group">
                        <div className="flex gap-sm">
                          <span className={`material-symbols-outlined ${report.issueType === 'Foul Smell' ? 'text-tertiary' : 'text-error'}`}>
                            {report.issueType === 'Foul Smell' ? 'air' : 'warning'}
                          </span>
                          <div>
                            <p className="font-label-md text-label-md font-bold">Bin #{report.binId} - {report.issueType}</p>
                            <p className="text-[11px] text-on-surface-variant">
                              {report.description || 'No description provided'} • {new Date(report.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleResolveReport(report.reportId)}
                          className="bg-primary text-on-primary text-[10px] px-sm py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Resolve
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Critical Bins Queue */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col overflow-hidden max-h-[35%] shadow-sm text-left">
                <div className="px-sm py-xs bg-error-container/30 flex justify-between items-center border-b border-error/10">
                  <h3 className="font-label-md text-label-md font-bold text-error flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    Critical Bins (90%+)
                  </h3>
                  <button 
                    onClick={handleGenerateRoute}
                    className="text-error font-bold text-[10px] uppercase hover:underline"
                  >
                    Route All
                  </button>
                </div>
                <div className="overflow-y-auto custom-scrollbar p-xs space-y-xs flex-1">
                  {bins.filter(b => b.status === 'critical' || b.fillLevel >= 90).length === 0 ? (
                    <p className="text-center text-xs text-on-surface-variant py-md">No critical bins detected.</p>
                  ) : (
                    bins.filter(b => b.status === 'critical' || b.fillLevel >= 90).map(bin => (
                      <div key={bin.binId} className="flex flex-col gap-xs p-sm bg-surface border-l-4 border-error rounded-r-lg shadow-sm">
                        <div className="flex justify-between items-start">
                          <span className="font-label-md text-label-md font-bold">{bin.binId} — {bin.location.name}</span>
                          <span className="text-error font-black">{bin.fillLevel}%</span>
                        </div>
                        <div className="w-full bg-outline-variant/20 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-error h-full rounded-full" style={{ width: `${bin.fillLevel}%` }}></div>
                        </div>
                        <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">history</span>
                          Requires immediate collection
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Weekly Tonnage / Route Optimization Saving Stats */}
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col flex-1 p-sm shadow-sm overflow-hidden text-left">
                <div className="mb-sm">
                  <h3 className="font-label-md text-label-md font-bold text-on-surface">Route Optimization Statistics</h3>
                  {routeDetails ? (
                    <p className="text-[11px] text-secondary font-bold">
                      Latest route saved {Math.round((1 - routeDetails.route.totalDistance / routeDetails.route.baselineDistance) * 100)}% distance ({routeDetails.route.totalDistance.toFixed(1)}km vs {routeDetails.route.baselineDistance.toFixed(1)}km baseline)
                    </p>
                  ) : (
                    <p className="text-[10px] text-on-surface-variant">Click Optimize Routes to generate dispatch paths.</p>
                  )}
                </div>
                
                {/* Visual Route Tonnage chart simulation */}
                <div className="flex-1 flex items-end justify-between gap-base px-xs pb-xs">
                  {/* Mon */}
                  <div className="flex-1 flex flex-col items-center gap-xs">
                    <div className="w-full bg-secondary/20 hover:bg-secondary/40 rounded-t-md transition-all relative group" style={{ height: "60%" }}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">15t</span>
                    </div>
                    <span className="text-[9px] text-on-surface-variant">M</span>
                  </div>
                  {/* Tue */}
                  <div className="flex-1 flex flex-col items-center gap-xs">
                    <div className="w-full bg-secondary/20 hover:bg-secondary/40 rounded-t-md transition-all relative group" style={{ height: "80%" }}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">20t</span>
                    </div>
                    <span className="text-[9px] text-on-surface-variant">T</span>
                  </div>
                  {/* Wed */}
                  <div className="flex-1 flex flex-col items-center gap-xs">
                    <div className="w-full bg-secondary/60 rounded-t-md relative" style={{ height: "95%" }}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold">24t</span>
                    </div>
                    <span className="text-[9px] text-primary font-bold">W</span>
                  </div>
                  {/* Thu */}
                  <div className="flex-1 flex flex-col items-center gap-xs">
                    <div className="w-full bg-secondary/20 hover:bg-secondary/40 rounded-t-md transition-all relative" style={{ height: "70%" }}></div>
                    <span className="text-[9px] text-on-surface-variant">T</span>
                  </div>
                  {/* Fri */}
                  <div className="flex-1 flex flex-col items-center gap-xs">
                    <div className="w-full bg-secondary/20 hover:bg-secondary/40 rounded-t-md transition-all relative" style={{ height: "85%" }}></div>
                    <span className="text-[9px] text-on-surface-variant">F</span>
                  </div>
                  {/* Sat */}
                  <div className="flex-1 flex flex-col items-center gap-xs">
                    <div className="w-full bg-secondary/10 hover:bg-secondary/20 rounded-t-md transition-all relative" style={{ height: "40%" }}></div>
                    <span className="text-[9px] text-on-surface-variant">S</span>
                  </div>
                  {/* Sun */}
                  <div className="flex-1 flex flex-col items-center gap-xs">
                    <div className="w-full bg-secondary/10 hover:bg-secondary/20 rounded-t-md transition-all relative" style={{ height: "30%" }}></div>
                    <span className="text-[9px] text-on-surface-variant">S</span>
                  </div>
                </div>
              </div>

            </section>
            
          </div>
        </main>
      </div>

    </div>
  );
};

export default AdminDashboard;
