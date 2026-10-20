import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { initiateSocketConnection, disconnectSocket } from '../services/socket';
import MapComponent from '../components/MapComponent';

// Realistic fallback route data for demo / offline testing
const FALLBACK_ROUTE = {
  routeId: 'RT-2026-TODAY',
  totalDistance: 7.8,
  baselineDistance: 10.9,
  status: 'pending',
  binSequence: ['GB-042', 'GB-005', 'GB-008', 'GB-006', 'GB-009']
};

const FALLBACK_BINS = [
  {
    binId: 'GB-042',
    location: { name: 'Market St & 5th (Central Park)', lat: 26.8407, lng: 80.9422 },
    fillLevel: 94,
    status: 'critical',
    zone: 'Zone-A',
    collectionType: 'sensor'
  },
  {
    binId: 'GB-005',
    location: { name: 'North Transit Hub', lat: 26.8617, lng: 80.9362 },
    fillLevel: 98,
    status: 'critical',
    zone: 'Zone-A',
    collectionType: 'sensor'
  },
  {
    binId: 'GB-008',
    location: { name: 'Sector 15 Residential (Oak St 42)', lat: 26.8447, lng: 80.9522 },
    fillLevel: 75,
    status: 'smell_reported',
    zone: 'Zone-B',
    collectionType: 'citizen'
  },
  {
    binId: 'GB-006',
    location: { name: 'South Park Entrance', lat: 26.8387, lng: 80.9542 },
    fillLevel: 92,
    status: 'critical',
    zone: 'Zone-B',
    collectionType: 'sensor'
  },
  {
    binId: 'GB-009',
    location: { name: 'Pine Avenue Corner', lat: 26.8557, lng: 80.9382 },
    fillLevel: 82,
    status: 'smell_reported',
    zone: 'Zone-B',
    collectionType: 'citizen'
  }
];

