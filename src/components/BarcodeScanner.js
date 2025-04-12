import React, { useState, useEffect, useRef } from 'react';
import Quagga from 'quagga';
import { FaBarcode, FaTimes, FaCamera } from 'react-icons/fa';
import '../styles/components.css';

const BarcodeScanner = ({ onScanComplete, value, onChange }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const scannerRef = useRef(null);
  
  // Initialize barcode scanner
  const initializeScanner = () => {
    if (scanning && scannerRef.current) {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment", // use the rear camera
            aspectRatio: { min: 1, max: 2 },
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader"],
        },
        locate: true,
      }, (err) => {
        if (err) {
          console.error("Error initializing Quagga:", err);
          setError("Could not access camera. Please ensure you've granted camera permission.");
          setScanning(false);
          return;
        }
        setInitialized(true);
        Quagga.start();
      });
      
      // Set up barcode detection handler
      Quagga.onDetected(handleBarcodeDetected);
      
      return () => {
        Quagga.stop();
        Quagga.offDetected(handleBarcodeDetected);
      };
    }
  };
  
  // Debounce repeated scans
  const lastScannedRef = useRef(null);
  const handleBarcodeDetected = (result) => {
    if (result && result.codeResult) {
      const code = result.codeResult.code;
      
      // Avoid rapid duplicate scans
      if (lastScannedRef.current === code) {
        return;
      }
      
      // Store the last scanned code
      lastScannedRef.current = code;
      
      // Update the result
      setScanResult(code);
      
      // Update input value if onChange is provided
      if (onChange) {
        onChange(code);
      }
      
      // Call external handler
      if (onScanComplete) {
        onScanComplete(code);
      }
      
      // Stop the scanner
      stopScanner();
      
      // Reset the lastScanned after a delay to allow rescanning the same code later
      setTimeout(() => {
        lastScannedRef.current = null;
      }, 3000);
    }
  };
  
  // Start or stop scanner
  useEffect(() => {
    if (scanning) {
      const cleanup = initializeScanner();
      return () => {
        if (cleanup) cleanup();
      };
    } else if (initialized) {
      stopScanner();
    }
  }, [scanning]);
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (initialized) {
        stopScanner();
      }
    };
  }, [initialized]);
  
  const startScanner = () => {
    setError(null);
    setScanResult(null);
    setScanning(true);
  };
  
  const stopScanner = () => {
    if (initialized) {
      Quagga.stop();
      setInitialized(false);
    }
    setScanning(false);
  };
  
  return (
    <div className="barcode-scanner">
      {scanning ? (
        <div className="scanner-container">
          <div ref={scannerRef} className="viewport"></div>
          <div className="scanner-overlay">
            <div className="scanner-corners">
              <div className="corner top-left"></div>
              <div className="corner top-right"></div>
              <div className="corner bottom-left"></div>
              <div className="corner bottom-right"></div>
            </div>
            <div className="instructions">
              Position barcode within the frame
            </div>
          </div>
          <button 
            className="scanner-button cancel" 
            onClick={stopScanner}
            aria-label="Cancel scanning"
          >
            <FaTimes /> Cancel
          </button>
        </div>
      ) : (
        <div className="input-with-actions">
          <div className="input-wrapper">
            <input
              type="text"
              value={value || scanResult || ''}
              onChange={(e) => onChange && onChange(e.target.value)}
              placeholder="Enter barcode number or scan with camera"
              className="barcode-input"
            />
            {(value || scanResult) && (
              <button 
                className="clear-button"
                onClick={() => {
                  setScanResult(null);
                  if (onChange) onChange('');
                }}
                aria-label="Clear barcode value"
              >
                <FaTimes />
              </button>
            )}
          </div>
          <button 
            className="action-button scan-button"
            onClick={startScanner}
            aria-label="Scan barcode"
          >
            <FaCamera />
            <span className="button-text">Scan</span>
          </button>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default BarcodeScanner; 