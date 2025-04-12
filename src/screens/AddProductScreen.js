import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FirebaseService from '../services/FirebaseService';
import { FaCamera, FaMapMarkerAlt, FaCheck, FaStore, FaTag, FaRupeeSign, FaClock, FaGlobeAmericas, FaWeight, FaLock, FaTimes } from 'react-icons/fa';
import '../styles/add-product.css';

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (mL)' },
  { value: 'pc', label: 'Piece' },
  { value: 'pack', label: 'Pack' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'box', label: 'Box' },
];

const AddProductScreen = () => {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [addedProduct, setAddedProduct] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [timestamp, setTimestamp] = useState(new Date());
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pc');
  const navigate = useNavigate();
  const [locationLoading, setLocationLoading] = useState(false);

  // Auto-detect location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      detectLocation();
    }
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);

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

        setLocationLoading(false);
      },
      error => {
        console.error('Geolocation error:', error);
        setLocationLoading(false);
      }
    );
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoURL(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setProductName('');
    setPrice('');
    setShopName('');
    setIsPublic(true);
    setTimestamp(new Date());
    setQuantity('1');
    setUnit('pc');
    setPhotoURL(null);
    setPhotoFile(null);
  };

  const formatProductDetails = () => {
    if (unit === 'pc' || unit === 'pack' || unit === 'box' || unit === 'dozen') {
      return `${productName} (${quantity} ${unit === 'pc' ? 'piece' : unit})`;
    } else {
      return `${productName} (${quantity}${unit})`;
    }
  };

  const calculateUnitPrice = () => {
    const numericPrice = parseFloat(price);
    const numericQuantity = parseFloat(quantity);
    
    if (!numericPrice || !numericQuantity || numericQuantity === 0) {
      return null;
    }
    
    return numericPrice / numericQuantity;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productName.trim()) {
      setError('Product name is required');
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setAddedProduct(null);

    try {
      const formattedName = formatProductDetails();
      
      // Update timestamp to current time
      const currentTimestamp = new Date();
      setTimestamp(currentTimestamp);
      
      // Add the product first
      const product = await FirebaseService.addProduct(formattedName);

      // Upload photo if provided
      let uploadedPhotoURL = null;
      if (photoFile) {
        uploadedPhotoURL = await FirebaseService.uploadProductPhoto(photoFile, product.id);
      }

      // Calculate unit price
      const unitPrice = calculateUnitPrice();

      // Then add the price entry
      // eslint-disable-next-line no-unused-vars
      const priceEntry = await FirebaseService.addPriceEntry(
        product.id,
        parseFloat(price),
        shopName || null,
        location,
        locationName || null,
        null, // userId
        uploadedPhotoURL || photoURL,
        isPublic,
        currentTimestamp,
        parseFloat(quantity),
        unit,
        unitPrice
      );
      
      // Store the added product for reference
      setAddedProduct(product);
      
      // Clear form
      resetForm();
      
      setSuccessMessage(`Product "${formattedName}" added successfully with price ₹${parseFloat(price).toFixed(2)}!`);
    } catch (error) {
      console.error('Error adding entry:', error);
      setError(`Error adding entry: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = () => {
    if (addedProduct && addedProduct.productSlug) {
      navigate(`/product/${addedProduct.productSlug}`);
    }
  };

  const handleAddAnother = () => {
    setSuccessMessage(null);
    setAddedProduct(null);
  };

  const unitPrice = calculateUnitPrice();

  return (
    <div className="add-product-screen">
      <h2>Add New Product</h2>

      {error && (
        <div className="alert error">
          <p>{error}</p>
        </div>
      )}
      
      {successMessage ? (
        <div className="success-content">
          <div className="success-icon">
            <FaCheck />
          </div>
          <h3>Success!</h3>
          <p>{successMessage}</p>
          <div className="action-buttons">
            <button onClick={handleViewProduct} className="primary-button">
              View Product Details
            </button>
            <button onClick={handleAddAnother} className="secondary-button">
              Add Another Product
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-field">
              <label htmlFor="productName">
                <FaTag className="field-icon" />
                <span>Product Name <span className="required">*</span></span>
              </label>
              <input
                type="text"
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Milk 1L"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="quantity">
                  <FaWeight className="field-icon" />
                  <span>Quantity & Unit <span className="required">*</span></span>
                </label>
                <div className="modern-quantity-unit">
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity value"
                    step="0.01"
                    min="0.01"
                    required
                  />
                  <div className="unit-selector">
                    <select
                      id="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      required
                      aria-label="Unit of measurement"
                      title="Select the unit of measurement"
                    >
                      {UNIT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value} title={option.label}>
                          {option.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {unitPrice && (
                  <div className="unit-price">
                    <FaRupeeSign /> {unitPrice.toFixed(2)} per {unit === 'pc' ? 'piece' : unit}
                  </div>
                )}
              </div>
              
              <div className="form-field">
                <label htmlFor="price">
                  <FaRupeeSign className="field-icon" />
                  <span>Price (₹) <span className="required">*</span></span>
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 75.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Additional Details</h3>
            
            <div className="form-field">
              <label htmlFor="shopName">
                <FaStore className="field-icon" />
                <span>Shop Name (optional)</span>
              </label>
              <input
                type="text"
                id="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. BigBazaar"
              />
            </div>
            
            <div className="form-field">
              <label>
                <FaMapMarkerAlt className="field-icon" />
                <span>Location</span>
              </label>
              <div className="location-field">
                <div className="location-status">
                  {locationLoading ? (
                    <div className="location-loading">Detecting location...</div>
                  ) : location ? (
                    <div className="location-info">
                      <p>{locationName || "Location detected"}</p>
                    </div>
                  ) : (
                    <div className="location-empty">No location detected</div>
                  )}
                </div>
                <button 
                  type="button" 
                  className="detect-location-btn" 
                  onClick={detectLocation}
                  disabled={locationLoading}
                >
                  {location ? "Update" : "Detect"}
                </button>
              </div>
            </div>
            
            <div className="form-field">
              <label>
                <FaCamera className="field-icon" />
                <span>Product Photo (optional)</span>
              </label>
              <div className="compact-photo-upload">
                {photoURL ? (
                  <div className="compact-preview">
                    <img src={photoURL} alt="Product preview" />
                    <div className="compact-controls">
                      <button
                        type="button"
                        className="photo-action-btn change"
                        onClick={() => document.getElementById('photo').click()}
                        title="Change photo"
                      >
                        <FaCamera />
                      </button>
                      <button
                        type="button"
                        className="photo-action-btn remove"
                        onClick={() => {
                          setPhotoURL(null);
                          setPhotoFile(null);
                        }}
                        title="Remove photo"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="photo" className="compact-dropzone">
                    <FaCamera className="upload-icon-small" />
                    <span>Add Photo</span>
                  </label>
                )}
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="photo-input"
                />
              </div>
            </div>

            <div className="form-field">
              <div className="privacy-toggle">
                <div className="toggle-option">
                  <input 
                    type="radio" 
                    id="public" 
                    name="privacy" 
                    checked={isPublic} 
                    onChange={() => setIsPublic(true)}
                  />
                  <label htmlFor="public">
                    <FaGlobeAmericas className="field-icon" />
                    <div>
                      <span className="option-title">Public</span>
                      <span className="option-desc">Share with everyone</span>
                    </div>
                  </label>
                </div>
                
                <div className="toggle-option">
                  <input 
                    type="radio" 
                    id="private" 
                    name="privacy" 
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                  />
                  <label htmlFor="private">
                    <FaLock className="field-icon" />
                    <div>
                      <span className="option-title">Private</span>
                      <span className="option-desc">Only visible to you</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="time-indicator">
            <FaClock /> Last updated: {timestamp.toLocaleString('en-IN')}
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </form>
      )}
    </div>
  );
};

export default AddProductScreen; 