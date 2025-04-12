import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FirebaseService from '../services/FirebaseService';
import { 
  FaRupeeSign, FaMapMarkerAlt, FaCalendarAlt, FaStore, 
  FaClock, FaUserEdit, FaCog, FaChartLine, FaBookmark,
  FaSignOutAlt, FaCamera
} from 'react-icons/fa';
import '../App.css';

const ProfileScreen = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('contributions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        let userData;
        if (userId) {
          // Fetching specific user profile
          userData = await FirebaseService.getUserById(userId);
        } else {
          // Fetch current user profile
          userData = await FirebaseService.getCurrentUser();
        }
        
        if (!userData) {
          throw new Error('User not found');
        }
        
        setUser(userData);
        
        // Fetch user's contributions (price entries they've added)
        const userContributions = await FirebaseService.getUserContributions(userData.id);
        setContributions(userContributions);
        
        // Fetch user's saved products
        const userSavedProducts = await FirebaseService.getUserSavedProducts(userData.id);
        setSavedProducts(userSavedProducts);
        
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(`Failed to load profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading user profile...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!user) {
    return <div className="error-message">User not found</div>;
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const formatShortDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
  };

  const handleLogout = async () => {
    try {
      await FirebaseService.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <h2>{userId ? `${user.displayName}'s Profile` : 'My Profile'}</h2>
      </div>
      
      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar-container">
            <img 
              src={user.photoURL || '/default-avatar.png'} 
              alt={`${user.displayName}'s avatar`}
              className="profile-avatar"
            />
            {!userId && (
              <button className="change-avatar-btn">
                <FaCamera />
              </button>
            )}
          </div>
          
          <h3 className="profile-name">{user.displayName}</h3>
          {user.email && <p className="profile-email">{user.email}</p>}
          
          <div className="profile-stats-card">
            <div className="stat-item">
              <div className="stat-value">{contributions.length}</div>
              <div className="stat-label">Contributions</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">{savedProducts.length}</div>
              <div className="stat-label">Saved</div>
            </div>
          </div>
          
          {!userId && (
            <div className="profile-actions">
              <button className="profile-action-btn">
                <FaUserEdit /> Edit Profile
              </button>
              <button className="profile-action-btn">
                <FaCog /> Settings
              </button>
              <button className="profile-action-btn logout-btn" onClick={handleLogout}>
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          )}
        </div>
        
        {/* Tabs & Content */}
        <div className="profile-content">
          <div className="profile-tabs">
            <button 
              className={`tab-btn ${activeTab === 'contributions' ? 'active' : ''}`}
              onClick={() => setActiveTab('contributions')}
            >
              <FaChartLine /> Contributions
            </button>
            <button 
              className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <FaBookmark /> Saved Products
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'contributions' && (
              <div className="contributions-tab">
                {contributions.length === 0 ? (
                  <div className="no-results">
                    <p>No contributions yet</p>
                    {!userId && (
                      <button onClick={() => navigate('/add')} className="add-btn">
                        Add Your First Price
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="contributions-grid">
                    {contributions.map(contribution => (
                      <div className="contribution-card" key={contribution.id}>
                        <div className="contribution-header">
                          <h4>{contribution.productName}</h4>
                          {contribution.isPublic ? (
                            <span className="public-badge">Public</span>
                          ) : (
                            <span className="private-badge">Private</span>
                          )}
                        </div>
                        
                        <div className="price-value">
                          ₹{parseFloat(contribution.price).toFixed(2)}
                        </div>
                        
                        <div className="price-details">
                          {contribution.quantity && contribution.unit && (
                            <div className="quantity-unit">
                              {contribution.quantity} {contribution.unit}
                            </div>
                          )}
                        </div>
                        
                        {contribution.shopName && (
                          <div className="detail-item">
                            <FaStore size={12} /> {contribution.shopName}
                          </div>
                        )}
                        
                        {contribution.locationName && (
                          <div className="detail-item location">
                            <FaMapMarkerAlt size={12} /> {contribution.locationName}
                          </div>
                        )}
                        
                        <div className="detail-item date">
                          <FaCalendarAlt size={12} /> {formatShortDate(contribution.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'saved' && (
              <div className="saved-tab">
                {savedProducts.length === 0 ? (
                  <div className="no-results">
                    <p>No saved products yet</p>
                    {!userId && (
                      <button onClick={() => navigate('/')} className="add-btn">
                        Browse Products
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="saved-products-grid">
                    {savedProducts.map(product => (
                      <div 
                        className="saved-product-card" 
                        key={product.id}
                        onClick={() => navigate(`/product/${product.productSlug || product.id}`)}
                      >
                        <div className="saved-product-header">
                          <h4>{product.productName}</h4>
                        </div>
                        
                        <div className="price-range">
                          <span className="price-label">Price Range:</span>
                          <span className="price-values">
                            ₹{parseFloat(product.lowestPrice).toFixed(2)} - ₹{parseFloat(product.highestPrice).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="detail-item date">
                          <FaClock size={12} /> Last updated: {formatShortDate(product.lastUpdated)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen; 