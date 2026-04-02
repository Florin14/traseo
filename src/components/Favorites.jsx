import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trash2, Bus, ArrowRight, Navigation, MapPin } from 'lucide-react';
import { fetchVehicles } from '../store/slices/vehiclesSlice';
import { fetchRoutes } from '../store/slices/routesSlice';
import { fetchTrips } from '../store/slices/tripsSlice';
import { useFavorites } from '../hooks/useFavorites';
import { getVehicleTypeName, getVehicleTypeBadgeClass, timeAgo } from '../utils/helpers';
import './Favorites.css';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.06 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const Favorites = () => {
  const dispatch = useDispatch();
  const { data: vehicles } = useSelector((s) => s.vehicles);
  const { data: routes } = useSelector((s) => s.routes);
  const { data: trips } = useSelector((s) => s.trips);
  const { favorites, removeFavorite } = useFavorites();

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

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <motion.div className="page-header" variants={itemVariants}>
        <h1>Favorite</h1>
        <p>{favorites.length} {favorites.length === 1 ? 'favorit' : 'favorite'} salvate</p>
      </motion.div>

      {favorites.length === 0 ? (
        <motion.div className="fav-empty glass-card" variants={itemVariants}>
          <Star size={48} strokeWidth={1} />
          <h3>Niciun favorit inca</h3>
          <p>Adauga rute favorite din pagina de Rute pentru acces rapid.</p>
          <Link to="/routes" className="btn-accent"><span>Exploreaza rute</span></Link>
        </motion.div>
      ) : (
        <motion.div className="fav-list" variants={itemVariants}>
          {favorites.map((fav) => {
            const route = routeMap[fav.routeId];
            const routeVehicles = vehiclesByRoute[fav.routeId] || [];
            const activeOnRoute = routeVehicles.filter((v) => v.speed > 0);

            return (
              <motion.div key={fav.id} className="fav-card glass-card" variants={itemVariants} layout>
                <div className="fav-card-main">
                  <div className="fav-card-header">
                    <span className="fav-route-number mono">{fav.routeName}</span>
                    <div className="fav-card-meta">
                      {route && (
                        <span className={`badge ${getVehicleTypeBadgeClass(route.route_type)}`}>
                          {getVehicleTypeName(route.route_type)}
                        </span>
                      )}
                      {activeOnRoute.length > 0 && (
                        <span className="badge badge-success">
                          <div className="live-dot" style={{ width: 6, height: 6 }} />
                          {activeOnRoute.length} active
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="fav-route-name">{fav.routeLongName}</p>

                  {fav.type === 'partial_route' && (
                    <div className="fav-partial">
                      <MapPin size={14} />
                      <span>{fav.fromStopName}</span>
                      <ArrowRight size={14} />
                      <span>{fav.toStopName}</span>
                    </div>
                  )}

                  {/* Show first 3 active vehicles */}
                  {routeVehicles.length > 0 && (
                    <div className="fav-vehicles">
                      {routeVehicles.slice(0, 3).map((v) => {
                        const trip = tripMap[v.trip_id];
                        return (
                          <div key={v.id} className="fav-vehicle-mini">
                            <div className={`rdp-status-dot ${v.speed > 0 ? 'active' : 'inactive'}`} />
                            <span className="mono">#{v.label}</span>
                            <span className="fav-vehicle-dir">
                              <Navigation size={10} />
                              {trip?.trip_headsign || '—'}
                            </span>
                            <span className="mono fav-vehicle-speed">{v.speed}km/h</span>
                          </div>
                        );
                      })}
                      {routeVehicles.length > 3 && (
                        <span className="fav-more">+{routeVehicles.length - 3} vehicule</span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  className="fav-remove"
                  onClick={(e) => { e.stopPropagation(); removeFavorite(fav.id); }}
                  title="Sterge din favorite"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Favorites;
