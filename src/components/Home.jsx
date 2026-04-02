import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to Tranzy 2.0</h1>
        <p className="hero-subtitle">
          Real-time vehicle tracking and fleet management system
        </p>
        <div className="hero-actions">
          <Link to="/vehicles" className="cta-button primary">
            View Vehicles
          </Link>
          <Link to="/map" className="cta-button primary">
            Live Map
          </Link>
          <button className="cta-button secondary">Learn More</button>
        </div>
      </div>

      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚌</div>
            <h3>Real-time Tracking</h3>
            <p>
              Track your fleet in real-time with live location updates and
              status monitoring.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics Dashboard</h3>
            <p>
              Get insights into vehicle performance, routes, and operational
              efficiency.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>Fleet Management</h3>
            <p>
              Comprehensive fleet management tools for maintenance and
              scheduling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
