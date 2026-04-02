import { useEffect, useRef, useMemo, useState, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { RefreshCw, Bus, TramFront, Zap, Filter, X, Layers, ArrowRight } from 'lucide-react';
import { fetchVehicles } from '../store/slices/vehiclesSlice';
import { fetchRoutes } from '../store/slices/routesSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import { fetchShapes } from '../store/slices/shapesSlice';
import { getVehicleTypeName, timeAgo } from '../utils/helpers';
import { useMapTheme } from '../hooks/useMapTheme';
import './Map.css';

delete L.Icon.Default.prototype._getIconUrl;

// Icon cache keyed by route name + type + active
const iconCache = {};
function getVehicleIcon(routeName, vehicleType, isActive) {
  const key = `${routeName}-${vehicleType}-${isActive}`;
  if (iconCache[key]) return iconCache[key];

  const colors = {
    0: { bg: '#10B981', border: '#059669' },
    3: { bg: '#3B82F6', border: '#2563EB' },
    11: { bg: '#F59E0B', border: '#D97706' },
  };
  const c = colors[vehicleType] || colors[3];
  const displayText = routeName || '?';
  const opacity = isActive ? '1' : '0.55';
  const fontSize = displayText.length > 2 ? '9px' : '11px';

  const icon = L.divIcon({
    html: `<div class="v-marker ${isActive ? 'v-active' : ''}" style="background:${c.bg};border-color:${c.border};opacity:${opacity}"><span style="font-size:${fontSize}">${displayText}</span></div>`,
    className: 'v-marker-wrap',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });

  iconCache[key] = icon;
  return icon;
}

// Close popups on map click/zoom
const MapEventHandler = ({ onMapInteraction }) => {
  useMapEvents({
    click: onMapInteraction,
    zoomstart: onMapInteraction,
    dragstart: onMapInteraction,
  });
  return null;
};

// Auto-fit on first load
const MapInit = ({ vehicles }) => {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (vehicles.length > 0 && !done.current) {
      const valid = vehicles.filter((v) => v.latitude && v.longitude);
      if (valid.length) {
        map.fitBounds(L.latLngBounds(valid.map((v) => [v.latitude, v.longitude])), { padding: [40, 40] });
        done.current = true;
      }
    }
  }, [vehicles, map]);
  return null;
};

