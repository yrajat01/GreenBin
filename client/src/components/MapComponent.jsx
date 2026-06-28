import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
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

const MapComponent = ({ bins = [], selectedBin = null, onBinSelect = null, routePath = [] }) => {
  // If a selected bin changes, zoom to it (can be added later using map events)
  
  // Construct route coordinates
  const polylineCoords = routePath.length > 0 
    ? [DEPOT_COORDS, ...routePath.map(bin => [bin.location.lat, bin.location.lng]), DEPOT_COORDS]
    : [];

  return (
    <MapContainer 
      center={DEPOT_COORDS} 
      zoom={14} 
      className="w-full h-full rounded-xl overflow-hidden shadow-sm"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
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

      {/* Render Route Polyline Path */}
      {polylineCoords.length > 0 && (
        <Polyline 
          positions={polylineCoords} 
          pathOptions={{ color: '#006e1c', weight: 4, dashArray: '8, 8', className: 'dotted-route' }} 
        />
      )}
    </MapContainer>
  );
};

export default MapComponent;
