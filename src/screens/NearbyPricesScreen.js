import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FirebaseService from '../services/FirebaseService';
import { FaMapMarkerAlt, FaRupeeSign, FaStore, FaCalendarAlt, FaArrowRight, FaShoppingBag } from 'react-icons/fa';

// Inline styles for compact card design
const styles = {
  nearbyProductsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.25rem',
    marginTop: '1.25rem'
  },
  productGroup: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '1.25rem',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.07)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #eaeaea'
  },
  productName: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #eaeaea'
  },
  priceEntry: {
    backgroundColor: '#fff',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  priceValue: {
    fontWeight: '600',
    fontSize: '1.25rem',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  locationName: {
    fontSize: '0.9rem',
    color: '#333',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    lineHeight: '1.4'
  },
  quantityUnit: {
    fontSize: '0.9rem',
    color: '#555',
    fontWeight: '500',
    marginTop: '0.35rem'
  },
  date: {
    fontSize: '0.85rem',
    color: '#888',
    fontWeight: '400',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  moreEntries: {
    fontSize: '0.85rem',
    color: '#4361ee',
    marginTop: '0.5rem',
    fontWeight: '500'
  }
};

const NearbyPricesScreen = () => {
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [nearbyPrices, setNearbyPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [allProducts, setAllProducts] = useState([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Always fetch all products for display
    fetchAllProducts();
    
    // Try to detect location
    detectLocation();
  }, []);

  useEffect(() => {
    if (location) {
      const fetchPrices = async () => {
        if (!location) return;
        
        try {
          setLoading(true);
          setError(null);
          
          const entries = await FirebaseService.getPriceEntriesNearLocation(
            location.latitude,
            location.longitude,
            radiusKm
          );
          
          // Group entries by product
          const entriesByProduct = {};
          
          for (const entry of entries) {
            if (!entriesByProduct[entry.productId]) {
              entriesByProduct[entry.productId] = {
                productId: entry.productId,
                entries: [],
                productName: entry.productName || 'Unknown Product',
                productSlug: entry.productSlug
              };
            }
            
            entriesByProduct[entry.productId].entries.push(entry);
          }
          
          const productsWithEntries = Object.values(entriesByProduct);
          
          setNearbyPrices(productsWithEntries);
          
          // If no nearby products, show all products
          if (productsWithEntries.length === 0) {
            setShowAllProducts(true);
          } else {
            setShowAllProducts(false);
          }
        } catch (err) {
          console.error('Error fetching nearby prices:', err);
          setError(`Error fetching nearby prices: ${err.message}`);
          setShowAllProducts(true);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPrices();
    }
  }, [location, radiusKm]);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const products = await FirebaseService.getAllProducts();
      console.log('All products:', products);
      setAllProducts(products);
      
      // If no products found, try to get all price entries and extract product info
      if (products.length === 0) {
        const entries = await FirebaseService.getAllPriceEntries();
        console.log('All price entries:', entries);
        
        // Group entries by product
        const productGroups = {};
        
        for (const entry of entries) {
          if (!productGroups[entry.productId]) {
            productGroups[entry.productId] = {
              id: entry.productId,
              entries: []
            };
          }
          productGroups[entry.productId].entries.push(entry);
        }
        
        setAllProducts(Object.values(productGroups));
      }
    } catch (err) {
      console.error('Error fetching all products:', err);
      setError(`Error loading products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      setShowAllProducts(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });

        // Get location name using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          if (data.display_name) {
            setLocationName(data.display_name);
          }
        } catch (error) {
          console.error('Error getting location name:', error);
        }
      },
      error => {
        console.error('Geolocation error:', error);
        setError(`Error getting location: ${error.message}`);
        setLoading(false);
        setShowAllProducts(true);
      }
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    // Format date as DD/MM/YY (more compact)
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
  };

  const handleProductClick = (productId, productSlug) => {
    if (productSlug) {
      navigate(`/product/${productSlug}`);
    } else if (productId) {
      // If we only have the ID but not the slug, try to load by ID
      navigate(`/product-id/${productId}`);
    }
  };

  const handleRadiusChange = (e) => {
    setRadiusKm(Number(e.target.value));
  };

  const shortenLocationName = (locationName) => {
    if (!locationName) return '';
    
    // If it's a comma-separated address, display more parts now that we have larger boxes
    if (locationName.includes(',')) {
      const parts = locationName.split(',');
      if (parts.length > 3) {
        // Return first three parts at most
        return parts.slice(0, 3).join(',').trim();
      }
    }
    
    // Otherwise, limit by word count but allow more words
    const words = locationName.split(' ');
    if (words.length > 5) {
      return words.slice(0, 5).join(' ') + '...';
    }
    
    return locationName;
  };

  const renderProductList = (products) => {
    if (products.length === 0) {
      return (
        <div className="no-results">
          <FaShoppingBag style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
          <h3>No products found</h3>
          <p>Try changing your search radius or add a new product</p>
        </div>
      );
    }
    
    return (
      <div style={styles.nearbyProductsList}>
        {products.map((productGroup) => (
          <div 
            key={productGroup.id || Math.random().toString()} 
            style={styles.productGroup}
            onClick={() => handleProductClick(productGroup.id, productGroup.productSlug)}
          >
            <h3 style={styles.productName}>{productGroup.productName || 'Unknown Product'}</h3>
            
            {productGroup.entries && productGroup.entries.length > 0 ? (
              <div style={styles.priceEntry}>
                <div>
                  <div style={styles.priceValue}>₹{productGroup.entries[0].price?.toFixed(2) || '0.00'}</div>
                </div>
                
                <div style={styles.locationName}>
                  <FaMapMarkerAlt size={14} /> {shortenLocationName(productGroup.entries[0].locationName)}
                </div>
                
                <div style={styles.quantityUnit}>
                  <span>{productGroup.entries[0].quantity || 1} {productGroup.entries[0].unit || 'pc'}</span>
                </div>
                
                <div style={styles.date}>
                  <FaCalendarAlt size={12} /> {formatDate(productGroup.entries[0].timestamp)}
                </div>
                
                {productGroup.entries.length > 1 && (
                  <div style={styles.moreEntries}>
                    <span>+{productGroup.entries.length - 1} more</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-entries">No price entries yet</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="nearby-prices-screen">
      <div className="screen-header">
        <h2>Prices Near You</h2>
        <p className="subtitle">Find the best deals in your area</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="location-section">
        <div className="location-header">
          {locationName ? (
            <p>
              <FaMapMarkerAlt className="location-icon-marker" /> <strong>Your location:</strong> {locationName}
            </p>
          ) : location ? (
            <p>
              <FaMapMarkerAlt className="location-icon-marker" /> Location detected (Name not available)
            </p>
          ) : (
            <p>
              <FaMapMarkerAlt className="location-icon-marker" /> Detecting your location...
            </p>
          )}
        </div>
        
        <button 
          onClick={detectLocation} 
          disabled={loading}
          className="update-location-btn"
        >
          <span className="location-icon">📍</span>
          <span>Update Location</span>
        </button>

        {location && (
          <div className="radius-control">
            <label htmlFor="radius">Search radius: <strong>{radiusKm} km</strong></label>
            <input 
              type="range" 
              id="radius" 
              min="1" 
              max="20" 
              step="1" 
              value={radiusKm} 
              onChange={handleRadiusChange}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Looking for the best prices...</p>
        </div>
      ) : (
        <>
          {!showAllProducts && nearbyPrices.length > 0 ? (
            <div className="products-section">
              <h3>
                <FaMapMarkerAlt /> Nearby Prices
                <span className="products-count">{nearbyPrices.length} products found</span>
              </h3>
              {renderProductList(nearbyPrices)}
            </div>
          ) : (
            <div className="products-section">
              <h3>
                <FaShoppingBag /> All Products
                <span className="products-count">{allProducts.length} products total</span>
              </h3>
              {renderProductList(allProducts)}
              {allProducts.length === 0 && (
                <div className="add-first-product">
                  <p>No products added yet. Be the first to add a product!</p>
                  <button onClick={() => navigate('/add')}>Add Product</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyPricesScreen; 