// Memoized vehicle marker
const VehicleMarker = memo(({ vehicle, routeName, isActive, onSelect, isSelected }) => {
  return (
    <Marker
      position={[vehicle.latitude, vehicle.longitude]}
      icon={getVehicleIcon(routeName, vehicle.vehicle_type, isActive)}
      eventHandlers={{ click: () => onSelect(vehicle) }}
    >
      <Popup className="dark-popup" autoPan={false}>
        <div className="popup-dark">
          <div className="popup-dark-header">
            <span className="popup-dark-route mono">{routeName || '—'}</span>
            <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
              {isActive ? 'In miscare' : 'Stationat'}
            </span>
          </div>
          <div className="popup-dark-details">
            <div className="popup-dark-row">
              <span>Tip</span>
              <span>{getVehicleTypeName(vehicle.vehicle_type)}</span>
            </div>
            <div className="popup-dark-row">
              <span>Viteza</span>
              <span className="mono">{vehicle.speed} km/h</span>
            </div>
            <div className="popup-dark-row">
              <span>Vehicul</span>
              <span className="mono">#{vehicle.label}</span>
            </div>
            <div className="popup-dark-row">
              <span>Actualizat</span>
              <span>{timeAgo(vehicle.timestamp)}</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});
VehicleMarker.displayName = 'VehicleMarker';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const MapView = () => {
  const dispatch = useDispatch();
  const { data: vehicles, loading, lastUpdated } = useSelector((s) => s.vehicles);
  const { data: routes } = useSelector((s) => s.routes);
  const { data: trips } = useSelector((s) => s.trips);
  const { data: shapes } = useSelector((s) => s.shapes);
  const intervalRef = useRef(null);
  const mapRef = useRef(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const { theme, tileLayer, cycleTheme } = useMapTheme();

  useEffect(() => {
    dispatch(fetchVehicles());
    if (!routes.length) dispatch(fetchRoutes());
    if (!trips.length) dispatch(fetchTrips());
    if (!shapes.length) dispatch(fetchShapes());
    intervalRef.current = setInterval(() => dispatch(fetchVehicles()), 10000);
    return () => clearInterval(intervalRef.current);
  }, [dispatch, routes.length, trips.length, shapes.length]);

  const routeMap = useMemo(() => {
    const m = {};
    routes.forEach((r) => { m[r.route_id] = r; });
    return m;
  }, [routes]);

  const filteredVehicles = useMemo(() => {
    let v = vehicles.filter((v) => v.latitude && v.longitude);
    if (typeFilter !== null) v = v.filter((veh) => veh.vehicle_type === typeFilter);
    return v;
  }, [vehicles, typeFilter]);

  const activeCount = useMemo(() =>
    filteredVehicles.filter((v) => v.speed > 0).length,
    [filteredVehicles]
  );

  // Build shape polyline for selected vehicle's route
  const selectedRouteShape = useMemo(() => {
    if (!selectedVehicle || !shapes.length || !trips.length) return null;

    // Find the trip for this vehicle
    const vehicleTrip = trips.find((t) => t.trip_id === selectedVehicle.trip_id);
    if (!vehicleTrip) return null;

    // Find shape points for this trip's shape
    const shapeId = vehicleTrip.shape_id;
    const shapePoints = shapes
      .filter((s) => s.shape_id === shapeId)
      .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
      .map((s) => [s.shape_pt_lat, s.shape_pt_lon]);

    if (shapePoints.length === 0) return null;

    const route = routeMap[selectedVehicle.route_id];
    const color = route?.route_type === 0 ? '#10B981'
      : route?.route_type === 11 ? '#F59E0B'
      : '#3B82F6';

    return { points: shapePoints, color, routeName: route?.route_short_name, direction: vehicleTrip.trip_headsign };
  }, [selectedVehicle, shapes, trips, routeMap]);

  const handleMapInteraction = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.closePopup();
    }
  }, []);

  const handleSelectVehicle = useCallback((vehicle) => {
    setSelectedVehicle((prev) => prev?.id === vehicle.id ? null : vehicle);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedVehicle(null);
    if (mapRef.current) mapRef.current.closePopup();
  }, []);

  const clujCenter = [46.7712, 23.6236];

  return (
    <motion.div className="page-map" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {/* Stats Bar */}
      <div className="map-float-stats glass-heavy">
        <div className="map-stat">
          <span className="mono map-stat-value">{filteredVehicles.length}</span>
          <span className="map-stat-label">Total</span>
        </div>
        <div className="map-stat-divider" />
        <div className="map-stat">
          <span className="mono map-stat-value" style={{ color: 'var(--color-success)' }}>{activeCount}</span>
          <span className="map-stat-label">Active</span>
        </div>
        <div className="map-stat-divider" />
        <div className="map-stat">
          <div className="live-dot" />
          <span className="map-stat-label mono">{lastUpdated ? timeAgo(lastUpdated) : '...'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="map-float-controls">
        <button className="map-control-btn glass-heavy" onClick={() => dispatch(fetchVehicles())} disabled={loading} title="Reincarca">
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
        </button>
        <button className={`map-control-btn glass-heavy ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)} title="Filtre">
          <Filter size={18} />
        </button>
        <button className="map-control-btn glass-heavy" onClick={cycleTheme} title={`Tema: ${tileLayer.label}`}>
          <Layers size={18} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div className="map-filter-panel glass-heavy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="filter-header">
            <span>Filtre</span>
            <button onClick={() => setShowFilters(false)}><X size={16} /></button>
          </div>
          <div className="filter-options">
            <button className={`filter-chip ${typeFilter === null ? 'active' : ''}`} onClick={() => setTypeFilter(null)}>Toate</button>
            <button className={`filter-chip bus-chip ${typeFilter === 3 ? 'active' : ''}`} onClick={() => setTypeFilter(typeFilter === 3 ? null : 3)}>
              <Bus size={14} /> Autobuze
            </button>
            <button className={`filter-chip tram-chip ${typeFilter === 0 ? 'active' : ''}`} onClick={() => setTypeFilter(typeFilter === 0 ? null : 0)}>
              <TramFront size={14} /> Tramvaie
            </button>
            <button className={`filter-chip trolley-chip ${typeFilter === 11 ? 'active' : ''}`} onClick={() => setTypeFilter(typeFilter === 11 ? null : 11)}>
              <Zap size={14} /> Troleibuze
            </button>
          </div>
        </motion.div>
      )}

      {/* Route info bar when vehicle selected */}
      {selectedVehicle && selectedRouteShape && (
        <motion.div
          className="map-route-info glass-heavy"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="route-info-content">
            <span className="route-info-number mono" style={{ color: selectedRouteShape.color }}>
              {selectedRouteShape.routeName}
            </span>
            <ArrowRight size={14} className="route-info-arrow" />
            <span className="route-info-direction">{selectedRouteShape.direction}</span>
          </div>
          <button className="route-info-close" onClick={clearSelection}><X size={14} /></button>
        </motion.div>
      )}

      {/* Map */}
      <MapContainer
        center={clujCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        ref={mapRef}
        preferCanvas={true}
      >
        <TileLayer
          key={theme}
          url={tileLayer.url}
          attribution={tileLayer.attribution}
        />
        <MapInit vehicles={filteredVehicles} />
        <MapEventHandler onMapInteraction={handleMapInteraction} />

        {/* Route shape polyline */}
        {selectedRouteShape && (
          <Polyline
            positions={selectedRouteShape.points}
            pathOptions={{
              color: selectedRouteShape.color,
              weight: 4,
              opacity: 0.8,
              dashArray: null,
            }}
          />
        )}

        {/* Vehicle markers */}
        {filteredVehicles.map((vehicle) => {
          const route = routeMap[vehicle.route_id];
          const isActive = vehicle.speed > 0;
          return (
            <VehicleMarker
              key={vehicle.id}
              vehicle={vehicle}
              routeName={route?.route_short_name || ''}
              isActive={isActive}
              onSelect={handleSelectVehicle}
              isSelected={selectedVehicle?.id === vehicle.id}
            />
          );
        })}
      </MapContainer>
    </motion.div>
  );
};

export default MapView;