// Helper to compute distance in meters between 2 coordinates
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLam = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * (Math.sin(dLam / 2) ** 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Helper to compute heading angle in degrees
const getBearing = (lat1, lng1, lat2, lng2) => {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

const StaffRouteView = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Route & bin states
  const [route, setRoute] = useState(null);
  const [routeBins, setRouteBins] = useState([]);
  const [collectedBinIds, setCollectedBinIds] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Google Maps Following & Navigation States
  const [isNavigating, setIsNavigating] = useState(true); // Live navigation active
  const [isFollowing, setIsFollowing] = useState(true); // Camera actively locks & pans to truck
  const [roadCoordinates, setRoadCoordinates] = useState([]);
  const [truckPosIndex, setTruckPosIndex] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(34);
  const [showStopsDrawer, setShowStopsDrawer] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // Fetch current route from API
  const fetchCurrentRoute = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/route/current');
      if (data && data.bins && data.bins.length > 0) {
        setRoute(data.route);
        setRouteBins(data.bins);
        const collected = data.bins
          .filter(bin => bin.fillLevel <= 5 && bin.status === 'normal')
          .map(bin => bin.binId);
        setCollectedBinIds(collected);
        setIsDemoMode(false);
      } else {
        throw new Error('No assigned route in database.');
      }
    } catch (err) {
      console.warn('Backend route not found, activating interactive fallback route:', err.message);
      setRoute(FALLBACK_ROUTE);
      setRouteBins(FALLBACK_BINS);
      setCollectedBinIds([]);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentRoute();

    const socket = initiateSocketConnection();
    socket.on('route_generated', () => {
      showToast('New route dispatched! Updating map...', 'info');
      fetchCurrentRoute();
    });

    socket.on('bin_update', (updatedBin) => {
      setRouteBins(prev => prev.map(b => b.binId === updatedBin.binId ? updatedBin : b));
      if (updatedBin.fillLevel <= 5 && updatedBin.status === 'normal') {
        setCollectedBinIds(prev => prev.includes(updatedBin.binId) ? prev : [...prev, updatedBin.binId]);
      }
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  // Compute remaining & upcoming stops
  const remainingStops = routeBins.filter(b => !collectedBinIds.includes(b.binId));
  const nextStopBin = remainingStops[0];
  const upcomingStops = remainingStops.slice(1);

  // Derive active truck position and heading angle along roadCoordinates
  const currentTruckPos = roadCoordinates.length > 0 
    ? roadCoordinates[Math.min(truckPosIndex, roadCoordinates.length - 1)]
    : [26.8467, 80.9462];

  const nextTruckPos = roadCoordinates.length > 1
    ? roadCoordinates[Math.min(truckPosIndex + 1, roadCoordinates.length - 1)]
    : [26.8467, 80.9462];

  const truckHeadingAngle = (currentTruckPos && nextTruckPos)
    ? getBearing(currentTruckPos[0], currentTruckPos[1], nextTruckPos[0], nextTruckPos[1])
    : 0;

  // Real-time truck movement simulation along road coordinates (Google Maps Follow Effect)
  useEffect(() => {
    if (!isNavigating || roadCoordinates.length === 0) return;

    const interval = setInterval(() => {
      setTruckPosIndex(prevIndex => {
        if (prevIndex < roadCoordinates.length - 1) {
          // Subtle speed variation like realistic traffic
          setSpeedKmh(Math.floor(28 + Math.random() * 12));
          return prevIndex + 1;
        }
        return prevIndex;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isNavigating, roadCoordinates]);

  // When roadCoordinates are loaded, initialize truck position
  const handleRoadCoordinatesLoaded = (coords) => {
    setRoadCoordinates(coords);
    if (coords && coords.length > 0) {
      setTruckPosIndex(0);
    }
  };

  // Distance in meters to current target stop
  const distanceToNextStop = nextStopBin && currentTruckPos
    ? getDistanceMeters(currentTruckPos[0], currentTruckPos[1], nextStopBin.location.lat, nextStopBin.location.lng)
    : 0;

  // Mark bin as collected
  const handleMarkAsCollected = async (binId) => {
    try {
      if (!isDemoMode) {
        const res = await api.patch(`/api/bins/${binId}/collect`, {});
        setCollectedBinIds(prev => [...prev, binId]);
        setRouteBins(prev => prev.map(b => b.binId === binId ? res.bin : b));
      } else {
        setCollectedBinIds(prev => [...prev, binId]);
        setRouteBins(prev => prev.map(b => b.binId === binId ? { ...b, fillLevel: 5, status: 'normal' } : b));
      }
      showToast(`Bin #${binId} marked as collected! Fill level reset to 5%.`, 'success');
      
      // Auto snap camera back to vehicle
      setIsFollowing(true);
    } catch (_err) {
      setCollectedBinIds(prev => [...prev, binId]);
      setRouteBins(prev => prev.map(b => b.binId === binId ? { ...b, fillLevel: 5, status: 'normal' } : b));
      showToast(`Bin #${binId} collected!`, 'success');
      setIsFollowing(true);
    }
  };

  const handleCompleteRoute = () => {
    showToast('Collection Route Completed! Returning to Central Depot.', 'success');
    setTimeout(() => {
      fetchCurrentRoute();
    }, 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Compute stats
  const totalStopsCount = routeBins.length;
  const completedStopsCount = collectedBinIds.length;
  const progressPercent = totalStopsCount > 0 ? (completedStopsCount / totalStopsCount) * 100 : 0;
  const totalDistance = route ? (route.totalDistance || 7.8).toFixed(1) : '7.8';
  const savedDistance = route && route.baselineDistance && route.totalDistance
    ? (route.baselineDistance - route.totalDistance).toFixed(1)
    : '2.1';
  const estMinutesRemaining = Math.max(3, remainingStops.length * 5);

  return (
    <div className="bg-background text-on-background font-body-md h-screen w-screen overflow-hidden flex flex-col antialiased text-left relative selection:bg-secondary-container">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-16 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl border text-sm font-semibold transition-all transform animate-bounce ${
          toast.type === 'success' 
            ? 'bg-secondary text-white border-secondary-fixed-dim shadow-secondary/20' 
            : 'bg-primary text-white border-primary-fixed shadow-primary/20'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toast.type === 'success' ? 'check_circle' : 'info'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sleek Top Navigation Bar (Fleet Identity & Status) */}
      <header className="bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 h-14 px-4 lg:px-6 flex items-center justify-between z-30 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-primary tracking-tight leading-tight">GreenBin Driver Nav</span>
              <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active GPS Navigation
              </span>
            </div>
          </Link>

          {isDemoMode && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              <span className="material-symbols-outlined text-xs">science</span>
              Live Demo
            </span>
          )}
        </div>

        {/* Center Navigation Summary */}
        <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-secondary">check_circle</span>
            {completedStopsCount} of {totalStopsCount} Bins
          </span>
          <span className="text-outline-variant/50">•</span>
          <span className="text-secondary font-bold">{savedDistance} km Saved</span>
          <span className="text-outline-variant/50">•</span>
          <span>ETA ~{estMinutesRemaining} min</span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            title={soundEnabled ? 'Mute navigation voice' : 'Enable navigation voice'}
            className="p-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-base">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          <button
            onClick={() => navigate('/report')}
            title="Report Vehicle or Bin Issue"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-error/30 text-error hover:bg-error/5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">report_problem</span>
            <span>Report Issue</span>
          </button>

          <div className="h-5 w-px bg-outline-variant/30 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs border border-secondary/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1 text-on-surface-variant hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Loading or Full-Screen Following Map Container with Google Maps Overlays */}
      {loading && !route ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3 bg-surface">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-medium animate-pulse">Initializing Turn-by-Turn Driving Navigation...</p>
        </div>
      ) : (
        <div className="flex-1 w-full h-full relative overflow-hidden">
        
        {/* ======================================================== */}
        {/* 1. GOOGLE MAPS SIGNATURE GREEN TURN-BY-TURN BANNER       */}
        {/* ======================================================== */}
        <div className="absolute top-3 left-3 right-3 md:left-6 md:max-w-md z-20 pointer-events-auto">
          {nextStopBin ? (
            <div className="bg-[#137333] text-white rounded-2xl shadow-2xl p-3.5 flex items-center justify-between border border-white/20 backdrop-blur-md transition-all">
              <div className="flex items-center gap-3 min-w-0">
                {/* Big Direction Maneuver Icon */}
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  <span className="material-symbols-outlined text-3xl text-white">
                    {distanceToNextStop > 400 ? 'straight' : 'turn_right'}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white leading-none">
                      {distanceToNextStop > 1000 ? `${(distanceToNextStop / 1000).toFixed(1)} km` : `${distanceToNextStop} m`}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/20 text-white">
                      Stop #{completedStopsCount + 1}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white truncate mt-1">
                    Proceed to {nextStopBin.binId}
                  </h3>
                  <p className="text-[11px] text-white/80 truncate">
                    {nextStopBin.location?.name} ({nextStopBin.zone})
                  </p>
                </div>
              </div>

              {/* Speedometer Badge */}
              <div className="pl-3 border-l border-white/20 flex flex-col items-center justify-center shrink-0">
                <span className="text-base font-black leading-tight text-white">{speedKmh}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">km/h</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#137333] text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl text-white">task_alt</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">All Bins Collected!</h3>
                  <p className="text-xs text-white/80">Returning to GreenBin Central Depot</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. FLOATING MAP ACTION BUTTONS (RE-CENTER / OVERVIEW)    */}
        {/* ======================================================== */}
        <div className="absolute top-20 right-3 md:top-4 md:right-6 z-20 flex flex-col gap-2 pointer-events-auto">
          {/* Re-center / Follow Mode Button (Google Maps Style) */}
          {!isFollowing && (
            <button
              onClick={() => {
                setIsFollowing(true);
                setSelectedBin(null);
                showToast('Camera locked onto vehicle', 'info');
              }}
              className="bg-surface text-primary border border-primary/30 px-3 py-2 rounded-xl shadow-xl font-bold text-xs flex items-center gap-1.5 hover:bg-primary hover:text-white transition-all transform animate-pulse"
            >
              <span className="material-symbols-outlined text-base">my_location</span>
              <span>Re-center</span>
            </button>
          )}

          {/* Overview Toggle */}
          <button
            onClick={() => {
              setIsFollowing(false);
              setSelectedBin(null);
            }}
            title="Overview Entire Route"
            className="w-10 h-10 rounded-xl bg-surface/90 backdrop-blur-md border border-outline-variant/40 shadow-lg flex items-center justify-center text-on-surface hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-xl">crop_free</span>
          </button>

          {/* Play / Pause Driving Simulation */}
          <button
            onClick={() => {
              setIsNavigating(prev => !prev);
              showToast(!isNavigating ? 'Driving navigation resumed' : 'Driving navigation paused', 'info');
            }}
            title={isNavigating ? 'Pause driving navigation' : 'Resume driving navigation'}
            className="w-10 h-10 rounded-xl bg-surface/90 backdrop-blur-md border border-outline-variant/40 shadow-lg flex items-center justify-center text-on-surface hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-xl">
              {isNavigating ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Queue / Stops Drawer Toggle */}
          <button
            onClick={() => setShowStopsDrawer(prev => !prev)}
            title="Toggle Stops Queue"
            className="w-10 h-10 rounded-xl bg-surface/90 backdrop-blur-md border border-outline-variant/40 shadow-lg flex items-center justify-center text-on-surface hover:text-primary transition-colors relative"
          >
            <span className="material-symbols-outlined text-xl">format_list_bulleted</span>
            {remainingStops.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                {remainingStops.length}
              </span>
            )}
          </button>
        </div>

        {/* ======================================================== */}
        {/* 3. CORE INTERACTIVE LEAFLET FOLLOWING MAP COMPONENT      */}
        {/* ======================================================== */}
        <div className="w-full h-full">
          <MapComponent
            bins={routeBins}
            routePath={routeBins}
            selectedBin={selectedBin}
            onBinSelect={(bin) => {
              setSelectedBin(bin);
              setIsFollowing(false);
            }}
            truckPosition={currentTruckPos}
            truckAngle={truckHeadingAngle}
            isFollowing={isFollowing}
            onMapDrag={() => {
              // When user drags map, exit lock-follow mode until they tap re-center
              if (isFollowing) {
                setIsFollowing(false);
              }
            }}
            onRoadCoordinatesLoaded={handleRoadCoordinatesLoaded}
          />
        </div>

        {/* ======================================================== */}
        {/* 4. GOOGLE MAPS FLOATING BOTTOM NAVIGATION COCKPIT        */}
        {/* ======================================================== */}
        <div className="absolute bottom-3 left-3 right-3 md:left-6 md:right-auto md:w-[440px] z-20 pointer-events-auto">
          {nextStopBin ? (
            <div className="bg-surface/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-outline-variant/40 p-4 transition-all">
              
              {/* ETA & Distance Ribbon */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-outline-variant/30">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-secondary leading-none">
                    ~{estMinutesRemaining} min
                  </span>
                  <span className="text-xs text-on-surface-variant font-semibold">
                    ({totalDistance} km total)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-on-surface block">
                    ETA {new Date(Date.now() + estMinutesRemaining * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Next Target Bin Details */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 shadow">
                    #{nextStopBin.binId.replace('GB-', '')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-on-surface">{nextStopBin.binId}</h4>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-surface-variant text-on-surface-variant">
                        {nextStopBin.zone}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">{nextStopBin.location?.name}</p>
                  </div>
                </div>

                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0 text-white ${
                  nextStopBin.status === 'critical' || nextStopBin.fillLevel >= 90
                    ? 'bg-error animate-pulse'
                    : nextStopBin.status === 'smell_reported'
                    ? 'bg-tertiary animate-pulse'
                    : 'bg-amber-500'
                }`}>
                  {nextStopBin.status === 'smell_reported' ? 'SMELL ALERT' : `${nextStopBin.fillLevel}% FULL`}
                </span>
              </div>

              {/* Primary Collection Action Button */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkAsCollected(nextStopBin.binId)}
                  className="flex-1 py-3 bg-secondary text-white rounded-xl font-bold text-sm shadow-lg hover:bg-secondary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  Mark as Collected
                </button>
                <button
                  onClick={() => setShowStopsDrawer(prev => !prev)}
                  title="View Upcoming Stops Queue"
                  className="px-3 py-3 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-variant text-on-surface-variant transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">format_list_numbered</span>
                </button>
              </div>

              {/* Up-Next Preview */}
              {upcomingStops.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span className="truncate">
                    Then to <strong>{upcomingStops[0].binId}</strong> ({upcomingStops[0].location?.name})
                  </span>
                  <span className="font-bold text-secondary shrink-0 pl-1">{upcomingStops[0].fillLevel}%</span>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-surface/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-secondary/30 p-4 text-center">
              <span className="material-symbols-outlined text-secondary text-4xl mb-1">task_alt</span>
              <h3 className="font-bold text-base text-secondary">All Assigned Stops Finished!</h3>
              <p className="text-xs text-on-surface-variant mt-0.5 mb-3">All bins on today's route collected and reset.</p>
              <button
                onClick={handleCompleteRoute}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">done_all</span>
                Complete Route &amp; Return to Depot
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 5. SLIDE-OUT STOPS ITINERARY DRAWER                      */}
        {/* ======================================================== */}
        {showStopsDrawer && (
          <div className="absolute top-0 bottom-0 left-0 w-full sm:w-80 md:w-96 bg-surface/98 backdrop-blur-xl border-r border-outline-variant/30 shadow-2xl z-30 flex flex-col pointer-events-auto transition-transform">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-on-surface">Route Itinerary</h3>
                <span className="text-xs text-on-surface-variant">{completedStopsCount} of {totalStopsCount} Stops Collected</span>
              </div>
              <button
                onClick={() => setShowStopsDrawer(false)}
                className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Route Progress Bar */}
            <div className="px-4 py-2 border-b border-outline-variant/20 bg-surface-container-low/50">
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Stops Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {routeBins.map((bin, index) => {
                const isCollected = collectedBinIds.includes(bin.binId);
                const isNext = nextStopBin && nextStopBin.binId === bin.binId;

                return (
                  <div
                    key={bin.binId}
                    onClick={() => {
                      setSelectedBin(bin);
                      setIsFollowing(false);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isNext
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : isCollected
                        ? 'bg-surface-container-lowest/50 opacity-60 border-outline-variant/20'
                        : 'bg-surface-container-lowest border-outline-variant/30 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCollected ? 'bg-secondary text-white' : isNext ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {isCollected ? '✓' : index + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-on-surface block truncate">{bin.binId}</span>
                        <span className="text-[11px] text-on-surface-variant truncate block">{bin.location?.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isCollected
                          ? 'bg-secondary/15 text-secondary'
                          : bin.fillLevel >= 90
                          ? 'bg-error/15 text-error'
                          : 'bg-amber-500/15 text-amber-700'
                      }`}>
                        {isCollected ? 'DONE' : `${bin.fillLevel}%`}
                      </span>

                      {!isCollected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsCollected(bin.binId);
                          }}
                          title="Collect bin"
                          className="w-7 h-7 rounded-lg bg-secondary/15 hover:bg-secondary text-secondary hover:text-white flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-outline-variant/30 bg-surface flex gap-2">
              <button
                disabled={remainingStops.length > 0}
                onClick={handleCompleteRoute}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  remainingStops.length === 0
                    ? 'bg-primary text-white shadow'
                    : 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-base">task_alt</span>
                Complete Route
              </button>
            </div>

          </div>
        )}

        </div>
      )}

    </div>
  );
};

export default StaffRouteView;
