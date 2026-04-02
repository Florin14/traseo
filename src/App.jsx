import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Vehicles from "./components/Vehicles";
import Map from "./components/Map";
import RoutesPage from "./components/Routes";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/map" element={<Map />} />
          <Route path="/routes" element={<RoutesPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
