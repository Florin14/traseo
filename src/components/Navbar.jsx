import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Tranzy 2.0
        </Link>
        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/" className="navbar-link">
              Home
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/vehicles" className="navbar-link">
              Vehicles
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/map" className="navbar-link">
              Live Map
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/routes" className="navbar-link">
              Routes
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
