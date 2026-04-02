import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

// Calculate bearing between two points
function bearing(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Distance between two points in km (simple approximation)
function quickDist(lat1, lon1, lat2, lon2) {
  const dlat = (lat2 - lat1) * 111.32;
  const dlon = (lon2 - lon1) * 111.32 * Math.cos(((lat1 + lat2) / 2 * Math.PI) / 180);
  return Math.sqrt(dlat * dlat + dlon * dlon);
}

const arrowCache = {};
function getArrowIcon(angle, color) {
  const key = `${Math.round(angle / 5) * 5}-${color}`;
  if (arrowCache[key]) return arrowCache[key];

  const icon = L.divIcon({
    html: `<svg width="16" height="16" viewBox="0 0 16 16" style="transform:rotate(${angle}deg)">
      <polygon points="8,2 13,12 8,9 3,12" fill="${color}" opacity="0.9"/>
    </svg>`,
    className: 'direction-arrow-wrap',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  arrowCache[key] = icon;
  return icon;
}

/**
 * Render arrow markers along a polyline at regular intervals to show direction.
 * @param {Array} points - [[lat, lon], ...] shape points
 * @param {string} color - arrow color
 * @param {number} spacingKm - km between arrows (default 0.8)
 */
const DirectionArrows = ({ points, color, spacingKm = 0.8 }) => {
  const arrows = useMemo(() => {
    if (!points || points.length < 2) return [];

    const result = [];
    let accumulated = 0;

    for (let i = 1; i < points.length; i++) {
      const [lat1, lon1] = points[i - 1];
      const [lat2, lon2] = points[i];
      const segDist = quickDist(lat1, lon1, lat2, lon2);
      accumulated += segDist;

      if (accumulated >= spacingKm) {
        const angle = bearing(lat1, lon1, lat2, lon2);
        const midLat = (lat1 + lat2) / 2;
        const midLon = (lon1 + lon2) / 2;
        result.push({ lat: midLat, lon: midLon, angle });
        accumulated = 0;
      }
    }

    return result;
  }, [points, spacingKm]);

  return arrows.map((arrow, idx) => (
    <Marker
      key={idx}
      position={[arrow.lat, arrow.lon]}
      icon={getArrowIcon(arrow.angle, color)}
      interactive={false}
    />
  ));
};

export default DirectionArrows;
