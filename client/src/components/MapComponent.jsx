import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Depot Coordinate
const DEPOT_COORDS = [26.8467, 80.9462];
const EMPTY_ROUTE_PATH = [];

// Component to dynamically fit map view to route bounds
const FitBoundsToRoute = ({ coords, enabled = true }) => {
  const map = useMap();
  useEffect(() => {
    if (enabled && coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, enabled, map]);
  return null;
};

// Component to dynamically center map on selected bin
const CenterMapOnSelected = ({ selectedBin }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedBin && selectedBin.location?.lat && selectedBin.location?.lng) {
      map.setView([selectedBin.location.lat, selectedBin.location.lng], 16, { animate: true });
    }
  }, [selectedBin, map]);
  return null;
};

// Two-Finger Gesture Handler:
// - Sliding with two fingers moves/pans the map along.
// - Pinching in and pinching out zooms out and zooms in.
const TwoFingerGestureHandler = () => {
  const map = useMap();
  const touchRef = useRef({
    active: false,
    startDist: 0,
    startZoom: 14,
    lastMid: { x: 0, y: 0 },
  });

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    // 1. Touchpad & Wheel (Laptop 2-Finger Slide vs Pinch)
    const handleWheel = (e) => {
      e.preventDefault();

      if (e.ctrlKey) {
        // Pinch-in / Pinch-out on trackpad (browser sets ctrlKey: true for trackpad pinch)
        const zoomDelta = -e.deltaY * 0.015;
        const currentZoom = map.getZoom();
        const minZ = map.getMinZoom() || 2;
        const maxZ = map.getMaxZoom() || 19;
        const newZoom = Math.min(maxZ, Math.max(minZ, currentZoom + zoomDelta));
        map.setZoom(newZoom);
      } else {
        // Two-finger slide on trackpad: PAN / SLIDE THE MAP ALONG
        map.panBy([e.deltaX, e.deltaY], { animate: false });
      }
    };

    // 2. Touchscreen 2-Finger Gestures (Tablets & Phones)
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        if (map.dragging && map.dragging.enabled()) {
          map.dragging.disable();
        }

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;

        touchRef.current = {
          active: true,
          startDist: dist,
          startZoom: map.getZoom(),
          lastMid: { x: midX, y: midY },
        };
      } else {
        touchRef.current.active = false;
        if (map.dragging && !map.dragging.enabled()) {
          map.dragging.enable();
        }
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && touchRef.current.active) {
        e.preventDefault();

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const currentMidX = (t1.clientX + t2.clientX) / 2;
        const currentMidY = (t1.clientY + t2.clientY) / 2;

        // Two-finger sliding movement: pan the map along
        const dx = touchRef.current.lastMid.x - currentMidX;
        const dy = touchRef.current.lastMid.y - currentMidY;

        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          map.panBy([dx, dy], { animate: false });
        }

        // Pinch gesture: zoom if distance between two fingers changes
        const distChange = Math.abs(currentDist - touchRef.current.startDist);
        if (distChange > 10 && touchRef.current.startDist > 0) {
          const scale = currentDist / touchRef.current.startDist;
          const zoomChange = Math.log2(scale);
          const minZ = map.getMinZoom() || 2;
          const maxZ = map.getMaxZoom() || 19;
          const newZoom = Math.min(maxZ, Math.max(minZ, touchRef.current.startZoom + zoomChange));
          map.setZoom(newZoom);
        }

        touchRef.current.lastMid = { x: currentMidX, y: currentMidY };
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        touchRef.current.active = false;
        if (map.dragging && !map.dragging.enabled()) {
          map.dragging.enable();
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [map]);

  return null;
};

