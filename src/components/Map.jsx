import { useEffect, useRef, useMemo, useState, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Bus, TramFront, Zap, Filter, X, Layers, ArrowRight,
  Search, Crosshair, Navigation, MapPin
} from 'lucide-react';
import { fetchVehicles } from '../store/slices/vehiclesSlice';
import { fetchRoutes } from '../store/slices/routesSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import { fetchShapes } from '../store/slices/shapesSlice';
import { getVehicleTypeName, timeAgo } from '../utils/helpers';
import { useMapTheme } from '../hooks/useMapTheme';
import DirectionArrows from './map/DirectionArrows';
import './Map.css';

delete L.Icon.Default.prototype._getIconUrl;

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

const userLocationIcon = L.divIcon({
  html: `<div class="user-pin">
    <div class="user-pin-head"></div>
    <div class="user-pin-stem"></div>
    <div class="user-pin-shadow"></div>
  </div>`,
  className: 'user-pin-wrap',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Only close popups on map interaction, NOT panels
const MapEventHandler = ({ mapRef }) => {
  useMapEvents({
    click: () => mapRef.current?.closePopup(),
    zoomstart: () => mapRef.current?.closePopup(),
    dragstart: () => mapRef.current?.closePopup(),
  });
  return null;
};

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

const VehicleMarker = memo(({ vehicle, routeName, isActive, onSelect }) => (
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
          <div className="popup-dark-row"><span>Tip</span><span>{getVehicleTypeName(vehicle.vehicle_type)}</span></div>
          <div className="popup-dark-row"><span>Viteza</span><span className="mono">{vehicle.speed} km/h</span></div>
          <div className="popup-dark-row"><span>Vehicul</span><span className="mono">#{vehicle.label}</span></div>
          <div className="popup-dark-row"><span>Actualizat</span><span>{timeAgo(vehicle.timestamp)}</span></div>
        </div>
      </div>
    </Popup>
  </Marker>
));
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
  const { data: shapesIndex, loaded: shapesLoaded } = useSelector((s) => s.shapes);
  const intervalRef = useRef(null);
  const mapRef = useRef(null);

  const [typeFilter, setTypeFilter] = useState(null);
  const [routeFilter, setRouteFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locatingUser, setLocatingUser] = useState(false);

  const { theme, tileLayer, cycleTheme } = useMapTheme();

  // Only fetch essentials at mount. Shapes fetched lazily on first vehicle select.
  useEffect(() => {
    dispatch(fetchVehicles());
    if (!routes.length) dispatch(fetchRoutes());
    if (!trips.length) dispatch(fetchTrips());
    intervalRef.current = setInterval(() => dispatch(fetchVehicles()), 10000);
    return () => clearInterval(intervalRef.current);
  }, [dispatch, routes.length, trips.length]);

  // Lazy fetch shapes when user first selects a vehicle
  useEffect(() => {
    if (selectedVehicle && !shapesLoaded) {
      dispatch(fetchShapes());
    }
  }, [selectedVehicle, shapesLoaded, dispatch]);

  const routeMap = useMemo(() => {
    const m = {};
    routes.forEach((r) => { m[r.route_id] = r; });
    return m;
  }, [routes]);

  const filteredVehicles = useMemo(() => {
    let v = vehicles.filter((v) => v.latitude && v.longitude);
    if (typeFilter !== null) v = v.filter((veh) => veh.vehicle_type === typeFilter);
    if (routeFilter.trim()) {
      const q = routeFilter.trim().toLowerCase();
      v = v.filter((veh) => {
        const r = routeMap[veh.route_id];
        return r?.route_short_name?.toLowerCase() === q;
      });
    }
    return v;
  }, [vehicles, typeFilter, routeFilter, routeMap]);

  const activeCount = useMemo(() => filteredVehicles.filter((v) => v.speed > 0).length, [filteredVehicles]);

  const selectedRouteShape = useMemo(() => {
    if (!selectedVehicle || !shapesLoaded || !trips.length) return null;
    const vehicleTrip = trips.find((t) => t.trip_id === selectedVehicle.trip_id);
    if (!vehicleTrip) return null;
    // O(1) lookup from pre-indexed shapes
    const rawPoints = shapesIndex[vehicleTrip.shape_id];
    if (!rawPoints?.length) return null;
    const shapePoints = rawPoints.map((s) => [s.shape_pt_lat, s.shape_pt_lon]);
    const route = routeMap[selectedVehicle.route_id];
    const color = route?.route_type === 0 ? '#10B981' : route?.route_type === 11 ? '#F59E0B' : '#3B82F6';
    return { points: shapePoints, color, routeName: route?.route_short_name, direction: vehicleTrip.trip_headsign };
  }, [selectedVehicle, shapesLoaded, shapesIndex, trips, routeMap]);

  const handleSelectVehicle = useCallback((vehicle) => {
    setSelectedVehicle((prev) => prev?.id === vehicle.id ? null : vehicle);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedVehicle(null);
    mapRef.current?.closePopup();
  }, []);

  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocatingUser(false);
        if (mapRef.current) {
          mapRef.current.setView([loc.lat, loc.lng], 15, { animate: true });
        }
      },
      () => setLocatingUser(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Stop propagation on floating UI so map doesn't steal events
  const stopProp = useCallback((e) => e.stopPropagation(), []);

  const clujCenter = [46.7712, 23.6236];

  return (
    <motion.div className="page-map" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {/* Stats Bar */}
      <div className="map-float-stats glass-heavy" onPointerDown={stopProp} onClick={stopProp}>
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
      <div className="map-float-controls" onPointerDown={stopProp} onClick={stopProp}>
        <button className="map-control-btn glass-heavy" onClick={() => dispatch(fetchVehicles())} disabled={loading} title="Reincarca">
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
        </button>
        <button className={`map-control-btn glass-heavy ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)} title="Filtre">
          <Filter size={18} />
        </button>
        <button className="map-control-btn glass-heavy" onClick={cycleTheme} title={`Tema: ${tileLayer.label}`}>
          <Layers size={18} />
        </button>
        <button
          className={`map-control-btn glass-heavy ${userLocation ? 'active' : ''}`}
          onClick={handleLocateUser}
          disabled={locatingUser}
          title="Locatia mea"
        >
          <Crosshair size={18} className={locatingUser ? 'spinning' : ''} />
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="map-filter-panel glass-heavy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onPointerDown={stopProp}
            onClick={stopProp}
          >
            <div className="filter-header">
              <span>Filtre</span>
              <button onClick={() => setShowFilters(false)}><X size={16} /></button>
            </div>

            {/* Route number search */}
            <div className="map-route-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Nr. linie (ex: 10)"
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
              />
              {routeFilter && (
                <button onClick={() => setRouteFilter('')}><X size={12} /></button>
              )}
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

            {routeFilter && (
              <div className="filter-result-count">
                {filteredVehicles.length} vehicule pe linia {routeFilter}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Route info bar */}
      <AnimatePresence>
        {selectedVehicle && selectedRouteShape && (
          <motion.div
            className="map-route-info glass-heavy"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onPointerDown={stopProp}
            onClick={stopProp}
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
      </AnimatePresence>

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
        <TileLayer key={theme} url={tileLayer.url} attribution={tileLayer.attribution} />
        <MapInit vehicles={filteredVehicles} />
        <MapEventHandler mapRef={mapRef} />

        {/* User location */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={50}
              pathOptions={{ color: '#0EA5E9', fillColor: '#0EA5E9', fillOpacity: 0.1, weight: 1 }}
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
              <Popup className="dark-popup">
                <div className="popup-dark">
                  <div className="popup-dark-header">
                    <span className="popup-dark-route">Tu esti aici</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Route shape: outline + colored line + direction arrows */}
        {selectedRouteShape && (
          <>
            {/* Dark outline for contrast on any map theme */}
            <Polyline
              positions={selectedRouteShape.points}
              pathOptions={{ color: '#000000', weight: 8, opacity: 0.4, lineCap: 'round', lineJoin: 'round' }}
            />
            {/* Main colored line */}
            <Polyline
              positions={selectedRouteShape.points}
              pathOptions={{ color: selectedRouteShape.color, weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
            />
            {/* Direction arrows on top */}
            <DirectionArrows
              points={selectedRouteShape.points}
              color="#FFFFFF"
            />
          </>
        )}

        {/* Vehicle markers */}
        {filteredVehicles.map((vehicle) => {
          const route = routeMap[vehicle.route_id];
          return (
            <VehicleMarker
              key={vehicle.id}
              vehicle={vehicle}
              routeName={route?.route_short_name || ''}
              isActive={vehicle.speed > 0}
              onSelect={handleSelectVehicle}
            />
          );
        })}
      </MapContainer>
    </motion.div>
  );
};

export default MapView;
