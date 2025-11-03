import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onManualEntry: (jobId: string) => void;
  loading: boolean;
  error: string | null;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onManualEntry,
  loading,
  error
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualJobId, setManualJobId] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera scanning
  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please check permissions.');
      setShowManual(true);
    }
  };

  // Stop scanning
  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  // Handle manual entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualJobId.trim()) {
      onManualEntry(manualJobId.trim());
      setManualJobId('');
      setShowManual(false);
    }
  };

  // QR Code scanning effect
  useEffect(() => {
    if (!isScanning || !videoRef.current || !canvasRef.current) {
      return;
    }

    const scanFrame = () => {
      if (!videoRef.current || !canvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scanFrame);
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data and scan for QR code
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        // Barcode found, stop scanning and process
        stopScanning();
        onScan(code.data);
      } else {
        // Continue scanning
        requestAnimationFrame(scanFrame);
      }
    };

    // Start scanning loop
    const scanningFrame = requestAnimationFrame(scanFrame);

    return () => {
      cancelAnimationFrame(scanningFrame);
    };
  }, [isScanning, onScan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="barcode-scanner">
      <h2>📱 Scan Barcode</h2>
      
      {!isScanning && !showManual && (
        <div className="scanner-controls">
          <button 
            onClick={startScanning}
            disabled={loading}
            className="scan-button"
          >
            📷 Start Camera Scan
          </button>
          
          <button 
            onClick={() => setShowManual(true)}
            disabled={loading}
            className="manual-button"
          >
            ⌨️ Manual Entry
          </button>
        </div>
      )}

      {isScanning && (
        <div className="scanning-view">
          <div className="video-container">
            <video
              ref={videoRef}
              className="scanner-video"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            <div className="scanner-overlay">
              <div className="scan-area"></div>
            </div>
          </div>
          
          <button 
            onClick={stopScanning}
            className="stop-scan-button"
          >
            ⏹️ Stop Scanning
          </button>
          
          <p className="scan-instructions">
            Position the barcode within the scanning area
          </p>
        </div>
      )}

      {showManual && (
        <div className="manual-entry">
          <form onSubmit={handleManualSubmit}>
            <label htmlFor="jobId">Enter Job ID:</label>
            <input
              id="jobId"
              type="text"
              value={manualJobId}
              onChange={(e) => setManualJobId(e.target.value)}
              placeholder="e.g., SHEET-3670"
              className="manual-input"
              disabled={loading}
            />
            
            <div className="manual-controls">
              <button 
                type="submit"
                disabled={!manualJobId.trim() || loading}
                className="submit-button"
              >
                Search Job
              </button>
              
              <button 
                type="button"
                onClick={() => setShowManual(false)}
                disabled={loading}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      <div className="sample-job-info">
        <h4>📋 Sample Job IDs for Testing:</h4>
        <ul>
          <li><strong>SHEET-3670:</strong> SMB Engineers - Stainless Steel 30mm</li>
          <li><strong>TEST-1234:</strong> ABC Manufacturing - Aluminum 10mm</li>
        </ul>
      </div>
    </div>
  );
};