import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getVehicles } from "../store/thunks/get_buses";
import "./Vehicles.css";

const Vehicles = () => {
  const dispatch = useDispatch();
  const {
    data: vehicles,
    loading,
    error,
  } = useSelector((state) => state.vehicles);

  useEffect(() => {
    // Only fetch if we don't have data and aren't already loading
    if (!vehicles?.length && !loading) {
      dispatch(getVehicles());
    }
  }, [dispatch, vehicles?.length, loading]);

  console.log("Vehicles data:", vehicles);
  console.log(
    "Route 10 vehicles:",
    vehicles?.filter?.((vehicle) => vehicle.route_id === 10)
  );

  if (loading) {
    return (
      <div className="vehicles-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading vehicles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vehicles-container">
        <div className="error">
          <h2>Error loading vehicles</h2>
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

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="vehicles-container">
        <div className="no-data">
          <h2>No vehicles found</h2>
          <p>There are currently no vehicles available to display.</p>
          <button
            onClick={() => dispatch(getVehicles())}
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
        <h1>Vehicle Fleet</h1>
        <button
          onClick={() => dispatch(getVehicles())}
          className="refresh-button"
        >
          Refresh Data
        </button>
      </div>

      <div className="vehicles-grid">
        {Array.isArray(vehicles) ? (
          vehicles.map((vehicle, index) => (
            <div key={vehicle.id || index} className="vehicle-card">
              <div className="vehicle-header">
                <h3>
                  {vehicle.label
                    ? `Vehicle ${vehicle.label}`
                    : `Vehicle ${index + 1}`}
                </h3>
                <span
                  className={`status ${
                    vehicle.speed > 0 ? "active" : "inactive"
                  }`}
                >
                  {vehicle.speed > 0 ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="vehicle-details">
                <p>
                  <strong>Vehicle ID:</strong> {vehicle.id}
                </p>
                {vehicle.route_id && (
                  <p>
                    <strong>Route ID:</strong> {vehicle.route_id}
                  </p>
                )}
                {vehicle.latitude && vehicle.longitude && (
                  <p>
                    <strong>Location:</strong> {vehicle.latitude.toFixed(6)},{" "}
                    {vehicle.longitude.toFixed(6)}
                  </p>
                )}
                {vehicle.speed !== undefined && (
                  <p>
                    <strong>Speed:</strong> {vehicle.speed} km/h
                  </p>
                )}
                {vehicle.vehicle_type && (
                  <p>
                    <strong>Vehicle Type:</strong> {vehicle.vehicle_type}
                  </p>
                )}
                {vehicle.trip_id && (
                  <p>
                    <strong>Trip ID:</strong> {vehicle.trip_id}
                  </p>
                )}
                {vehicle.wheelchair_accessible && (
                  <p>
                    <strong>Wheelchair:</strong>{" "}
                    {vehicle.wheelchair_accessible
                      .replace("WHEELCHAIR_", "")
                      .replace("_", " ")}
                  </p>
                )}
                {vehicle.bike_accessible && (
                  <p>
                    <strong>Bike:</strong>{" "}
                    {vehicle.bike_accessible
                      .replace("BIKE_", "")
                      .replace("_", " ")}
                  </p>
                )}
                {vehicle.timestamp && (
                  <p>
                    <strong>Last Update:</strong>{" "}
                    {new Date(vehicle.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="vehicle-card">
            <div className="vehicle-header">
              <h3>
                {vehicles.label ? `Vehicle ${vehicles.label}` : "Vehicle"}
              </h3>
              <span
                className={`status ${
                  vehicles.speed > 0 ? "active" : "inactive"
                }`}
              >
                {vehicles.speed > 0 ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="vehicle-details">
              <p>
                <strong>Vehicle ID:</strong> {vehicles.id}
              </p>
              {vehicles.route_id && (
                <p>
                  <strong>Route ID:</strong> {vehicles.route_id}
                </p>
              )}
              {vehicles.latitude && vehicles.longitude && (
                <p>
                  <strong>Location:</strong> {vehicles.latitude.toFixed(6)},{" "}
                  {vehicles.longitude.toFixed(6)}
                </p>
              )}
              {vehicles.speed !== undefined && (
                <p>
                  <strong>Speed:</strong> {vehicles.speed} km/h
                </p>
              )}
              {vehicles.vehicle_type && (
                <p>
                  <strong>Vehicle Type:</strong> {vehicles.vehicle_type}
                </p>
              )}
              {vehicles.trip_id && (
                <p>
                  <strong>Trip ID:</strong> {vehicles.trip_id}
                </p>
              )}
              {vehicles.wheelchair_accessible && (
                <p>
                  <strong>Wheelchair:</strong>{" "}
                  {vehicles.wheelchair_accessible
                    .replace("WHEELCHAIR_", "")
                    .replace("_", " ")}
                </p>
              )}
              {vehicles.bike_accessible && (
                <p>
                  <strong>Bike:</strong>{" "}
                  {vehicles.bike_accessible
                    .replace("BIKE_", "")
                    .replace("_", " ")}
                </p>
              )}
              {vehicles.timestamp && (
                <p>
                  <strong>Last Update:</strong>{" "}
                  {new Date(vehicles.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
