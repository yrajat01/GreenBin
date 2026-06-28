const Bin = require('../models/Bin');

// Haversine formula to calculate distance in km between two lat/lng coordinates
const getDistance = (coord1, coord2) => {
  const R = 6371; // Earth radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Nearest Neighbor Heuristic
const optimizeRoute = (depot, bins) => {
  let unvisited = [...bins];
  let currentCoords = { ...depot };
  let sequence = [];
  let totalDistance = 0;
  
  while (unvisited.length > 0) {
    let closestIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < unvisited.length; i++) {
      const dist = getDistance(currentCoords, unvisited[i].location);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }
    
    const nextBin = unvisited[closestIndex];
    sequence.push(nextBin);
    totalDistance += minDistance;
    currentCoords = nextBin.location;
    unvisited.splice(closestIndex, 1);
  }
  
  // Return to depot at the end
  if (sequence.length > 0) {
    totalDistance += getDistance(currentCoords, depot);
  }
  
  return {
    sequence,
    totalDistance: Math.round(totalDistance * 100) / 100 // Round to 2 decimal places
  };
};

module.exports = {
  getDistance,
  optimizeRoute
};
