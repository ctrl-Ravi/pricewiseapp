import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FirebaseService from '../services/FirebaseService';
import { 
  FaTrash, FaEdit, FaPlus, FaSearch, 
  FaFilter, FaArrowLeft, FaInfoCircle,
  FaExclamationTriangle, FaCheck, FaTimes
} from 'react-icons/fa';
import '../App.css';

const ProductManagementScreen = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  
  // Fetch all products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const allProducts = await FirebaseService.getAllProducts();
        setProducts(allProducts);
        setFilteredProducts(allProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(`Failed to load products: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = products.filter(product => 
      product.productName.toLowerCase().includes(lowerSearchTerm) || 
      (product.category && product.category.toLowerCase().includes(lowerSearchTerm))
    );
    
    setFilteredProducts(filtered);
  }, [searchTerm, products]);
  
  // Handle sorting
  useEffect(() => {
    const sorted = [...filteredProducts].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.productName.localeCompare(b.productName);
      } else if (sortBy === 'category') {
        const catA = a.category || '';
        const catB = b.category || '';
        comparison = catA.localeCompare(catB);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredProducts(sorted);
  }, [sortBy, sortOrder]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking on the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const handleAddProduct = () => {
    navigate('/add');
  };
  
  const handleEditProduct = (productId) => {
    navigate(`/edit-product/${productId}`);
  };
  
  const confirmDeleteProduct = (product) => {
    setDeleteConfirmation(product);
  };
  
  const handleDeleteProduct = async () => {
    if (!deleteConfirmation) return;
    
    try {
      setLoading(true);
      const product = deleteConfirmation;
      
      const result = await FirebaseService.deleteProduct(product.id, true);
      
      if (result.success) {
        // Remove the deleted product from the lists
        const updatedProducts = products.filter(p => p.id !== product.id);
        setProducts(updatedProducts);
        setFilteredProducts(filteredProducts.filter(p => p.id !== product.id));
        
        setActionResult({
          type: 'success',
          message: result.message
        });
      } else {
        setActionResult({
          type: 'error',
          message: result.message
        });
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setActionResult({
        type: 'error',
        message: `Error deleting product: ${err.message}`
      });
    } finally {
      setLoading(false);
      setDeleteConfirmation(null);
      
      // Auto-hide the action result after 5 seconds
      setTimeout(() => {
        setActionResult(null);
      }, 5000);
    }
  };
  
  const cancelDeleteProduct = () => {
    setDeleteConfirmation(null);
  };
  
  if (loading && products.length === 0) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }
  
  return (
    <div className="product-management-screen">
      <div className="screen-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </button>
        <h2>Manage Products</h2>
        <button 
          className="add-button"
          onClick={handleAddProduct}
        >
          <FaPlus /> Add Product
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      {actionResult && (
        <div className={`action-result ${actionResult.type}`}>
          {actionResult.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />} 
          {actionResult.message}
          <button 
            className="close-btn"
            onClick={() => setActionResult(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}
      
      <div className="management-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="sort-controls">
          <span className="sort-label"><FaFilter /> Sort by:</span>
          <button 
            className={`sort-button ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => handleSort('name')}
          >
            Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            className={`sort-button ${sortBy === 'category' ? 'active' : ''}`}
            onClick={() => handleSort('category')}
          >
            Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="no-results">
          {searchTerm ? (
            <p>No products found matching "{searchTerm}"</p>
          ) : (
            <>
              <p>No products available</p>
              <button onClick={handleAddProduct} className="add-btn">
                <FaPlus /> Add Your First Product
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div className="product-card" key={product.id}>
              <div className="product-content">
                <h3 className="product-name">{product.productName}</h3>
                {product.category && (
                  <div className="product-category">{product.category}</div>
                )}
                <div className="product-slug">
                  <span className="label">Slug:</span> {product.productSlug}
                </div>
              </div>
              
              <div className="product-actions">
                <button 
                  className="edit-btn"
                  onClick={() => handleEditProduct(product.id)}
                  title="Edit product"
                >
                  <FaEdit />
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => confirmDeleteProduct(product)}
                  title="Delete product"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {deleteConfirmation && (
        <div className="delete-confirmation-modal">
          <div className="modal-content">
            <div className="modal-header">
              <FaExclamationTriangle className="warning-icon" />
              <h3>Confirm Delete</h3>
            </div>
            
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{deleteConfirmation.productName}</strong>?
              </p>
              <p className="warning-text">
                <FaInfoCircle /> This will also delete all price entries associated with this product.
                This action cannot be undone.
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={cancelDeleteProduct}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={handleDeleteProduct}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementScreen; 