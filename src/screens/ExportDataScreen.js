import React, { useState } from 'react';
import FirebaseService from '../services/FirebaseService';

const ExportDataScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // In a real app, you'd get the userId from authentication
  const userId = 'current-user-id';

  const handleExportJSON = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const data = await FirebaseService.exportUserData(userId);
      
      // Create a downloadable JSON file
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `pricewise_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully!');
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(`Error exporting data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const data = await FirebaseService.exportUserData(userId);
      
      // If no data, show error
      if (!data || data.length === 0) {
        setError('No data to export');
        setLoading(false);
        return;
      }
      
      // Determine CSV columns based on the first entry
      const columns = [
        'Product Name',
        'Price',
        'Shop Name',
        'Location',
        'Date',
        'Category'
      ];
      
      // Create CSV content
      let csvContent = columns.join(',') + '\n';
      
      data.forEach(entry => {
        const row = [
          `"${entry.productName || 'Unknown Product'}"`,
          entry.price,
          `"${entry.shopName || ''}"`,
          `"${entry.locationName || ''}"`,
          `"${entry.date ? new Date(entry.date).toLocaleString() : ''}"`,
          `"${entry.productCategory || ''}"`,
        ];
        
        csvContent += row.join(',') + '\n';
      });
      
      // Create a downloadable CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `pricewise_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully to CSV format!');
    } catch (err) {
      console.error('Error exporting CSV data:', err);
      setError(`Error exporting data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-data-screen">
      <h2>Export Your Data</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="export-options">
        <div className="export-option-card">
          <h3>Export to JSON</h3>
          <p>
            Export your price data as a JSON file. This format preserves all details 
            and can be used for backup or importing into other systems.
          </p>
          <button 
            onClick={handleExportJSON} 
            disabled={loading}
            className="export-button"
          >
            {loading ? 'Exporting...' : 'Export JSON'}
          </button>
        </div>
        
        <div className="export-option-card">
          <h3>Export to CSV</h3>
          <p>
            Export your price data as a CSV file that can be opened in spreadsheet 
            applications like Microsoft Excel or Google Sheets.
          </p>
          <button 
            onClick={handleExportCSV} 
            disabled={loading}
            className="export-button"
          >
            {loading ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
      
      <div className="backup-info">
        <h3>Data Backup Tips</h3>
        <ul>
          <li>Export your data regularly for backup purposes</li>
          <li>Store backup files in a secure location</li>
          <li>For offline access, keep the latest export on your device</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportDataScreen; 