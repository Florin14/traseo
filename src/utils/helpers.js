// Vehicle type constants (GTFS)
export const VEHICLE_TYPES = {
  0: { name: 'Tramvai', icon: 'Tram', color: 'var(--color-tram)' },
  3: { name: 'Autobuz', icon: 'Bus', color: 'var(--color-bus)' },
  11: { name: 'Troleibuz', icon: 'Zap', color: '#F59E0B' },
};

export function getVehicleTypeName(type) {
  return VEHICLE_TYPES[type]?.name || 'Vehicul';
}

export function getVehicleTypeColor(type) {
  return VEHICLE_TYPES[type]?.color || 'var(--text-secondary)';
}

export function getVehicleTypeBadgeClass(type) {
  if (type === 0) return 'badge-tram';
  if (type === 11) return 'badge-trolleybus';
  return 'badge-bus';
}

export function getRouteTypeBadgeClass(type) {
  return getVehicleTypeBadgeClass(type);
}

// Time formatting
export function timeAgo(timestamp) {
  if (!timestamp) return '';
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now - then) / 1000);

  if (diff < 10) return 'acum';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}z`;
}

// Greeting based on time of day
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Noapte buna';
  if (hour < 12) return 'Buna dimineata';
  if (hour < 18) return 'Buna ziua';
  return 'Buna seara';
}

/**
 * Estimate arrival times for a vehicle at upcoming stops.
 * Returns map: { stopId: etaMinutes } for stops ahead of the vehicle.
 */
export function estimateVehicleETAs(vehicle, tripStopSequence, stopMap) {
  if (!vehicle?.latitude || !vehicle?.longitude || !tripStopSequence?.length) return {};

  // Find the nearest stop index (the stop the vehicle is closest to)
  let nearestIdx = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < tripStopSequence.length; i++) {
    const stop = stopMap[tripStopSequence[i].stop_id];
    if (!stop?.stop_lat || !stop?.stop_lon) continue;
    const d = haversineDistance(vehicle.latitude, vehicle.longitude, stop.stop_lat, stop.stop_lon);
    if (d < nearestDist) {
      nearestDist = d;
      nearestIdx = i;
    }
  }

  // Use vehicle speed or default 20 km/h for city transit
  const speedKmh = Math.max(vehicle.speed || 0, 5);
  // Average transit speed accounting for stops (~20 km/h)
  const avgSpeedKmh = vehicle.speed > 5 ? Math.min(speedKmh, 40) : 20;

  const etas = {};
  let cumulativeDistKm = nearestDist;

  // Start from the nearest stop and go forward
  for (let i = nearestIdx; i < tripStopSequence.length; i++) {
    const stop = stopMap[tripStopSequence[i].stop_id];
    if (!stop?.stop_lat || !stop?.stop_lon) continue;

    if (i > nearestIdx) {
      const prevStop = stopMap[tripStopSequence[i - 1].stop_id];
      if (prevStop?.stop_lat && prevStop?.stop_lon) {
        cumulativeDistKm += haversineDistance(prevStop.stop_lat, prevStop.stop_lon, stop.stop_lat, stop.stop_lon);
      }
    }

    // Road distance is ~1.3x straight-line distance
    const roadDistKm = cumulativeDistKm * 1.3;
    // Add ~30s per stop for dwell time
    const dwellMinutes = (i - nearestIdx) * 0.5;
    const etaMinutes = Math.round((roadDistKm / avgSpeedKmh) * 60 + dwellMinutes);
    etas[tripStopSequence[i].stop_id] = etaMinutes;
  }

  return etas;
}

/**
 * For a list of vehicles on a route direction, compute the soonest ETA at each stop.
 */
export function computeStopETAs(vehiclesInDirection, tripStopSequence, stopMap, tripMap) {
  const stopETAs = {}; // stopId -> { eta, vehicleLabel }

  vehiclesInDirection.forEach((v) => {
    const etas = estimateVehicleETAs(v, tripStopSequence, stopMap);
    Object.entries(etas).forEach(([stopId, eta]) => {
      if (!stopETAs[stopId] || eta < stopETAs[stopId].eta) {
        stopETAs[stopId] = { eta, vehicleLabel: v.label };
      }
    });
  });

  return stopETAs;
}

// Haversine distance in km
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