// Controller that pans map camera smoothly to follow truck position (Google Maps style)
const FollowTruckController = ({ truckPos, isFollowing, onMapDrag }) => {
  const map = useMap();

  useEffect(() => {
    const handleDragStart = () => {
      if (onMapDrag) onMapDrag();
    };
    map.on('dragstart', handleDragStart);
    return () => {
      map.off('dragstart', handleDragStart);
    };
  }, [map, onMapDrag]);

  useEffect(() => {
    if (isFollowing && truckPos && truckPos.length === 2) {
      map.setView(truckPos, Math.max(map.getZoom(), 16), { animate: true, duration: 0.8 });
    }
  }, [truckPos, isFollowing, map]);

  return null;
};

// Google Maps style navigation vehicle puck icon with heading direction arrow
const createNavigationPuckIcon = (angle = 0) => {
  const html = `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-12 h-12 rounded-full bg-[#1a73e8]/30 animate-ping"></div>
      <div class="absolute w-10 h-10 rounded-full bg-[#1a73e8]/20"></div>
      <div class="w-9 h-9 rounded-full bg-[#1a73e8] border-2 border-white shadow-2xl flex items-center justify-center text-white z-20">
        <div style="transform: rotate(${angle}deg); display: flex; align-items: center; justify-content: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 2L21 21L12 17L3 21L12 2Z" />
          </svg>
        </div>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'navigation-truck-puck',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Calculate bearing/angle in degrees between two lat/lng points
const getBearing = (startLat, startLng, endLat, endLng) => {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const endLatRad = (endLat * Math.PI) / 180;
  const endLngRad = (endLng * Math.PI) / 180;

  const dLng = endLngRad - startLngRad;
  const y = Math.sin(dLng) * Math.cos(endLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(endLatRad) -
    Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(dLng);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

// Helper to create single truck active direction arrow icon
const createSingleTruckArrowIcon = (angle) => {
  const html = `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 rounded-full bg-[#15803d]/30 animate-ping"></div>
      <div class="w-8 h-8 rounded-full bg-[#15803d] border-2 border-white shadow-xl flex items-center justify-center text-white z-10 transition-transform hover:scale-110">
        <div style="transform: rotate(${angle}deg); display: flex; items-center; justify-content: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 2L21 21L12 17L3 21L12 2Z" />
          </svg>
        </div>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'single-truck-direction-arrow',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Helper to create START route badge
const createStartBadgeIcon = (angle) => {
  const html = `
    <div class="flex items-center gap-1 bg-[#15803d] text-white px-2 py-0.5 rounded-full shadow-lg border border-white text-[10px] font-bold tracking-tight whitespace-nowrap">
      <span>START</span>
      <div style="transform: rotate(${angle}deg); display: inline-flex;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12 2L21 21L12 17L3 21L12 2Z" />
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'route-start-badge',
    iconSize: [60, 22],
    iconAnchor: [30, 26]
  });
};

// Helper to create custom HTML/Tailwind Leaflet icons
const createCustomIcon = (status, fillLevel) => {
  let colorClass = 'bg-secondary'; // Green (<60%)
  let iconName = 'delete';
  let pulseClass = '';

  if (status === 'smell_reported') {
    colorClass = 'bg-tertiary'; // Purple
    iconName = 'air';
  } else if (status === 'critical' || fillLevel >= 90) {
    colorClass = 'bg-error'; // Red
    iconName = 'warning';
    pulseClass = 'pulse-critical';
  } else if (status === 'warning' || fillLevel >= 60) {
    colorClass = 'bg-[#FFA000]'; // Amber
    iconName = 'delete';
  }

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg text-white ${colorClass} ${pulseClass} transition-transform hover:scale-110">
      <span class="material-symbols-outlined text-[16px]">${iconName}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const createDepotIcon = () => {
  const html = `
    <div class="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-white shadow-xl text-white bg-[#005ea2] transition-transform hover:scale-110">
      <span class="material-symbols-outlined text-[20px]">local_shipping</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-icon-depot',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

const MapComponent = ({ 
  bins = [], 
  selectedBin = null, 
  onBinSelect = null, 
  routePath = EMPTY_ROUTE_PATH,
  truckPosition = null,
  truckAngle = 0,
  isFollowing = false,
  onMapDrag = null,
  onRoadCoordinatesLoaded = null
}) => {
  const [roadCoordinates, setRoadCoordinates] = useState([]);

  const routePathKey = (routePath || []).map(bin => bin.binId || bin._id).join(',');

  // Fetch actual turn-by-turn road geometry from OSRM Routing Engine
  useEffect(() => {
    if (!routePath || routePath.length === 0) {
      setRoadCoordinates(prev => (prev.length === 0 ? prev : []));
      return;
    }

    // Waypoints in [lng, lat] format for OSRM: Depot -> Bins -> Depot
    const waypoints = [
      [DEPOT_COORDS[1], DEPOT_COORDS[0]],
      ...routePath.map(bin => [bin.location.lng, bin.location.lat]),
      [DEPOT_COORDS[1], DEPOT_COORDS[0]]
    ];

    const coordsStr = waypoints.map(pt => `${pt[0]},${pt[1]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

    let active = true;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (data.code === 'Ok' && data.routes && data.routes[0]?.geometry?.coordinates) {
          // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
          const leafletCoords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRoadCoordinates(leafletCoords);
          if (onRoadCoordinatesLoaded) {
            onRoadCoordinatesLoaded(leafletCoords);
          }
        } else {
          // Fallback straight lines
          const fallback = [DEPOT_COORDS, ...routePath.map(b => [b.location.lat, b.location.lng]), DEPOT_COORDS];
          setRoadCoordinates(fallback);
          if (onRoadCoordinatesLoaded) {
            onRoadCoordinatesLoaded(fallback);
          }
        }
      })
      .catch(err => {
        console.warn('OSRM road routing query failed, falling back to straight lines:', err);
        if (active) {
          const fallback = [DEPOT_COORDS, ...routePath.map(b => [b.location.lat, b.location.lng]), DEPOT_COORDS];
          setRoadCoordinates(fallback);
          if (onRoadCoordinatesLoaded) {
            onRoadCoordinatesLoaded(fallback);
          }
        }
      });

    return () => {
      active = false;
    };
  }, [routePathKey]);

  // Calculate single truck direction arrow along the recently followed road leg
  const singleTruckArrow = React.useMemo(() => {
    if (!roadCoordinates || roadCoordinates.length < 2) return null;

    // Place the single arrow on the active road segment (~15% along the route)
    const targetIndex = Math.min(6, Math.floor(roadCoordinates.length * 0.15));
    const p1 = roadCoordinates[targetIndex];
    const p2 = roadCoordinates[Math.min(targetIndex + 2, roadCoordinates.length - 1)];

    if (p1 && p2) {
      const angle = getBearing(p1[0], p1[1], p2[0], p2[1]);
      return { position: p1, angle };
    }
    return null;
  }, [roadCoordinates]);

  // Calculate start direction angle
  const startAngle = React.useMemo(() => {
    if (!roadCoordinates || roadCoordinates.length < 2) return 0;
    return getBearing(
      roadCoordinates[0][0], roadCoordinates[0][1],
      roadCoordinates[1][0], roadCoordinates[1][1]
    );
  }, [roadCoordinates]);

  return (
    <MapContainer 
      center={DEPOT_COORDS} 
      zoom={14} 
      className="w-full h-full rounded-xl overflow-hidden shadow-sm"
      scrollWheelZoom={false}
      touchZoom={false}
      zoomSnap={0.25}
      zoomDelta={0.5}
      dragging={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Two-finger sliding (pan) & pinch (zoom) handler for all logins */}
      <TwoFingerGestureHandler />
      
      {/* Dynamic View Controller */}
      <CenterMapOnSelected selectedBin={selectedBin} />

      {/* Google Maps Real-Time Follow Truck Controller */}
      <FollowTruckController 
        truckPos={truckPosition} 
        isFollowing={isFollowing} 
        onMapDrag={onMapDrag} 
      />
      
      {/* Real-Time Following Navigation Puck (Google Maps Navigation Arrow) */}
      {truckPosition && (
        <Marker
          position={truckPosition}
          icon={createNavigationPuckIcon(truckAngle)}
          zIndexOffset={1000}
          interactive={false}
        />
      )}
      
      {/* Depot Marker */}
      <Marker position={DEPOT_COORDS} icon={createDepotIcon()}>
        <Popup>
          <div className="p-1">
            <h4 className="font-bold text-primary font-title-lg">GreenBin Central Depot</h4>
            <p className="text-body-md text-on-surface-variant">Fleet starting and finishing location.</p>
          </div>
        </Popup>
      </Marker>

      {/* Bin Markers */}
      {bins.map((bin) => (
        <Marker
          key={bin.binId}
          position={[bin.location.lat, bin.location.lng]}
          icon={createCustomIcon(bin.status, bin.fillLevel)}
          eventHandlers={{
            click: () => {
              if (onBinSelect) onBinSelect(bin);
            },
          }}
        >
          <Popup>
            <div className="p-xs w-48 font-body-md">
              <div className="flex justify-between items-start mb-xs">
                <div>
                  <h4 className="font-bold text-primary uppercase font-mono-data">#{bin.binId}</h4>
                  <p className="text-[11px] text-on-surface-variant">{bin.location.name}</p>
                </div>
                <span className={`px-xs py-base text-[10px] rounded uppercase font-bold text-white ${
                  bin.status === 'critical' ? 'bg-error' :
                  bin.status === 'warning' ? 'bg-[#FFA000]' :
                  bin.status === 'smell_reported' ? 'bg-tertiary' : 'bg-secondary'
                }`}>
                  {bin.status === 'smell_reported' ? 'Smell Alert' : bin.status}
                </span>
              </div>
              
              <div className="space-y-xs mt-sm">
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      bin.status === 'critical' ? 'bg-error' :
                      bin.status === 'warning' ? 'bg-[#FFA000]' :
                      bin.status === 'smell_reported' ? 'bg-tertiary' : 'bg-secondary'
                    }`}
                    style={{ width: `${bin.fillLevel}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[12px] font-label-md">
                  <span>{bin.fillLevel}% Fill</span>
                  <span className="text-on-surface-variant">Zone: {bin.zone}</span>
                </div>
                <p className="text-[10px] text-outline text-right mt-1">
                  Last collected: {new Date(bin.lastCollected).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Render Google Maps Style Dedicated Road Route */}
      {roadCoordinates.length > 0 && (
        <>
          {/* Subtle Casing Outline */}
          <Polyline 
            positions={roadCoordinates} 
            pathOptions={{ color: '#064e3b', weight: 4.5, opacity: 0.25 }} 
          />
          {/* Main Thin Green Route Line (Google Maps Directions Style) */}
          <Polyline 
            positions={roadCoordinates} 
            pathOptions={{ color: '#15803d', weight: 2.5, opacity: 0.95 }} 
          />

          {/* Start Direction Badge Indicator */}
          <Marker 
            position={roadCoordinates[0]} 
            icon={createStartBadgeIcon(startAngle)} 
            interactive={false} 
          />

          {/* Single Truck Active Direction Arrow (when not in real-time following puck mode) */}
          {!truckPosition && singleTruckArrow && (
            <Marker 
              position={singleTruckArrow.position} 
              icon={createSingleTruckArrowIcon(singleTruckArrow.angle)} 
              interactive={false} 
            />
          )}

          {/* Auto-fit map viewport to active road route when not following */}
          <FitBoundsToRoute coords={roadCoordinates} enabled={!isFollowing} />
        </>
      )}
    </MapContainer>
  );
};

export default MapComponent;



