import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Bus, Route, Zap, ArrowRight, Activity, Clock, TramFront } from 'lucide-react';
import { fetchVehicles } from '../store/slices/vehiclesSlice';
import { fetchRoutes } from '../store/slices/routesSlice';
import { getGreeting } from '../utils/helpers';
import './Home.css';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.06 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const Home = () => {
  const dispatch = useDispatch();
  const { data: vehicles } = useSelector((s) => s.vehicles);
  const { data: routes } = useSelector((s) => s.routes);

  useEffect(() => {
    if (!vehicles.length) dispatch(fetchVehicles());
    if (!routes.length) dispatch(fetchRoutes());
  }, [dispatch, vehicles.length, routes.length]);

  const activeVehicles = vehicles.filter((v) => v.speed > 0);
  const busCount = vehicles.filter((v) => v.route_id && v.vehicle_type === 3).length;
  const tramCount = vehicles.filter((v) => v.route_id && v.vehicle_type === 0).length;
  const trolleyCount = vehicles.filter((v) => v.route_id && v.vehicle_type === 11).length;

  const route10Vehicles = vehicles.filter((v) => v.route_id === 119);
  const route10Active = route10Vehicles.filter((v) => v.speed > 0);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {/* Hero Header */}
      <motion.div className="home-hero" variants={itemVariants}>
        <div className="hero-text">
          <h1>{getGreeting()}</h1>
          <p className="hero-subtitle">Transport public Cluj-Napoca in timp real</p>
        </div>
        <div className="hero-time glass">
          <Clock size={16} />
          <span className="mono">{timeStr}</span>
        </div>
      </motion.div>

      {/* Stats Strip */}
      <motion.div className="stats-strip" variants={itemVariants}>
        <div className="strip-stat">
          <span className="strip-value mono">{vehicles.length}</span>
          <span className="strip-label">vehicule</span>
        </div>
        <div className="strip-divider" />
        <div className="strip-stat">
          <span className="strip-value mono" style={{ color: 'var(--color-success)' }}>{activeVehicles.length}</span>
          <span className="strip-label">active</span>
        </div>
        <div className="strip-divider" />
        <div className="strip-stat">
          <span className="strip-value mono">{routes.length}</span>
          <span className="strip-label">rute</span>
        </div>
        <div className="strip-divider" />
        <div className="strip-stat live-strip">
          <div className="live-dot" />
          <span className="strip-label">date live</span>
        </div>
      </motion.div>

      {/* Main Bento Grid */}
      <motion.div className="bento-grid" variants={itemVariants}>
        {/* Route 10 Card */}
        <motion.div className="bento-card bento-wide glass-card" variants={itemVariants}>
          <div className="bento-card-header">
            <div className="bento-card-title">
              <span className="badge badge-trolleybus">Troleibuz</span>
              <h3>Ruta 10</h3>
            </div>
            <div className="live-badge">
              <div className="live-dot" />
              <span className="mono">LIVE</span>
            </div>
          </div>
          <p className="bento-subtitle">Gheorgheni — CUG</p>
          <div className="route10-stats">
            <div className="route10-stat">
              <span className="mono route10-value">{route10Vehicles.length}</span>
              <span className="route10-label">vehicule</span>
            </div>
            <div className="route10-stat">
              <span className="mono route10-value">{route10Active.length}</span>
              <span className="route10-label">in miscare</span>
            </div>
          </div>
          <Link to="/map" className="bento-action">
            <span>Vezi pe harta</span>
            <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Quick Nav Cards */}
        <motion.div className="bento-card bento-square glass-interactive" variants={itemVariants}>
          <Link to="/map" className="nav-card-link">
            <div className="nav-card-icon icon-map">
              <Map size={24} />
            </div>
            <div className="nav-card-text">
              <h3>Harta Live</h3>
              <p>Tracking in timp real</p>
            </div>
            <ArrowRight size={16} className="nav-card-arrow" />
          </Link>
        </motion.div>

        <motion.div className="bento-card bento-square glass-interactive" variants={itemVariants}>
          <Link to="/vehicles" className="nav-card-link">
            <div className="nav-card-icon icon-vehicles">
              <Bus size={24} />
            </div>
            <div className="nav-card-text">
              <h3>Vehicule</h3>
              <p>{activeVehicles.length} active acum</p>
            </div>
            <ArrowRight size={16} className="nav-card-arrow" />
          </Link>
        </motion.div>

        <motion.div className="bento-card bento-square glass-interactive" variants={itemVariants}>
          <Link to="/routes" className="nav-card-link">
            <div className="nav-card-icon icon-routes">
              <Route size={24} />
            </div>
            <div className="nav-card-text">
              <h3>Rute</h3>
              <p>{routes.length} disponibile</p>
            </div>
            <ArrowRight size={16} className="nav-card-arrow" />
          </Link>
        </motion.div>

        {/* Fleet Breakdown */}
        <motion.div className="bento-card bento-wide glass-card" variants={itemVariants}>
          <h3 className="bento-card-title-simple">Flota Activa</h3>
          <div className="fleet-bars">
            <div className="fleet-bar-item">
              <div className="fleet-bar-label">
                <div className="fleet-bar-name">
                  <Bus size={14} />
                  <span>Autobuze</span>
                </div>
                <span className="mono">{busCount}</span>
              </div>
              <div className="fleet-bar-track">
                <motion.div
                  className="fleet-bar-fill bus-fill"
                  initial={{ width: 0 }}
                  animate={{ width: vehicles.length ? `${(busCount / vehicles.length) * 100}%` : '0%' }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </div>
            <div className="fleet-bar-item">
              <div className="fleet-bar-label">
                <div className="fleet-bar-name">
                  <TramFront size={14} />
                  <span>Tramvaie</span>
                </div>
                <span className="mono">{tramCount}</span>
              </div>
              <div className="fleet-bar-track">
                <motion.div
                  className="fleet-bar-fill tram-fill"
                  initial={{ width: 0 }}
                  animate={{ width: vehicles.length ? `${(tramCount / vehicles.length) * 100}%` : '0%' }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                />
              </div>
            </div>
            <div className="fleet-bar-item">
              <div className="fleet-bar-label">
                <div className="fleet-bar-name">
                  <Zap size={14} />
                  <span>Troleibuze</span>
                </div>
                <span className="mono">{trolleyCount}</span>
              </div>
              <div className="fleet-bar-track">
                <motion.div
                  className="fleet-bar-fill trolley-fill"
                  initial={{ width: 0 }}
                  animate={{ width: vehicles.length ? `${(trolleyCount / vehicles.length) * 100}%` : '0%' }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Home;
