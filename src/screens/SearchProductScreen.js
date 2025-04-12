import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FirebaseService from '../services/FirebaseService';
import { FaRupeeSign, FaStore, FaClock, FaMapMarkerAlt, FaWeightHanging } from 'react-icons/fa';

const SearchProductScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]); 
  const [productDetails, setProductDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load all products when the component mounts
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        setLoading(true);
        const products = await FirebaseService.getAllProducts();
        setAllProducts(products);
        
        // Fetch price details for each product
        const details = {};
        for (const product of products) {
          const entries = await FirebaseService.getPriceEntriesForProduct(product.id);
          if (entries && entries.length > 0) {
            // Sort entries by date (newest first)
            entries.sort((a, b) => b.timestamp - a.timestamp);
            
            // Get price range
            const prices = entries.map(entry => entry.price);
            const lowestPrice = Math.min(...prices);
            const highestPrice = Math.max(...prices);
            
            // Get latest entry
            const latestEntry = entries[0];
            
            details[product.id] = {
              priceEntries: entries,
              lowestPrice,
              highestPrice,
              latestEntry
            };
          }
        }
        setProductDetails(details);
      } catch (err) {
        setError(`Error loading products: ${err.message}`);
        console.error('Error loading all products', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllProducts();
  }, []);

  // Debounce search to avoid too many requests while typing
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        
        const results = await FirebaseService.searchProductsByName(searchTerm);
        console.log('Search results:', results);
        setSearchResults(results);
      } catch (err) {
        setError(`Error searching products: ${err.message}`);
        console.error('Error searching products', err);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleProductSelect = (productId, productSlug) => {
    if (productSlug) {
      navigate(`/product/${productSlug}`);
    } else if (productId) {
      // If we only have the ID but not the slug, try to load by ID
      navigate(`/product-id/${productId}`);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleDateString();
  };

  const renderProductList = (products) => {
    if (products.length === 0) {
      return <div className="no-results">No products found</div>;
    }

    return (
      <ul className="product-list">
        {products.map((product) => {
          const details = productDetails[product.id] || {};
          const latestEntry = details.latestEntry || {};
          
          return (
            <li 
              key={product.id} 
              className="product-item"
              onClick={() => handleProductSelect(product.id, product.productSlug)}
            >
              <div className="product-name">{product.productName}</div>
              {product.category && <div className="product-category">{product.category}</div>}
              
              {details.lowestPrice && details.highestPrice && (
                <div className="price-range">
                  <FaRupeeSign size={12} /> 
                  {details.lowestPrice === details.highestPrice 
                    ? `${details.lowestPrice.toFixed(2)}` 
                    : `${details.lowestPrice.toFixed(2)} - ${details.highestPrice.toFixed(2)}`}
                </div>
              )}

              {latestEntry && (
                <div className="product-details">
                  {latestEntry.shopName && (
                    <div className="location-name">
                      <FaStore size={12} /> {latestEntry.shopName}
                    </div>
                  )}
                  
                  {latestEntry.locationName && (
                    <div className="location-name">
                      <FaMapMarkerAlt size={12} /> {latestEntry.locationName}
                    </div>
                  )}
                  
                  {latestEntry.quantity && latestEntry.unit && (
                    <div className="product-measure">
                      <FaWeightHanging size={12} /> {latestEntry.quantity} {latestEntry.unit}
                    </div>
                  )}
                  
                  {latestEntry.timestamp && (
                    <div className="timestamp-indicator">
                      <FaClock size={12} /> {formatDate(latestEntry.timestamp)}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="search-product-screen">
      <h2>Search Products</h2>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Start typing to search products..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="search-results">
        {loading ? (
          <div className="loading">Searching...</div>
        ) : searchTerm.trim().length >= 2 ? (
          // Show search results if there's a search term
          <>
            <h3>Search Results</h3>
            {renderProductList(searchResults)}
          </>
        ) : (
          // Show all products if there's no search term
          <>
            <h3>All Products</h3>
            {renderProductList(allProducts)}
            {allProducts.length === 0 && (
              <div className="add-first-product">
                <p>No products added yet. Be the first to add a product!</p>
                <button onClick={() => navigate('/add')}>Add Product</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchProductScreen; 