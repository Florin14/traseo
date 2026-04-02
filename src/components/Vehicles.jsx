import { useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Search, Bus, TramFront, Zap, Gauge, Clock, X, ArrowRight, MapPin, Navigation } from 'lucide-react';
import { fetchVehicles } from '../store/slices/vehiclesSlice';
import { fetchRoutes } from '../store/slices/routesSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import { getVehicleTypeName, getVehicleTypeBadgeClass, timeAgo } from '../utils/helpers';
import './Vehicles.css';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.02 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const Vehicles = () => {
  const dispatch = useDispatch();
  const { data: vehicles, loading } = useSelector((s) => s.vehicles);
  const { data: routes } = useSelector((s) => s.routes);
  const { data: trips } = useSelector((s) => s.trips);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const detailPanelRef = useRef(null);

  useEffect(() => {
    if (!vehicles.length) dispatch(fetchVehicles());
    if (!routes.length) dispatch(fetchRoutes());
    if (!trips.length) dispatch(fetchTrips());
  }, [dispatch, vehicles.length, routes.length, trips.length]);

  const routeMap = useMemo(() => {
    const m = {};
    routes.forEach((r) => { m[r.route_id] = r; });
    return m;
  }, [routes]);

  const tripMap = useMemo(() => {
    const m = {};
    trips.forEach((t) => { m[t.trip_id] = t; });
    return m;
  }, [trips]);

  // Group vehicles by route, sorted
  const sortedVehicles = useMemo(() => {
    let v = vehicles.filter((veh) => veh.latitude && veh.longitude && veh.route_id);
    if (typeFilter !== null) v = v.filter((veh) => veh.vehicle_type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      v = v.filter((veh) => {
        const route = routeMap[veh.route_id];
        return (
          veh.label?.toLowerCase().includes(q) ||
          route?.route_short_name?.toLowerCase().includes(q) ||
          route?.route_long_name?.toLowerCase().includes(q)
        );
      });
    }
    // Sort: active first (by route number asc), then inactive (by route number asc)
    v.sort((a, b) => {
      const aActive = a.speed > 0 ? 0 : 1;
      const bActive = b.speed > 0 ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      const aRoute = routeMap[a.route_id];
      const bRoute = routeMap[b.route_id];
      const aNum = parseInt(aRoute?.route_short_name) || 999;
      const bNum = parseInt(bRoute?.route_short_name) || 999;
      if (aNum !== bNum) return aNum - bNum;
      return (a.label || '').localeCompare(b.label || '');
    });
    return v;
  }, [vehicles, typeFilter, search, routeMap]);

  const activeCount = sortedVehicles.filter((v) => v.speed > 0).length;

  // When a vehicle card is clicked, show all vehicles on that route
  const selectedRouteVehicles = useMemo(() => {
    if (!selectedRoute) return [];
    return vehicles
      .filter((v) => v.route_id === selectedRoute.route_id && v.latitude && v.longitude)
      .sort((a, b) => {
        // Sort by direction, then by speed
        const aTripDir = tripMap[a.trip_id]?.direction_id ?? 0;
        const bTripDir = tripMap[b.trip_id]?.direction_id ?? 0;
        if (aTripDir !== bTripDir) return aTripDir - bTripDir;
        return b.speed - a.speed;
      });
  }, [selectedRoute, vehicles, tripMap]);

  const handleCardClick = (vehicle) => {
    const route = routeMap[vehicle.route_id];
    if (!route) return;
    const isToggleOff = selectedRoute?.route_id === route.route_id;
    setSelectedRoute(isToggleOff ? null : route);
    // Scroll to detail panel when opening
    if (!isToggleOff) {
      setTimeout(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <motion.div className="page-header" variants={cardVariants}>
        <h1>Vehicule</h1>
        <p>{sortedVehicles.length} vehicule &middot; {activeCount} active</p>
      </motion.div>

      {/* Controls */}
      <motion.div className="vehicles-controls" variants={cardVariants}>
        <div className="search-box glass">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cauta vehicul sau ruta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="type-filters">
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
        <button className="btn-ghost" onClick={() => dispatch(fetchVehicles())} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          <span>Reincarca</span>
        </button>
      </motion.div>

      {/* Route Detail Panel */}
      <AnimatePresence>
        {selectedRoute && (
          <motion.div
            ref={detailPanelRef}
            className="route-detail-panel glass-card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="rdp-header">
              <div className="rdp-title">
                <span className="rdp-number mono" style={{
                  color: selectedRoute.route_type === 0 ? 'var(--color-tram)'
                    : selectedRoute.route_type === 11 ? '#F59E0B'
                    : 'var(--color-bus)'
                }}>
                  {selectedRoute.route_short_name}
                </span>
                <div>
                  <h3>{selectedRoute.route_long_name}</h3>
                  <span className={`badge ${getVehicleTypeBadgeClass(selectedRoute.route_type)}`}>
                    {getVehicleTypeName(selectedRoute.route_type)}
                  </span>
                </div>
              </div>
              <button className="rdp-close" onClick={() => setSelectedRoute(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="rdp-vehicles">
              {selectedRouteVehicles.length === 0 ? (
                <p className="rdp-empty">Niciun vehicul activ pe aceasta ruta.</p>
              ) : (
                selectedRouteVehicles.map((v) => {
                  const trip = tripMap[v.trip_id];
                  return (
                    <div key={v.id} className="rdp-vehicle-row">
                      <div className={`rdp-status-dot ${v.speed > 0 ? 'active' : 'inactive'}`} />
                      <div className="rdp-vehicle-info">
                        <span className="rdp-vehicle-label mono">#{v.label}</span>
                        <div className="rdp-vehicle-direction">
                          <Navigation size={12} />
                          <span>{trip?.trip_headsign || 'Directie necunoscuta'}</span>
                        </div>
                      </div>
                      <div className="rdp-vehicle-speed">
                        <Gauge size={14} />
                        <span className="mono">{v.speed} km/h</span>
                      </div>
                      <div className="rdp-vehicle-time">
                        <Clock size={14} />
                        <span>{timeAgo(v.timestamp)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <motion.div className="vehicles-grid" variants={cardVariants}>
        {sortedVehicles.map((vehicle) => {
          const route = routeMap[vehicle.route_id];
          const isActive = vehicle.speed > 0;
          const trip = tripMap[vehicle.trip_id];
          const isRouteSelected = selectedRoute?.route_id === vehicle.route_id;
          return (
            <motion.div
              key={vehicle.id}
              className={`vehicle-card glass-card ${isRouteSelected ? 'card-highlighted' : ''}`}
              variants={cardVariants}
              layout
              onClick={() => handleCardClick(vehicle)}
              style={{ cursor: 'pointer' }}
            >
              <div className="vcard-top">
                <div className="vcard-route">
                  <span className="vcard-route-number mono">
                    {route?.route_short_name || '—'}
                  </span>
                  <span className={`badge ${getVehicleTypeBadgeClass(vehicle.vehicle_type)}`}>
                    {getVehicleTypeName(vehicle.vehicle_type)}
                  </span>
                </div>
                <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                  {isActive ? 'Activ' : 'Stationat'}
                </span>
              </div>

              {route && <p className="vcard-route-name">{route.route_long_name}</p>}

              <div className="vcard-details">
                {trip && (
                  <div className="vcard-detail">
                    <Navigation size={14} />
                    <span>{trip.trip_headsign}</span>
                  </div>
                )}
                <div className="vcard-detail">
                  <Gauge size={14} />
                  <span className="mono">{vehicle.speed} km/h</span>
                </div>
                <div className="vcard-detail">
                  <Clock size={14} />
                  <span>{timeAgo(vehicle.timestamp)}</span>
                </div>
              </div>

              <div className="vcard-footer">
                <span className="vcard-label">#{vehicle.label}</span>
                <span className="vcard-tap-hint">Click pentru detalii ruta</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {sortedVehicles.length === 0 && !loading && (
        <div className="empty-state glass-card">
          <Bus size={48} strokeWidth={1} />
          <h3>Niciun vehicul gasit</h3>
          <p>Incearca sa schimbi filtrele sau termenul de cautare.</p>
        </div>
      )}
    </motion.div>
  );
};

export default Vehicles;
