import { useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Search, Bus, TramFront, Zap, ChevronRight, X, Navigation, MapPin, Gauge, Clock, Star, ArrowRight } from 'lucide-react';
import { fetchRoutes } from '../store/slices/routesSlice';
import { fetchVehicles } from '../store/slices/vehiclesSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import { fetchStops } from '../store/slices/stopsSlice';
import { fetchStopTimes } from '../store/slices/stopTimesSlice';
import { getVehicleTypeName, getRouteTypeBadgeClass, timeAgo, computeStopETAs } from '../utils/helpers';
import { useFavorites } from '../hooks/useFavorites';
import './Routes.css';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.02 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const RoutesPage = () => {
  const dispatch = useDispatch();
  const { data: routes, loading } = useSelector((s) => s.routes);
  const { data: vehicles } = useSelector((s) => s.vehicles);
  const { data: trips } = useSelector((s) => s.trips);
  const { data: stops } = useSelector((s) => s.stops);
  const { data: stopTimes } = useSelector((s) => s.stopTimes);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [partialFrom, setPartialFrom] = useState(null);
  const [partialTo, setPartialTo] = useState(null);
  const [partialDir, setPartialDir] = useState(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const detailPanelRef = useRef(null);

  useEffect(() => {
    if (!routes.length) dispatch(fetchRoutes());
    if (!vehicles.length) dispatch(fetchVehicles());
    if (!trips.length) dispatch(fetchTrips());
    if (!stops.length) dispatch(fetchStops());
    if (!stopTimes.length) dispatch(fetchStopTimes());
  }, [dispatch, routes.length, vehicles.length, trips.length, stops.length, stopTimes.length]);

  const vehiclesByRoute = useMemo(() => {
    const m = {};
    vehicles.forEach((v) => {
      if (v.route_id) {
        if (!m[v.route_id]) m[v.route_id] = [];
        m[v.route_id].push(v);
      }
    });
    return m;
  }, [vehicles]);

  const stopMap = useMemo(() => {
    const m = {};
    stops.forEach((s) => { m[s.stop_id] = s; });
    return m;
  }, [stops]);

  const tripMap = useMemo(() => {
    const m = {};
    trips.forEach((t) => { m[t.trip_id] = t; });
    return m;
  }, [trips]);

  const filtered = useMemo(() => {
    let r = [...routes];
    if (typeFilter !== null) r = r.filter((route) => route.route_type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (route) =>
          route.route_short_name?.toLowerCase().includes(q) ||
          route.route_long_name?.toLowerCase().includes(q)
      );
    }
    r.sort((a, b) => {
      const aNum = parseInt(a.route_short_name) || 999;
      const bNum = parseInt(b.route_short_name) || 999;
      if (aNum !== bNum) return aNum - bNum;
      return (a.route_short_name || '').localeCompare(b.route_short_name || '');
    });
    return r;
  }, [routes, typeFilter, search, vehiclesByRoute]);

  const selectedRoute = routes.find((r) => r.route_id === selectedRouteId);

  // Get stop sequence for selected route (both directions)
  const routeStops = useMemo(() => {
    if (!selectedRouteId || !stopTimes.length) return {};

    const routeTrips = trips.filter((t) => t.route_id === selectedRouteId);
    const result = {};

    routeTrips.forEach((trip) => {
      const dirLabel = trip.trip_headsign || `Directia ${trip.direction_id}`;
      const tripStopTimes = stopTimes
        .filter((st) => st.trip_id === trip.trip_id)
        .sort((a, b) => a.stop_sequence - b.stop_sequence);

      const stopsInOrder = tripStopTimes.map((st) => ({
        ...st,
        stop: stopMap[st.stop_id],
      }));

      result[trip.direction_id] = {
        label: dirLabel,
        tripId: trip.trip_id,
        stops: stopsInOrder,
      };
    });

    return result;
  }, [selectedRouteId, stopTimes, trips, stopMap]);

  const routeVehicles = vehiclesByRoute[selectedRouteId] || [];

  // Compute ETAs per direction for the selected route
  const directionETAs = useMemo(() => {
    if (!selectedRouteId || !routeVehicles.length || !Object.keys(routeStops).length) return {};

    const result = {};
    Object.entries(routeStops).forEach(([dirId, dir]) => {
      // Get vehicles going in this direction
      const dirVehicles = routeVehicles.filter((v) => {
        const trip = tripMap[v.trip_id];
        return trip && trip.direction_id === parseInt(dirId);
      });
      if (dirVehicles.length > 0) {
        result[dirId] = computeStopETAs(dirVehicles, dir.stops, stopMap, tripMap);
      }
    });
    return result;
  }, [selectedRouteId, routeVehicles, routeStops, tripMap, stopMap]);

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <motion.div className="page-header" variants={cardVariants}>
        <h1>Rute</h1>
        <p>{filtered.length} rute disponibile</p>
      </motion.div>

      {/* Controls */}
      <motion.div className="vehicles-controls" variants={cardVariants}>
        <div className="search-box glass">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Cauta ruta..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
        <button className="btn-ghost" onClick={() => dispatch(fetchRoutes())} disabled={loading}>
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
                  <span className={`badge ${getRouteTypeBadgeClass(selectedRoute.route_type)}`}>
                    {getVehicleTypeName(selectedRoute.route_type)}
                  </span>
                </div>
              </div>
              <div className="rdp-actions">
                <button
                  className={`rdp-fav-btn ${isFavorite(`route-${selectedRoute.route_id}`) ? 'is-fav' : ''}`}
                  onClick={() => toggleFavorite({
                    id: `route-${selectedRoute.route_id}`,
                    type: 'route',
                    routeId: selectedRoute.route_id,
                    routeName: selectedRoute.route_short_name,
                    routeLongName: selectedRoute.route_long_name,
                  })}
                  title={isFavorite(`route-${selectedRoute.route_id}`) ? 'Sterge din favorite' : 'Adauga la favorite'}
                >
                  <Star size={18} fill={isFavorite(`route-${selectedRoute.route_id}`) ? 'currentColor' : 'none'} />
                </button>
                <button className="rdp-close" onClick={() => { setSelectedRouteId(null); setPartialFrom(null); setPartialTo(null); setPartialDir(null); }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Active vehicles */}
            {routeVehicles.length > 0 && (
              <div className="rdp-section">
                <h4 className="rdp-section-title">
                  <Bus size={16} />
                  {routeVehicles.length} vehicule active
                </h4>
                <div className="rdp-vehicles">
                  {routeVehicles.map((v) => {
                    const trip = tripMap[v.trip_id];
                    return (
                      <div key={v.id} className="rdp-vehicle-row">
                        <div className={`rdp-status-dot ${v.speed > 0 ? 'active' : 'inactive'}`} />
                        <div className="rdp-vehicle-info">
                          <span className="rdp-vehicle-label mono">#{v.label}</span>
                          <div className="rdp-vehicle-direction">
                            <Navigation size={12} />
                            <span>{trip?.trip_headsign || '—'}</span>
                          </div>
                        </div>
                        <div className="rdp-vehicle-speed">
                          <Gauge size={14} />
                          <span className="mono">{v.speed} km/h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stop sequence by direction */}
            {Object.entries(routeStops).map(([dirId, dir]) => {
              const isThisDir = partialDir === parseInt(dirId);
              const fromIdx = isThisDir && partialFrom !== null ? dir.stops.findIndex((s) => s.stop_id === partialFrom) : -1;
              const toIdx = isThisDir && partialTo !== null ? dir.stops.findIndex((s) => s.stop_id === partialTo) : -1;

              return (
                <div key={dirId} className="rdp-section">
                  <div className="rdp-section-header">
                    <h4 className="rdp-section-title">
                      <Navigation size={16} />
                      {dir.label}
                    </h4>
                    <span className="stop-select-hint">Click pe statii pentru ruta partiala</span>
                  </div>

                  {/* Partial route save button */}
                  {isThisDir && partialFrom !== null && partialTo !== null && (
                    <div className="partial-route-bar">
                      <div className="partial-route-info">
                        <MapPin size={14} />
                        <span>{dir.stops.find((s) => s.stop_id === partialFrom)?.stop?.stop_name}</span>
                        <ArrowRight size={14} />
                        <span>{dir.stops.find((s) => s.stop_id === partialTo)?.stop?.stop_name}</span>
                      </div>
                      <button
                        className="btn-accent btn-sm"
                        onClick={() => {
                          const fromStop = dir.stops.find((s) => s.stop_id === partialFrom);
                          const toStop = dir.stops.find((s) => s.stop_id === partialTo);
                          toggleFavorite({
                            id: `partial-${selectedRoute.route_id}-${partialFrom}-${partialTo}`,
                            type: 'partial_route',
                            routeId: selectedRoute.route_id,
                            routeName: selectedRoute.route_short_name,
                            routeLongName: selectedRoute.route_long_name,
                            fromStopId: partialFrom,
                            fromStopName: fromStop?.stop?.stop_name || '',
                            toStopId: partialTo,
                            toStopName: toStop?.stop?.stop_name || '',
                            directionId: parseInt(dirId),
                          });
                          setPartialFrom(null);
                          setPartialTo(null);
                          setPartialDir(null);
                        }}
                      >
                        <Star size={14} />
                        <span>Salveaza ruta partiala</span>
                      </button>
                      <button className="btn-ghost btn-sm" onClick={() => { setPartialFrom(null); setPartialTo(null); setPartialDir(null); }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div className="stop-timeline">
                    {dir.stops.map((st, idx) => {
                      const isFrom = isThisDir && st.stop_id === partialFrom;
                      const isTo = isThisDir && st.stop_id === partialTo;
                      const inRange = isThisDir && fromIdx >= 0 && toIdx >= 0 && idx >= fromIdx && idx <= toIdx;
                      const stopETA = directionETAs[dirId]?.[st.stop_id];

                      return (
                        <div
                          key={`${st.stop_id}-${idx}`}
                          className={`stop-timeline-item ${inRange ? 'stop-in-range' : ''} ${isFrom || isTo ? 'stop-selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const dir_id = parseInt(dirId);
                            if (partialDir !== dir_id) {
                              setPartialDir(dir_id);
                              setPartialFrom(st.stop_id);
                              setPartialTo(null);
                            } else if (partialFrom === null) {
                              setPartialFrom(st.stop_id);
                            } else if (partialTo === null) {
                              // Ensure from < to
                              const fromI = dir.stops.findIndex((s) => s.stop_id === partialFrom);
                              if (idx > fromI) {
                                setPartialTo(st.stop_id);
                              } else if (idx < fromI) {
                                setPartialTo(partialFrom);
                                setPartialFrom(st.stop_id);
                              }
                            } else {
                              // Reset and start new
                              setPartialFrom(st.stop_id);
                              setPartialTo(null);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="stop-timeline-line">
                            <div className={`stop-dot ${idx === 0 || idx === dir.stops.length - 1 ? 'stop-dot-terminal' : ''} ${isFrom || isTo ? 'stop-dot-selected' : ''}`} />
                            {idx < dir.stops.length - 1 && <div className={`stop-connector ${inRange ? 'stop-connector-active' : ''}`} />}
                          </div>
                          <div className="stop-timeline-content">
                            <span className="stop-name">{st.stop?.stop_name || `Statie #${st.stop_id}`}</span>
                            <div className="stop-meta">
                              {stopETA && stopETA.eta > 0 && (
                                <span className="stop-eta" title={`Vehicul #${stopETA.vehicleLabel}`}>
                                  <Clock size={12} />
                                  ~{stopETA.eta} min
                                </span>
                              )}
                              {stopETA && stopETA.eta === 0 && (
                                <span className="stop-eta stop-eta-now">
                                  <Clock size={12} />
                                  acum
                                </span>
                              )}
                              {(isFrom || isTo) && (
                                <span className="stop-marker-label">{isFrom ? 'De la' : 'Pana la'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Routes Grid */}
      <motion.div className="routes-grid" variants={cardVariants}>
        {filtered.map((route) => {
          const activeCount = vehiclesByRoute[route.route_id]?.length || 0;
          const isSelected = selectedRouteId === route.route_id;
          return (
            <motion.div
              key={route.route_id}
              className={`route-card glass-card ${isSelected ? 'card-highlighted' : ''}`}
              variants={cardVariants}
              layout
              onClick={() => {
                const newId = isSelected ? null : route.route_id;
                setSelectedRouteId(newId);
                if (newId) {
                  setTimeout(() => {
                    detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }
              }}
            >
              <div className="rcard-left">
                <div
                  className="rcard-number-box"
                  style={{
                    background: route.route_color && route.route_color !== '#000'
                      ? `${route.route_color}20`
                      : 'var(--bg-surface-hover)',
                    borderColor: route.route_color && route.route_color !== '#000'
                      ? `${route.route_color}40`
                      : 'var(--border-glass)',
                  }}
                >
                  <span
                    className="rcard-number mono"
                    style={{
                      color: route.route_color && route.route_color !== '#000'
                        ? route.route_color
                        : 'var(--text-primary)',
                    }}
                  >
                    {route.route_short_name}
                  </span>
                </div>
              </div>

              <div className="rcard-center">
                <div className="rcard-top-row">
                  <span className={`badge ${getRouteTypeBadgeClass(route.route_type)}`}>
                    {getVehicleTypeName(route.route_type)}
                  </span>
                  {activeCount > 0 && (
                    <span className="badge badge-success">
                      <div className="live-dot" style={{ width: 6, height: 6 }} />
                      {activeCount} vehicule
                    </span>
                  )}
                </div>
                <h3 className="rcard-name">{route.route_long_name}</h3>
              </div>

              <div className="rcard-right">
                <ChevronRight size={18} className={`rcard-chevron ${isSelected ? 'rcard-chevron-open' : ''}`} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && !loading && (
        <div className="empty-state glass-card">
          <Bus size={48} strokeWidth={1} />
          <h3>Nicio ruta gasita</h3>
          <p>Incearca sa schimbi filtrele sau termenul de cautare.</p>
        </div>
      )}
    </motion.div>
  );
};

export default RoutesPage;
