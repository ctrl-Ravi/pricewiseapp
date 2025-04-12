import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FirebaseService from '../services/FirebaseService';

const ProductHistoryScreen = () => {
  const { productSlug } = useParams();
  const [product, setProduct] = useState(null);
  const [priceEntries, setPriceEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductAndPrices = async () => {
      if (!productSlug) return;

      try {
        setLoading(true);
        
        // Get product details by slug
        const productData = await FirebaseService.getProductBySlug(productSlug);
        
        if (!productData) {
          setError('Product not found');
          setLoading(false);
          return;
        }
        
        setProduct(productData);
        
        // Get price entries for this product
        const entries = await FirebaseService.getPriceEntriesForProduct(productData.id);
        setPriceEntries(entries);
      } catch (err) {
        setError(`Error fetching data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndPrices();
  }, [productSlug]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!product) {
    return <div className="not-found">Product not found</div>;
  }

  return (
    <div className="product-history-screen">
      <h2>{product.productName}</h2>
      {product.category && <p className="category">Category: {product.category}</p>}

      <h3>Price History</h3>
      
      {priceEntries.length === 0 ? (
        <p>No price entries found for this product.</p>
      ) : (
        <div className="price-entries-list">
          {priceEntries.map((entry) => (
            <div key={entry.id} className="price-entry-card">
              <div className="price-section">
                <span className="price">${entry.price.toFixed(2)}</span>
                {entry.shopName && <span className="shop">{entry.shopName}</span>}
              </div>
              
              <div className="details-section">
                {entry.locationName && (
                  <p className="location">{entry.locationName}</p>
                )}
                <p className="date">{formatDate(entry.timestamp)}</p>
              </div>
              
              {entry.photoURL && (
                <div className="photo-section">
                  <img src={entry.photoURL} alt={`${product.productName} at ${entry.shopName || 'unknown shop'}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductHistoryScreen; 