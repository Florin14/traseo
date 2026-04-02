import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import Home from './components/Home';
import Vehicles from './components/Vehicles';
import MapView from './components/Map';
import RoutesPage from './components/Routes';
import Favorites from './components/Favorites';
import './App.css';

function App() {
  const location = useLocation();

  return (
    <div className="app">
      {/* Aurora animated background */}
      <div className="aurora-bg" />

      <Sidebar />

      <main className="main-content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
