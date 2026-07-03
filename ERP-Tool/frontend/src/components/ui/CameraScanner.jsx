import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function CameraScanner({ onScan, onError }) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [permissionError, setPermissionError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          setSelectedCamera(devices[0].id);
        }
      })
      .catch((err) => {
        if (err.name === 'NotFoundError') {
          // Suppress console error for missing camera
          setPermissionError('No camera device found on this system.');
        } else {
          console.error('Camera permissions denied', err);
          setPermissionError('Camera permissions denied or error accessing camera.');
        }
      });

    return () => stopScanner();
  }, []);

  const startScanner = async () => {
    if (!selectedCamera) return;
    try {
      setPermissionError('');
      const scanner = new Html5Qrcode("camera-reader");
      scannerRef.current = scanner;
      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (onScan) onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          if (onError) onError(errorMessage);
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start scanner', err);
      setPermissionError('Failed to start scanner. Ensure permissions are granted.');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      }).catch(err => {
        console.error('Failed to stop scanner', err);
      });
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [isScanning]);

  return (
    <div className="w-full">
      {permissionError && (
        <div className="text-red-400 text-sm mb-3 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
          {permissionError}
        </div>
      )}
      
      {!isScanning && (
        <div className="flex gap-2 items-center">
          {cameras.length > 0 ? (
            <>
              <select 
                className="form-input flex-1"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
              >
                {cameras.map(c => (
                  <option key={c.id} value={c.id}>{c.label || `Camera ${c.id}`}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={startScanner}>
                Start Camera
              </button>
            </>
          ) : (
             <div className="text-dimmed text-sm">No cameras available or permission pending...</div>
          )}
        </div>
      )}
      
      <div 
        id="camera-reader" 
        className={`w-full max-w-md mx-auto rounded-xl overflow-hidden ${isScanning ? 'block border border-main' : 'hidden'}`}
      ></div>
      
      {isScanning && (
        <div className="mt-4 flex justify-center">
          <button className="btn-danger" onClick={stopScanner}>
            Stop Camera
          </button>
        </div>
      )}
    </div>
  );
}
