import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { initiateSocketConnection, disconnectSocket } from '../services/socket';

const StaffRouteView = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [route, setRoute] = useState(null);
  const [routeBins, setRouteBins] = useState([]);
  const [collectedBinIds, setCollectedBinIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch current route assigned
  const fetchCurrentRoute = async () => {
    setError('');
    try {
      const data = await api.get('/api/route/current');
      setRoute(data.route);
      setRouteBins(data.bins);
      
      // Calculate which bins in sequence are already collected (fillLevel = 5%)
      const collected = data.bins
        .filter(bin => bin.fillLevel <= 5 && bin.status === 'normal')
        .map(bin => bin.binId);
      setCollectedBinIds(collected);
    } catch (err) {
      setError(err.message || 'No active collection route assigned today.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentRoute();

    // Connect socket
    const socket = initiateSocketConnection();

    socket.on('route_generated', () => {
      console.log('Staff Socket: New route generated, reloading...');
      fetchCurrentRoute();
    });

    socket.on('bin_update', (updatedBin) => {
      console.log('Staff Socket: Bin updated:', updatedBin);
      // Update local bin state
      setRouteBins(prev => prev.map(b => b.binId === updatedBin.binId ? updatedBin : b));
      if (updatedBin.fillLevel <= 5 && updatedBin.status === 'normal') {
        setCollectedBinIds(prev => prev.includes(updatedBin.binId) ? prev : [...prev, updatedBin.binId]);
      }
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleMarkAsCollected = async (binId) => {
    try {
      const res = await api.patch(`/api/bins/${binId}/collect`, {});
      
      // Update collected list
      setCollectedBinIds(prev => [...prev, binId]);
      
      // Update local bin status
      setRouteBins(prev => prev.map(b => b.binId === binId ? res.bin : b));
      
      alert(`Bin #${binId} marked as collected! Fill level reset to 5%.`);
    } catch (err) {
      alert('Collection Error: ' + err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Compute remaining stops
  const remainingStops = routeBins.filter(b => !collectedBinIds.includes(b.binId));
  const nextStopBin = remainingStops[0];
  const upcomingStops = remainingStops.slice(1);

  // Compute stats
  const totalStopsCount = routeBins.length;
  const completedStopsCount = collectedBinIds.length;
  const progressPercent = totalStopsCount > 0 ? (completedStopsCount / totalStopsCount) * 100 : 0;
  
  const savedDistance = route ? (route.baselineDistance - route.totalDistance).toFixed(1) : '2.1';
  const totalDistance = route ? route.totalDistance.toFixed(1) : '8.2';

  return (
    <div className="bg-background text-on-background font-body-md text-body-md overflow-hidden flex flex-col h-screen max-w-[375px] mx-auto shadow-2xl border-x border-outline-variant text-left relative">
      
      {/* Mobile Header */}
      <header className="bg-surface px-margin-mobile py-sm flex items-center justify-between z-20 border-b border-outline-variant/30">
        <div className="flex items-center gap-xs">
          <button onClick={handleLogout} className="p-1 hover:bg-surface-variant rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <Link to="/">
            <h1 className="font-headline-md text-headline-md font-bold text-primary hover:opacity-85 transition-opacity">GreenBin Drivers</h1>
          </Link>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant flex items-center justify-center font-bold text-primary bg-secondary-container">
          D
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-on-surface-variant animate-pulse">Loading route details...</p>
        </div>
      ) : error ? (
        <div className="flex-1 p-md flex flex-col items-center justify-center text-center gap-md">
          <span className="material-symbols-outlined text-outline text-5xl">route_of_transit</span>
          <p className="text-on-surface-variant font-semibold">{error}</p>
          <button 
            onClick={fetchCurrentRoute} 
            className="px-md py-sm bg-primary text-white rounded-full font-label-md hover:bg-opacity-95"
          >
            Check Again
          </button>
        </div>
      ) : (
        <>
          {/* Header Stats Section */}
          <section className="px-margin-mobile pb-sm pt-xs bg-surface shadow-sm z-10 text-left">
            <div className="flex justify-between items-end mb-xs">
              <div>
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Today's Route</span>
                <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
                  {completedStopsCount} of {totalStopsCount} Bins
                </h2>
              </div>
              <div className="text-right">
                <span className="font-label-md text-label-md text-secondary font-bold">{totalDistance}km Total</span>
                <p className="text-on-secondary-container bg-secondary-container px-xs py-0.5 rounded-full text-[10px] font-bold uppercase">
                  {savedDistance}km SAVED
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-primary rounded-r-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </section>

          {/* Route List Checklist */}
          <main className="flex-1 overflow-y-auto scroll-hide px-margin-mobile py-md bg-background flex flex-col gap-md">
            
            {/* Next Stop Card */}
            {nextStopBin ? (
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-primary font-bold tracking-wider">NEXT STOP</span>
                <div className="bg-surface-container-lowest rounded-xl p-sm border-2 border-primary shadow-md relative overflow-hidden text-left">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  
                  <div className="flex justify-between items-start mb-sm">
                    <div className="flex gap-sm items-center">
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-lg">
                        {completedStopsCount + 1}
                      </div>
                      <div>
                        <h3 className="font-title-lg text-title-lg text-on-surface font-bold">#{nextStopBin.binId}</h3>
                        <p className="text-on-surface-variant text-[12px]">{nextStopBin.location.name}</p>
                      </div>
                    </div>
                    <span className={`px-xs py-1 rounded-lg font-bold text-[11px] text-white ${
                      nextStopBin.status === 'critical' || nextStopBin.fillLevel >= 90 ? 'bg-error pulse-critical' :
                      nextStopBin.status === 'smell_reported' ? 'bg-tertiary animate-pulse' : 'bg-[#FFA000]'
                    }`}>
                      {nextStopBin.status === 'smell_reported' ? 'SMELL ALERT' : `${nextStopBin.fillLevel}% FULL`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-xs mb-md">
                    <span className="bg-surface-variant text-on-surface-variant px-xs py-1 rounded-md text-[10px] font-bold uppercase tracking-tight">
                      {nextStopBin.zone}
                    </span>
                    {nextStopBin.lowTraffic && (
                      <span className="bg-surface-variant text-on-surface-variant px-xs py-1 rounded-md text-[10px] font-bold uppercase tracking-tight">
                        Low Traffic
                      </span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleMarkAsCollected(nextStopBin.binId)}
                    className="w-full py-md bg-secondary text-white rounded-xl font-bold flex items-center justify-center gap-xs shadow-lg active:scale-[0.98] transition-transform"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    Mark as Collected
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-lg bg-surface-container-lowest rounded-xl p-md border border-outline-variant/30">
                <span className="material-symbols-outlined text-secondary text-5xl">task_alt</span>
                <h3 className="font-title-lg font-bold mt-sm text-secondary">All Bins Collected!</h3>
                <p className="text-on-surface-variant text-xs mt-1">Excellent job. The collection route is complete.</p>
              </div>
            )}

            {/* Upcoming stops list */}
            {upcomingStops.length > 0 && (
              <div className="flex flex-col gap-sm text-left">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">UPCOMING STOPS</span>
                <div className="space-y-xs">
                  {upcomingStops.map((bin, index) => (
                    <div key={bin.binId} className="bg-surface-container-low rounded-xl p-sm border border-outline-variant flex gap-sm items-center opacity-85">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-bold">
                        {completedStopsCount + index + 2}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-on-surface text-sm">#{bin.binId}</h4>
                          <span className={`px-xs py-0.5 rounded text-[9px] font-bold text-white ${
                            bin.status === 'smell_reported' ? 'bg-tertiary' : 'bg-outline'
                          }`}>
                            {bin.status === 'smell_reported' ? 'SMELL ALERT' : `${bin.fillLevel}%`}
                          </span>
                        </div>
                        <p className="text-on-surface-variant text-[11px]">{bin.location.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decorative Map Context */}
            <div className="w-full h-32 rounded-xl overflow-hidden relative border border-outline-variant mt-xs bg-surface-variant/20 flex items-center justify-center">
              <img src="/stitch_assets/landscape.png" className="w-full h-full object-cover opacity-60" alt="Driving Map View" />
              <div className="absolute inset-0 bg-primary/10"></div>
              <div className="absolute bottom-2 left-2 flex items-center gap-xs bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-outline-variant z-10">
                <span className="material-symbols-outlined text-primary text-sm">near_me</span>
                <span className="text-[10px] font-bold text-primary">0.8km to next bin</span>
              </div>
            </div>

          </main>

          {/* Sticky Bottom Actions */}
          <footer className="bg-surface p-margin-mobile flex flex-col gap-sm shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-outline-variant/30">
            <button 
              disabled={remainingStops.length > 0}
              onClick={() => {
                alert("Collection Route Completed! Route logged in DB.");
                fetchCurrentRoute();
              }}
              className={`w-full py-md rounded-xl font-bold flex items-center justify-center gap-xs transition-colors ${
                remainingStops.length === 0 
                  ? 'bg-primary text-white cursor-pointer hover:bg-opacity-95' 
                  : 'bg-outline-variant text-surface-container-highest cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined">task_alt</span>
              Route Complete
            </button>
            
            <button 
              onClick={() => navigate('/report')}
              className="w-full py-sm text-error font-bold flex items-center justify-center gap-xs border border-error/20 rounded-xl hover:bg-error/5 transition-colors"
            >
              <span className="material-symbols-outlined text-md">report_problem</span>
              Report a Vehicle/Bin Issue
            </button>
          </footer>
        </>
      )}

    </div>
  );
};

export default StaffRouteView;
