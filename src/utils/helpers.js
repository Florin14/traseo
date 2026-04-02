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
