import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FirebaseService from '../services/FirebaseService';
import { FaRupeeSign } from 'react-icons/fa';

const PriceAlertsScreen = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // In a real app, you'd get the userId from authentication
  const userId = 'current-user-id';

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const alertsData = await FirebaseService.getPriceAlertsForUser(userId);
        setAlerts(alertsData);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError(`Error loading price alerts: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [userId]);

  const handleDeleteAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this price alert?')) {
      return;
    }

    try {
      await FirebaseService.deletePriceAlert(alertId);
      // Update the alerts list
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Error deleting alert:', err);
      alert(`Error deleting alert: ${err.message}`);
    }
  };

  const handleViewProduct = (productSlug) => {
    navigate(`/product/${productSlug}`);
  };

  const handleViewTrends = (productId) => {
    navigate(`/trends/${productId}`);
  };

  if (loading) {
    return <div className="loading">Loading price alerts...</div>;
  }

  return (
    <div className="price-alerts-screen">
      <h2>Your Price Alerts</h2>

      {error && <div className="error-message">{error}</div>}

      {alerts.length === 0 ? (
        <div className="no-alerts">
          <p>You don't have any price alerts set up.</p>
          <p>Set up alerts to be notified when prices drop below your target.</p>
          <button onClick={() => navigate('/search')}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map(alert => (
            <div key={alert.id} className="alert-card">
              <div className="alert-header">
                <h3>{alert.productName || 'Unknown Product'}</h3>
                <button 
                  className="delete-button"
                  onClick={() => handleDeleteAlert(alert.id)}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              
              <div className="alert-details">
                <div className="alert-info">
                  <div className="target-price">
                    <span className="label">Target Price:</span>
                    <span className="value"><FaRupeeSign size={12} /> {alert.targetPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="alert-date">
                    <span className="label">Created:</span>
                    <span className="value">
                      {alert.createdAt?.toDate 
                        ? alert.createdAt.toDate().toLocaleDateString() 
                        : 'Unknown date'}
                    </span>
                  </div>
                </div>
                
                <div className="alert-actions">
                  <button 
                    className="view-product-button"
                    onClick={() => handleViewProduct(alert.productSlug)}
                  >
                    View Product
                  </button>
                  <button 
                    className="view-trends-button"
                    onClick={() => handleViewTrends(alert.productId)}
                  >
                    View Trends
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriceAlertsScreen; 