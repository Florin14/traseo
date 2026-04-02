import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { getVehicles } from "../store/thunks/get_buses";
import "./Map.css";

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom vehicle icons
const createVehicleIcon = (status, type) => {
  const color = status === "active" ? "#27ae60" : "#e74c3c";
  const symbol = type === "bus" ? "🚌" : type === "tram" ? "🚊" : "🚐";

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${symbol}
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color};
        "></div>
      </div>
    `,
    className: "custom-vehicle-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Component to update map view based on vehicles (only on initial load)
const MapUpdater = ({ vehicles }) => {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only auto-zoom on the very first load, not on subsequent updates
    if (vehicles && vehicles.length > 0 && !hasInitialized.current) {
      const validVehicles = vehicles.filter((v) => v.latitude && v.longitude);
      if (validVehicles.length > 0) {
        const bounds = L.latLngBounds(
          validVehicles.map((v) => [v.latitude, v.longitude])
        );
        map.fitBounds(bounds, { padding: [20, 20] });
        hasInitialized.current = true;
      }
    }
  }, [vehicles, map]);

  return null;
};

const Map = () => {
  const dispatch = useDispatch();
  const {
    data: vehicles,
    loading,
    error,
  } = useSelector((state) => state.vehicles);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    dispatch(getVehicles());

    // Set up auto-refresh every 10 seconds
    intervalRef.current = setInterval(() => {
      dispatch(getVehicles());
    }, 10000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dispatch]);

  const validVehicles =
    vehicles?.filter((v) => v.latitude && v.longitude) || [];

  // Add some debugging to see if positions are actually changing
  useEffect(() => {
    if (validVehicles.length > 0) {
      console.log(
        "Map update - vehicle positions:",
        validVehicles.map((v) => ({
          id: v.id,
          label: v.label,
          lat: v.latitude,
          lng: v.longitude,
          speed: v.speed,
          timestamp: v.timestamp,
        }))
      );
    }
  }, [validVehicles]);

  const getVehicleStatus = (vehicle) => {
    return vehicle.speed > 0 ? "active" : "inactive";
  };

  const getVehicleType = (vehicleType) => {
    // Map vehicle type numbers to names
    switch (vehicleType) {
      case 1:
        return "bus";
      case 2:
        return "tram";
      case 3:
        return "bus";
      default:
        return "vehicle";
    }
  };

  // Default center (you can adjust this to your city)
  const defaultCenter = [44.4268, 26.1025]; // Bucharest coordinates

  if (loading && (!vehicles || vehicles.length === 0)) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <div className="spinner"></div>
          <p>Loading map and vehicles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-container">
        <div className="map-error">
          <h2>Error loading map data</h2>
          <p>
            {error.message ||
              "Something went wrong while fetching vehicle data."}
          </p>
          <button
            onClick={() => dispatch(getVehicles())}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div className="map-header">
        <h1>Live Vehicle Tracking</h1>
        <div className="map-controls">
          <div className="vehicle-stats">
            <span className="stat">
              <span className="stat-number">{validVehicles.length}</span>
              <span className="stat-label">Total Vehicles</span>
            </span>
            <span className="stat">
              <span className="stat-number">
                {validVehicles.filter((v) => v.speed > 0).length}
              </span>
              <span className="stat-label">Active</span>
            </span>
            <span className="stat">
              <span className="stat-number">
                {validVehicles.filter((v) => v.speed === 0).length}
              </span>
              <span className="stat-label">Inactive</span>
            </span>
          </div>
          <button
            onClick={() => dispatch(getVehicles())}
            className="refresh-button"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Now"}
          </button>
          {loading && (
            <div className="refresh-indicator">
              <div className="refresh-dot"></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater vehicles={validVehicles} />

          {validVehicles.map((vehicle) => (
            <Marker
              key={`${vehicle.id}-${vehicle.timestamp}`}
              position={[vehicle.latitude, vehicle.longitude]}
              icon={createVehicleIcon(
                getVehicleStatus(vehicle),
                getVehicleType(vehicle.vehicle_type)
              )}
            >
              <Popup className="vehicle-popup">
                <div className="popup-content">
                  <h3>Vehicle {vehicle.label}</h3>
                  <div className="popup-details">
                    <p>
                      <strong>Route:</strong> {vehicle.route_id || "N/A"}
                    </p>
                    <p>
                      <strong>Speed:</strong> {vehicle.speed} km/h
                    </p>
                    <p>
                      <strong>Status:</strong>
                      <span
                        className={`status-badge ${getVehicleStatus(vehicle)}`}
                      >
                        {vehicle.speed > 0 ? "Moving" : "Stopped"}
                      </span>
                    </p>
                    <p>
                      <strong>Last Update:</strong>{" "}
                      {new Date(vehicle.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="map-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-icon active">🚌</span>
            <span>Active Vehicle</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon inactive">🚌</span>
            <span>Inactive Vehicle</span>
          </div>
          <div className="legend-note">
            <small>Map updates automatically every 10 seconds</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;
