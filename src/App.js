import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import AddProductScreen from './screens/AddProductScreen';
import SearchProductScreen from './screens/SearchProductScreen';
import NearbyPricesScreen from './screens/NearbyPricesScreen';
import PriceTrendsScreen from './screens/PriceTrendsScreen';
import PriceAlertsScreen from './screens/PriceAlertsScreen';
import ExportDataScreen from './screens/ExportDataScreen';
import ProductByIdScreen from './screens/ProductByIdScreen';
import ProductHistoryScreen from './screens/ProductHistoryScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProductManagementScreen from './screens/ProductManagementScreen';
import { FaHome, FaSearch, FaPlus, FaUser, FaChartLine } from 'react-icons/fa';
import './App.css';

// Mobile navigation component
const MobileNav = () => {
  const location = useLocation();
  const path = location.pathname;
  
  return (
    <nav className="mobile-nav">
      <ul className="mobile-nav-list">
        <li className="mobile-nav-item">
          <Link to="/" className={`mobile-nav-link ${path === '/' ? 'active' : ''}`}>
            <FaHome />
            <span>Nearby</span>
          </Link>
        </li>
        <li className="mobile-nav-item">
          <Link to="/add" className={`mobile-nav-link ${path === '/add' ? 'active' : ''}`}>
            <FaPlus />
            <span>Add</span>
          </Link>
        </li>
        <li className="mobile-nav-item">
          <Link to="/trends" className={`mobile-nav-link ${path === '/trends' ? 'active' : ''}`}>
            <FaChartLine />
            <span>Trends</span>
          </Link>
        </li>
        <li className="mobile-nav-item">
          <Link to="/profile" className={`mobile-nav-link ${path === '/profile' ? 'active' : ''}`}>
            <FaUser />
            <span>Profile</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="logo-container">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1>PriceHistory</h1>
            </Link>
            <div className="mobile-header-actions">
              <Link to="/search" className="app-header-icon">
                <FaSearch />
              </Link>
            </div>
          </div>
          <nav className="app-nav">
            <Link to="/search">Search</Link>
            <Link to="/add">Add Product</Link>
            <Link to="/trends">Price Trends</Link>
            <Link to="/profile">My Profile</Link>
          </nav>
        </header>
        
        <main className="app-content">
          <Routes>
            <Route path="/" element={<NearbyPricesScreen />} />
            <Route path="/search" element={<SearchProductScreen />} />
            <Route path="/add" element={<AddProductScreen />} />
            <Route path="/trends" element={<PriceTrendsScreen />} />
            <Route path="/alerts" element={<PriceAlertsScreen />} />
            <Route path="/export" element={<ExportDataScreen />} />
            <Route path="/product/:slug" element={<ProductHistoryScreen />} />
            <Route path="/product-id/:id" element={<ProductByIdScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/profile/:userId" element={<ProfileScreen />} />
            <Route path="/manage-products" element={<ProductManagementScreen />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <MobileNav />
        
        <footer className="app-footer">
          <div className="footer-container">
            <div className="footer-brand">
              <p className="footer-title">PriceHistory</p>
              <p className="footer-tagline">Track prices. Save money. Share knowledge.</p>
            </div>
            <div className="footer-links">
              <Link to="/about">About</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div className="footer-copyright">
              <p>© {new Date().getFullYear()} PriceHistory by <a href="https://pelupa.in" target="_blank" rel="noopener noreferrer">pelupa.in</a></p>
              <p className="footer-disclaimer">All prices are crowdsourced and may vary.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App; 