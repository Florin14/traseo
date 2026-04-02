import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getRoutes } from "../store/thunks/get_buses";
import "./Routes.css";

const Routes = () => {
  const dispatch = useDispatch();
  const {
    data: routes,
    loading,
    error,
  } = useSelector((state) => state.vehicles);

  useEffect(() => {
    dispatch(getRoutes());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="vehicles-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading routes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vehicles-container">
        <div className="error">
          <h2>Error loading routes</h2>
          <p>
            {error.message || "Something went wrong while fetching route data."}
          </p>
          <button
            onClick={() => dispatch(getRoutes())}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!routes || routes.length === 0) {
    return (
      <div className="vehicles-container">
        <div className="no-data">
          <h2>No routes found</h2>
          <p>There are currently no routes available to display.</p>
          <button
            onClick={() => dispatch(getRoutes())}
            className="refresh-button"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicles-container">
      <div className="vehicles-header">
        <h1>Routes</h1>
        <button
          onClick={() => dispatch(getRoutes())}
          className="refresh-button"
        >
          Refresh Data
        </button>
      </div>

      <div className="vehicles-grid">
        {Array.isArray(routes) ? (
          routes.map((vehicle, index) => (
            <div key={vehicle.id || index} className="vehicle-card">
              <div className="vehicle-header">
                <h3>
                  {vehicle.name || vehicle.vehicleId || `Vehicle ${index + 1}`}
                </h3>
                <span
                  className={`status ${
                    vehicle.status?.toLowerCase() || "unknown"
                  }`}
                >
                  {vehicle.status || "Unknown"}
                </span>
              </div>
              <div className="vehicle-details">
                {vehicle.route && (
                  <p>
                    <strong>Route:</strong> {vehicle.route}
                  </p>
                )}
                {vehicle.location && (
                  <p>
                    <strong>Location:</strong> {vehicle.location.lat},{" "}
                    {vehicle.location.lng}
                  </p>
                )}
                {vehicle.speed && (
                  <p>
                    <strong>Speed:</strong> {vehicle.speed} km/h
                  </p>
                )}
                {vehicle.type && (
                  <p>
                    <strong>Type:</strong> {vehicle.type}
                  </p>
                )}
                {vehicle.capacity && (
                  <p>
                    <strong>Capacity:</strong> {vehicle.capacity} passengers
                  </p>
                )}
                {vehicle.lastUpdate && (
                  <p>
                    <strong>Last Update:</strong>{" "}
                    {new Date(vehicle.lastUpdate).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="vehicle-card">
            <div className="vehicle-header">
              <h3>{routes.name || routes.vehicleId || "Vehicle"}</h3>
              <span
                className={`status ${
                  routes.status?.toLowerCase() || "unknown"
                }`}
              >
                {routes.status || "Unknown"}
              </span>
            </div>
            <div className="vehicle-details">
              {routes.route && (
                <p>
                  <strong>Route:</strong> {routes.route}
                </p>
              )}
              {routes.location && (
                <p>
                  <strong>Location:</strong> {routes.location.lat},{" "}
                  {routes.location.lng}
                </p>
              )}
              {routes.speed && (
                <p>
                  <strong>Speed:</strong> {routes.speed} km/h
                </p>
              )}
              {routes.type && (
                <p>
                  <strong>Type:</strong> {routes.type}
                </p>
              )}
              {routes.capacity && (
                <p>
                  <strong>Capacity:</strong> {routes.capacity} passengers
                </p>
              )}
              {routes.lastUpdate && (
                <p>
                  <strong>Last Update:</strong>{" "}
                  {new Date(routes.lastUpdate).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Routes;
