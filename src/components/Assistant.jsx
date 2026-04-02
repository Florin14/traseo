import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, TrendingUp, TrendingDown, DollarSign, Route, MapPin, ArrowRight,
  Plus, Trash2, Search, Zap, Bus, Clock, Star, AlertTriangle, CheckCircle,
  Navigation, ChevronDown, ChevronUp, Sparkles, Settings
} from 'lucide-react';
import { fetchVehicles } from '../store/slices/vehiclesSlice';
import { fetchRoutes } from '../store/slices/routesSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import { fetchStops } from '../store/slices/stopsSlice';
import { fetchStopTimes } from '../store/slices/stopTimesSlice';
import { useCostTracker } from '../hooks/useCostTracker';
import { useFavorites } from '../hooks/useFavorites';
import { useRouteFinder } from '../hooks/useRouteFinder';
import { useSettings } from '../hooks/useSettings';
import { getVehicleTypeName, getVehicleTypeBadgeClass } from '../utils/helpers';
import './Assistant.css';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.06 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const Assistant = () => {
  const dispatch = useDispatch();
  const { data: vehicles } = useSelector((s) => s.vehicles);
  const { data: routes } = useSelector((s) => s.routes);
  const { data: trips } = useSelector((s) => s.trips);
  const { data: stops } = useSelector((s) => s.stops);
  const { data: stopTimes } = useSelector((s) => s.stopTimes);
  const { settings, updateSetting } = useSettings();
  const { trips: costTrips, addTrip, removeTrip, stats } = useCostTracker(settings.ticketPrice, settings.monthlyPassPrice);
  const { favorites } = useFavorites();
  const { findRoutes } = useRouteFinder(stops, stopTimes, trips, routes);

  const [showAddTrip, setShowAddTrip] = useState(false);
  const [tripRoute, setTripRoute] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Route finder state
  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');
  const [fromResults, setFromResults] = useState([]);
  const [toResults, setToResults] = useState([]);
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);
  const [foundRoutes, setFoundRoutes] = useState([]);

  useEffect(() => {
    if (!vehicles.length) dispatch(fetchVehicles());
    if (!routes.length) dispatch(fetchRoutes());
    if (!trips.length) dispatch(fetchTrips());
    if (!stops.length) dispatch(fetchStops());
    if (!stopTimes.length) dispatch(fetchStopTimes());
  }, [dispatch, vehicles.length, routes.length, trips.length, stops.length, stopTimes.length]);

  const routeMap = useMemo(() => {
    const m = {};
    routes.forEach((r) => { m[r.route_id] = r; });
    return m;
  }, [routes]);

  // Auto-search stops
  useEffect(() => {
    if (fromStop.length >= 2) {
      const q = fromStop.toLowerCase();
      setFromResults(stops.filter((s) => s.stop_name?.toLowerCase().includes(q)).slice(0, 5));
    } else {
      setFromResults([]);
    }
  }, [fromStop, stops]);

  useEffect(() => {
    if (toStop.length >= 2) {
      const q = toStop.toLowerCase();
      setToResults(stops.filter((s) => s.stop_name?.toLowerCase().includes(q)).slice(0, 5));
    } else {
      setToResults([]);
    }
  }, [toStop, stops]);

  // Find routes when both stops selected
  useEffect(() => {
    if (selectedFrom && selectedTo) {
      const results = findRoutes(selectedFrom.stop_id, selectedTo.stop_id);
      setFoundRoutes(results);
    } else {
      setFoundRoutes([]);
    }
  }, [selectedFrom, selectedTo, findRoutes]);

  // Build smart insights
  const insights = useMemo(() => {
    const items = [];

    // Savings vs taxi
    if (stats.thisMonthTrips > 0) {
      items.push({
        id: 'taxi-savings',
        icon: TrendingUp,
        color: 'var(--color-success)',
        title: `Ai economisit ~${stats.savedVsTaxi} RON fata de taxi`,
        desc: `${stats.thisMonthTrips} calatorii luna aceasta. Cu taxi ar fi costat ~${stats.taxiEquivalent} RON.`,
        type: 'positive',
      });
    }

    // Pass recommendation
    if (stats.passWorthIt) {
      items.push({
        id: 'pass-rec',
        icon: Star,
        color: '#F59E0B',
        title: `Abonamentul ti-ar economisi ~${stats.projectedMonthly - stats.monthlyPassPrice} RON/luna`,
        desc: `La ritmul actual (${stats.avgPerDay} RON/zi), un abonament de ${stats.monthlyPassPrice} RON e mai avantajos.`,
        type: 'suggestion',
      });
    } else if (stats.thisMonthTrips > 0) {
      items.push({
        id: 'pass-not-yet',
        icon: CheckCircle,
        color: 'var(--color-success)',
        title: 'Biletele individuale sunt inca mai avantajoase',
        desc: `Ai cheltuit ${stats.thisMonthTotal} RON (abonament = ${stats.monthlyPassPrice} RON). Mai ai nevoie de ${stats.breakEvenTrips - stats.thisMonthTrips} calatorii pentru a merita abonamentul.`,
        type: 'info',
      });
    }

    // Spending trend
    if (stats.lastMonthTotal > 0 && stats.thisMonthTotal > 0) {
      const diff = stats.thisMonthTotal - stats.lastMonthTotal;
      if (Math.abs(diff) > 5) {
        items.push({
          id: 'trend',
          icon: diff > 0 ? TrendingUp : TrendingDown,
          color: diff > 0 ? 'var(--color-warning)' : 'var(--color-success)',
          title: diff > 0
            ? `Cheltuielile au crescut cu ${diff} RON fata de luna trecuta`
            : `Cheltuielile au scazut cu ${Math.abs(diff)} RON fata de luna trecuta`,
          desc: `Luna trecuta: ${stats.lastMonthTotal} RON. Luna aceasta: ${stats.thisMonthTotal} RON.`,
          type: diff > 0 ? 'warning' : 'positive',
        });
      }
    }

    // Favorite route status
    const favRoutes = favorites.filter((f) => f.type === 'route' || f.type === 'partial_route');
    favRoutes.slice(0, 2).forEach((fav) => {
      const routeVehicles = vehicles.filter((v) => v.route_id === fav.routeId);
      const activeCount = routeVehicles.filter((v) => v.speed > 0).length;
      if (routeVehicles.length > 0) {
        items.push({
          id: `fav-status-${fav.id}`,
          icon: Bus,
          color: activeCount > 0 ? 'var(--color-success)' : 'var(--color-danger)',
          title: `Ruta ${fav.routeName}: ${activeCount > 0 ? `${activeCount} vehicule active` : 'niciun vehicul activ'}`,
          desc: activeCount > 0
            ? `${routeVehicles.length} vehicule total pe traseul ${fav.routeLongName}.`
            : `Niciun vehicul pe traseu momentan. Verifica din nou mai tarziu.`,
          type: activeCount > 0 ? 'info' : 'warning',
        });
      }
    });

    // Top route insight
    if (stats.topRoutes.length > 0) {
      const top = stats.topRoutes[0];
      items.push({
        id: 'top-route',
        icon: Route,
        color: 'var(--text-accent)',
        title: `Ruta ta cea mai folosita: ${top.name}`,
        desc: `${top.count} calatorii luna aceasta. ${stats.topRoutes.length > 1 ? `Urmeaza: ${stats.topRoutes.slice(1).map((r) => r.name).join(', ')}.` : ''}`,
        type: 'info',
      });
    }

    // No data yet
    if (stats.thisMonthTrips === 0) {
      items.push({
        id: 'start',
        icon: Sparkles,
        color: 'var(--text-accent)',
        title: 'Incepe sa iti loghezi calatoriile',
        desc: 'Adauga prima calatorie si voi calcula economiile tale, voi compara cu abonamentul si voi sugera optimizari.',
        type: 'suggestion',
      });
    }

    return items;
  }, [stats, vehicles, favorites]);

  const handleAddTrip = () => {
    addTrip({ routeName: tripRoute, cost: stats.ticketPrice });
    setTripRoute('');
    setShowAddTrip(false);
  };

  const recentTrips = costTrips.slice(-10).reverse();

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {/* Header */}
      <motion.div className="page-header" variants={itemVariants}>
        <h1>Asistent Transit</h1>
        <p>Insights, economii si planificare rute</p>
      </motion.div>

      {/* Insights Section */}
      <motion.div className="ast-section" variants={itemVariants}>
        <h2 className="ast-section-title">
          <Sparkles size={18} />
          Insights
        </h2>
        <div className="ast-insights">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={insight.id}
                className={`ast-insight glass-card insight-${insight.type}`}
                variants={itemVariants}
              >
                <div className="insight-icon" style={{ color: insight.color }}>
                  <Icon size={20} />
                </div>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Cost Tracker */}
      <motion.div className="ast-section" variants={itemVariants}>
        <div className="ast-section-header">
          <h2 className="ast-section-title">
            <DollarSign size={18} />
            Cost Tracker
          </h2>
          <button className="btn-accent btn-sm" onClick={() => setShowAddTrip(!showAddTrip)}>
            <Plus size={14} />
            <span>Adauga calatorie</span>
          </button>
        </div>

        {/* Quick Add */}
        <AnimatePresence>
          {showAddTrip && (
            <motion.div
              className="ast-add-trip glass-card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="add-trip-form">
                <input
                  type="text"
                  placeholder="Numar ruta (ex: 10)"
                  value={tripRoute}
                  onChange={(e) => setTripRoute(e.target.value)}
                  className="add-trip-input"
                  autoFocus
                />
                <button className="btn-accent" onClick={handleAddTrip}>
                  <Plus size={16} />
                  <span>{stats.ticketPrice} RON</span>
                </button>
              </div>
              <div className="add-trip-quick">
                {stats.topRoutes.map((r) => (
                  <button
                    key={r.name}
                    className="quick-route-btn"
                    onClick={() => { addTrip({ routeName: r.name, cost: stats.ticketPrice }); }}
                  >
                    Ruta {r.name}
                  </button>
                ))}
                {favorites.slice(0, 3).map((f) => (
                  <button
                    key={f.id}
                    className="quick-route-btn"
                    onClick={() => { addTrip({ routeName: f.routeName, routeId: f.routeId, cost: stats.ticketPrice }); }}
                  >
                    Ruta {f.routeName}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="cost-stats">
          <div className="cost-stat glass-card">
            <span className="cost-stat-value mono">{stats.thisMonthTotal} RON</span>
            <span className="cost-stat-label">Luna aceasta</span>
          </div>
          <div className="cost-stat glass-card">
            <span className="cost-stat-value mono">{stats.thisMonthTrips}</span>
            <span className="cost-stat-label">Calatorii</span>
          </div>
          <div className="cost-stat glass-card">
            <span className="cost-stat-value mono">{stats.avgPerDay} RON</span>
            <span className="cost-stat-label">Media/zi</span>
          </div>
          <div className="cost-stat glass-card">
            <span className="cost-stat-value mono" style={{
              color: stats.projectedMonthly > stats.monthlyPassPrice ? 'var(--color-warning)' : 'var(--color-success)'
            }}>
              ~{stats.projectedMonthly} RON
            </span>
            <span className="cost-stat-label">Proiectie lunara</span>
          </div>
        </div>

        {/* Pass comparison bar */}
        <div className="pass-compare glass-card">
          <div className="pass-compare-header">
            <span>Bilete vs Abonament ({stats.monthlyPassPrice} RON)</span>
            <span className={`badge ${stats.passWorthIt ? 'badge-warning' : 'badge-success'}`}>
              {stats.passWorthIt ? 'Abonament recomandat' : 'Biletele sunt OK'}
            </span>
          </div>
          <div className="pass-bar-track">
            <motion.div
              className="pass-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((stats.thisMonthTotal / stats.monthlyPassPrice) * 100, 100)}%` }}
              transition={{ duration: 0.8 }}
              style={{
                background: stats.thisMonthTotal > stats.monthlyPassPrice
                  ? 'var(--color-danger)'
                  : 'var(--color-success)',
              }}
            />
            <div className="pass-bar-threshold" style={{ left: '100%' }}>
              <span>{stats.monthlyPassPrice}</span>
            </div>
          </div>
          <div className="pass-bar-labels">
            <span>0 RON</span>
            <span className="mono">{stats.thisMonthTotal} / {stats.monthlyPassPrice} RON</span>
          </div>
        </div>

        {/* Recent trips */}
        {recentTrips.length > 0 && (
          <div className="recent-trips">
            <button className="recent-trips-toggle" onClick={() => setShowHistory(!showHistory)}>
              <span>Ultimele calatorii ({recentTrips.length})</span>
              {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  className="trips-list"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {recentTrips.map((trip) => (
                    <div key={trip.id} className="trip-row">
                      <div className="trip-row-info">
                        <span className="trip-route mono">{trip.routeName || 'Calatorie'}</span>
                        <span className="trip-date">
                          {new Date(trip.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="trip-cost mono">{trip.cost} RON</span>
                      <button className="trip-delete" onClick={() => removeTrip(trip.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Settings */}
      <motion.div className="ast-section" variants={itemVariants}>
        <button className="ast-settings-toggle" onClick={() => setShowSettings(!showSettings)}>
          <Settings size={16} />
          <span>Setari preturi</span>
          {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <AnimatePresence>
          {showSettings && (
            <motion.div
              className="ast-settings glass-card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="setting-row">
                <label>Pret bilet (RON)</label>
                <input
                  type="number"
                  value={settings.ticketPrice}
                  onChange={(e) => updateSetting('ticketPrice', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.5"
                  className="setting-input"
                />
              </div>
              <div className="setting-row">
                <label>Pret abonament lunar (RON)</label>
                <input
                  type="number"
                  value={settings.monthlyPassPrice}
                  onChange={(e) => updateSetting('monthlyPassPrice', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="5"
                  className="setting-input"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Route Finder */}
      <motion.div className="ast-section" variants={itemVariants}>
        <h2 className="ast-section-title">
          <Navigation size={18} />
          Gaseste ruta
        </h2>
        <p className="ast-section-desc">Cauta ce rute conecteaza doua statii.</p>

        <div className="route-finder glass-card">
          <div className="rf-inputs">
            <div className="rf-input-group">
              <label>De la</label>
              <div className="rf-input-wrap">
                <MapPin size={16} />
                <input
                  type="text"
                  placeholder="Cauta statie..."
                  value={fromStop}
                  onChange={(e) => { setFromStop(e.target.value); setSelectedFrom(null); }}
                />
              </div>
              {fromResults.length > 0 && !selectedFrom && (
                <div className="rf-suggestions">
                  {fromResults.map((s) => (
                    <button key={s.stop_id} onClick={() => { setSelectedFrom(s); setFromStop(s.stop_name); setFromResults([]); }}>
                      {s.stop_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ArrowRight size={20} className="rf-arrow" />

            <div className="rf-input-group">
              <label>Pana la</label>
              <div className="rf-input-wrap">
                <MapPin size={16} />
                <input
                  type="text"
                  placeholder="Cauta statie..."
                  value={toStop}
                  onChange={(e) => { setToStop(e.target.value); setSelectedTo(null); }}
                />
              </div>
              {toResults.length > 0 && !selectedTo && (
                <div className="rf-suggestions">
                  {toResults.map((s) => (
                    <button key={s.stop_id} onClick={() => { setSelectedTo(s); setToStop(s.stop_name); setToResults([]); }}>
                      {s.stop_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {selectedFrom && selectedTo && (
            <div className="rf-results">
              {foundRoutes.length === 0 ? (
                <div className="rf-no-results">
                  <AlertTriangle size={20} />
                  <p>Nu am gasit rute directe intre aceste statii. Incearca statii vecine.</p>
                </div>
              ) : (
                <>
                  <h4 className="rf-results-title">{foundRoutes.length} rute gasite</h4>
                  {foundRoutes.map((r, idx) => (
                    <div key={`${r.route.route_id}-${r.directionId}`} className="rf-result-card">
                      <div className="rf-result-header">
                        <span className="rf-result-number mono" style={{
                          color: r.route.route_type === 0 ? 'var(--color-tram)'
                            : r.route.route_type === 11 ? '#F59E0B'
                            : 'var(--color-bus)'
                        }}>
                          {r.route.route_short_name}
                        </span>
                        <span className={`badge ${getVehicleTypeBadgeClass(r.route.route_type)}`}>
                          {getVehicleTypeName(r.route.route_type)}
                        </span>
                        {idx === 0 && <span className="badge badge-success">Cel mai rapid</span>}
                      </div>
                      <div className="rf-result-details">
                        <span>{r.route.route_long_name}</span>
                        <span className="mono">{r.stopsCount} statii</span>
                      </div>
                      {r.trip && (
                        <div className="rf-result-dir">
                          <Navigation size={12} />
                          <span>Directia: {r.trip.trip_headsign}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Assistant;
