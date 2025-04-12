import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import FirebaseService from '../services/FirebaseService';
import { FaRupeeSign, FaCalendarAlt, FaChartLine, FaHistory, FaClock, FaArrowLeft, FaBell, FaFileDownload, FaChevronDown, FaInfoCircle, FaSync, FaFlask } from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Function to generate mock price history data for testing
const generateMockTrendData = (days = 30, basePrice = 100) => {
  const today = new Date();
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(today.getDate() - (days - i));
    
    // Generate a price with some randomness but following a trend
    const trendFactor = 1 + (i / days) * 0.2; // Slight upward trend
    const randomFactor = 0.9 + Math.random() * 0.2; // Random fluctuation between 0.9 and 1.1
    const price = basePrice * trendFactor * randomFactor;
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      count: Math.floor(Math.random() * 5) + 1 // Random number of entries per day (1-5)
    });
  }
  
  return data;
};

const PriceTrendsScreen = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [timeframe, setTimeframe] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  const [useSampleData, setUseSampleData] = useState(false);
  const navigate = useNavigate();

  console.log("PriceTrendsScreen rendering with productId:", productId);
  console.log("Current timeframe:", timeframe);
  console.log("Loading states:", { loading, loadingChart });

  const fetchProductAndTrends = async () => {
    if (!productId) {
      console.log("No productId provided, cannot fetch data");
      return;
    }

    try {
      console.log(`Fetching product data for ID: ${productId}`);
      setLoading(true);
      
      // Get product details
      const productData = await FirebaseService.getProductById(productId);
      console.log("Product data received:", productData);
      
      if (!productData) {
        console.log("No product found with the given ID");
        setError('Product not found');
        setLoading(false);
        return;
      }
      
      setProduct(productData);
      setLoading(false);
      
      // After getting the product, get price history (with visual loading indicator)
      console.log(`Fetching price history for timeframe: ${timeframe}`);
      setLoadingChart(true);
      
      try {
        const historyData = await FirebaseService.getPriceHistoryForTrends(productId, timeframe);
        console.log("Price history data received:", historyData);
        setTrendData(historyData);
      } catch (historyError) {
        console.error("Error fetching price history:", historyError);
        setError(`Error fetching price history: ${historyError.message}`);
      } finally {
        setLoadingChart(false);
        setInitialDataFetched(true);
      }
    } catch (err) {
      console.error('Error in fetchProductAndTrends:', err);
      setError(`Error fetching data: ${err.message}`);
      setLoading(false);
      setLoadingChart(false);
      setInitialDataFetched(true);
    }
  };

  useEffect(() => {
    console.log("useEffect running for product and trends");
    if (!useSampleData) {
      fetchProductAndTrends();
    }
  }, [productId, timeframe, useSampleData]);

  const handleTimeframeChange = (newTimeframe) => {
    console.log(`Changing timeframe from ${timeframe} to ${newTimeframe}`);
    setTimeframe(newTimeframe);
  };

  const handleManualRefresh = () => {
    console.log("Manual refresh triggered");
    if (useSampleData) {
      // Regenerate sample data for the selected timeframe
      handleUseSampleData();
    } else {
      fetchProductAndTrends();
    }
  };

  const handleUseSampleData = () => {
    console.log("Using sample data for testing");
    setUseSampleData(true);
    setLoading(false);
    setLoadingChart(true);
    
    // Set a sample product if none exists
    if (!product) {
      setProduct({
        id: 'sample-product',
        productName: 'Sample Product',
        productSlug: 'sample-product',
        category: 'Test'
      });
    }
    
    // Generate different amounts of sample data based on timeframe
    setTimeout(() => {
      let days;
      switch(timeframe) {
        case 'week':
          days = 7;
          break;
        case 'month':
          days = 30;
          break;
        default: // 'all'
          days = 90;
      }
      
      const sampleData = generateMockTrendData(days);
      setTrendData(sampleData);
      setLoadingChart(false);
      setInitialDataFetched(true);
    }, 800); // Simulate loading delay
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const prepareChartData = () => {
    console.log("Preparing chart data with trendData length:", trendData?.length);
    if (!trendData || trendData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Price',
            data: [],
            borderColor: '#4361ee',
            backgroundColor: 'rgba(67, 97, 238, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#4361ee',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3
          }
        ]
      };
    }

    // Sort data by date
    const sortedData = [...trendData].sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log("Sorted trend data:", sortedData);
    
    return {
      labels: sortedData.map(item => formatDate(item.date)),
      datasets: [
        {
          label: 'Average Price',
          data: sortedData.map(item => item.price),
          borderColor: '#4361ee',
          backgroundColor: 'rgba(67, 97, 238, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#4361ee',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: true
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Poppins',
            size: 12,
            weight: 500
          },
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#495057',
        bodyColor: '#212529',
        titleFont: {
          family: 'Poppins',
          size: 13,
          weight: 600
        },
        bodyFont: {
          family: 'Poppins',
          size: 12
        },
        borderColor: '#e9ecef',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          title: function(context) {
            if (!trendData || !trendData[context[0].dataIndex]) return '';
            return formatDate(trendData[context[0].dataIndex].date);
          },
          label: function(context) {
            return `Price: ₹${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            family: 'Poppins',
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          font: {
            family: 'Poppins',
            size: 12
          },
          callback: function(value) {
            return '₹' + value.toFixed(2);
          }
        },
        grid: {
          color: '#f0f0f0'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    hover: {
      mode: 'index',
      intersect: false
    }
  };

  const setPriceAlert = async () => {
    try {
      // In a real app, you'd get the userId from authentication
      const userId = 'current-user-id'; 
      
      // Get current lowest price
      const lowestPrice = Math.min(...trendData.map(item => item.price));
      const targetPrice = window.prompt('Set target price for alert:', (lowestPrice * 0.9).toFixed(2));
      
      if (targetPrice === null) return; // User canceled
      
      const alertPrice = parseFloat(targetPrice);
      
      if (isNaN(alertPrice) || alertPrice <= 0) {
        alert('Please enter a valid price');
        return;
      }
      
      await FirebaseService.setPriceAlert(productId, alertPrice, userId);
      alert('Price alert set successfully!');
    } catch (err) {
      console.error('Error setting price alert:', err);
      alert(`Error setting price alert: ${err.message}`);
    }
  };

  const exportData = async () => {
    try {
      // In a real app, you'd filter for just this product
      const userId = 'current-user-id';
      const data = await FirebaseService.exportUserData(userId);
      
      // Filter for just this product
      const productData = data.filter(entry => entry.productId === productId);
      
      // Create a downloadable JSON file
      const jsonData = JSON.stringify(productData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.productName.replace(/\s+/g, '_')}_price_history.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert(`Error exporting data: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading price trends...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <div className="error-actions">
          <button onClick={handleManualRefresh} className="retry-button">
            <FaSync /> Try Again
          </button>
          <button onClick={handleUseSampleData} className="sample-button">
            <FaFlask /> Use Sample Data
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="not-found">
        <p>Product not found</p>
        <div className="error-actions">
          <button onClick={handleManualRefresh} className="retry-button">
            <FaSync /> Retry
          </button>
          <button onClick={handleUseSampleData} className="sample-button">
            <FaFlask /> Use Sample Data
          </button>
        </div>
      </div>
    );
  }

  // Calculate price differences if we have data
  const priceData = trendData.length > 0 ? {
    lowest: Math.min(...trendData.map(item => item.price)),
    highest: Math.max(...trendData.map(item => item.price)),
    average: trendData.reduce((sum, item) => sum + item.price, 0) / trendData.length,
    dataPoints: trendData.reduce((total, item) => total + item.count, 0),
    
    // Calculate price fluctuation percentage between highest and lowest
    fluctuation: Math.min(...trendData.map(item => item.price)) > 0 
      ? ((Math.max(...trendData.map(item => item.price)) - Math.min(...trendData.map(item => item.price))) / 
         Math.min(...trendData.map(item => item.price)) * 100)
      : 0
  } : null;

  return (
    <div className="price-trends-screen">
      <div className="screen-header-with-badge">
        <h2>
          {product.productName} - Price Trends
        </h2>
        {useSampleData && <span className="sample-data-badge"><FaFlask /> Sample Data</span>}
      </div>
      
      <div className="trends-controls">
        <div className="timeframe-buttons">
          <button 
            className={timeframe === 'week' ? 'active' : ''} 
            onClick={() => handleTimeframeChange('week')}
          >
            <FaClock size={14} /> <span className="button-text">Last Week</span>
          </button>
          <button 
            className={timeframe === 'month' ? 'active' : ''} 
            onClick={() => handleTimeframeChange('month')}
          >
            <FaCalendarAlt size={14} /> <span className="button-text">Last Month</span>
          </button>
          <button 
            className={timeframe === 'all' ? 'active' : ''} 
            onClick={() => handleTimeframeChange('all')}
          >
            <FaHistory size={14} /> <span className="button-text">All Time</span>
          </button>
        </div>
        
        <div className="action-buttons">
          {!useSampleData ? (
            <button className="sample-button" onClick={handleUseSampleData} title="Generate sample data for testing">
              <FaFlask size={14} /> <span className="button-text">Sample</span>
            </button>
          ) : (
            <button className="live-data-button" onClick={() => setUseSampleData(false)} title="Fetch real data">
              <FaChartLine size={14} /> <span className="button-text">Live</span>
            </button>
          )}
          <button className="refresh-button" onClick={handleManualRefresh}>
            <FaSync size={14} /> <span className="button-text">Refresh</span>
          </button>
          <button className="alert-button" onClick={setPriceAlert}>
            <FaBell size={14} /> <span className="button-text">Alert</span>
          </button>
          <button className="export-button" onClick={exportData}>
            <FaFileDownload size={14} /> <span className="button-text">Export</span>
          </button>
        </div>
      </div>
      
      <div className="chart-container">
        {loadingChart ? (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <p>Loading chart data...</p>
          </div>
        ) : trendData.length > 0 ? (
          <Line data={prepareChartData()} options={chartOptions} />
        ) : (
          <div className="no-data">
            <FaInfoCircle size={36} color="#6c757d" />
            <p>No price data available for the selected timeframe.</p>
            <div className="no-data-actions">
              <button onClick={handleManualRefresh} className="refresh-button-alt">
                <FaSync /> <span className="button-text">Refresh Data</span>
              </button>
              {!useSampleData && (
                <button onClick={handleUseSampleData} className="sample-button-alt">
                  <FaFlask /> <span className="button-text">Use Sample Data</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {priceData && (
        <div className="price-stats">
          <div className="stat-item">
            <span className="stat-label">Lowest Price</span>
            <span className="stat-value">
              <FaRupeeSign /> {priceData.lowest.toFixed(2)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Highest Price</span>
            <span className="stat-value">
              <FaRupeeSign /> {priceData.highest.toFixed(2)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average Price</span>
            <span className="stat-value">
              <FaRupeeSign /> {priceData.average.toFixed(2)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Price Fluctuation</span>
            <span className="stat-value">
              {priceData.fluctuation.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
      
      <div className="navigation-buttons">
        <button onClick={() => navigate(`/product/${product.productSlug}`)}>
          <FaArrowLeft /> <span className="button-text">View Price History</span>
        </button>
      </div>

      {/* Debug Information - only visible during development*/}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <details>
            <summary>Debug Info</summary>
            <pre>{JSON.stringify({
              productId,
              productData: product,
              timeframe,
              trendDataCount: trendData?.length || 0,
              loading,
              loadingChart,
              initialDataFetched,
              useSampleData
            }, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default PriceTrendsScreen; 