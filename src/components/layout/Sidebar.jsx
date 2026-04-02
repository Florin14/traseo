import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, Bus, Route, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: Home, label: 'Acasa' },
  { path: '/map', icon: Map, label: 'Harta' },
  { path: '/vehicles', icon: Bus, label: 'Vehicule' },
  { path: '/routes', icon: Route, label: 'Rute' },
  { path: '/favorites', icon: Star, label: 'Favorite' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="sidebar glass-heavy">
        <div className="sidebar-logo">
          <span className="logo-text">T</span>
        </div>

        <div className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                {isActive && (
                  <motion.div
                    className="sidebar-active-bg"
                    layoutId="sidebar-active"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="sidebar-tooltip">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="sidebar-bottom">
          <div className="live-indicator">
            <div className="live-dot" />
            <span className="sidebar-tooltip">Live</span>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="mobile-nav glass-heavy">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`mobile-nav-link ${isActive ? 'active' : ''}`}
            >
              {isActive && (
                <motion.div
                  className="mobile-active-bg"
                  layoutId="mobile-active"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="mobile-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;
