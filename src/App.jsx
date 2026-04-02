import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import Home from './components/Home';
import './App.css';

// Lazy load heavy pages
const MapView = lazy(() => import('./components/Map'));
const Vehicles = lazy(() => import('./components/Vehicles'));
const RoutesPage = lazy(() => import('./components/Routes'));
const Favorites = lazy(() => import('./components/Favorites'));
const Assistant = lazy(() => import('./components/Assistant'));

const PageLoader = () => (
  <div className="page-loader">
    <div className="page-loader-spinner" />
  </div>
);

function App({ onReady }) {
  const location = useLocation();

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <div className="app">
      <div className="aurora-bg" />
      <Sidebar />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <Suspense fallback={<PageLoader />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/assistant" element={<Assistant />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
