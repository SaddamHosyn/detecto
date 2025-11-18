import React, { useState, useRef } from 'react';
import { detectPeople } from '../services/api';
import './DetectionView.css';

const DetectionView = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const imgRef = useRef(null);
  const [, setImageLoadedToggle] = useState(false);

const handleImageLoad = () => {
  // Trigger a state update to re-render after image loads to get correct dimensions
  setImageLoadedToggle(v => !v);
};


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setDetectionResults(null);
      setError(null);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleDetect = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await detectPeople(selectedImage);
      setDetectionResults(results);
    } catch (err) {
      setError(err.detail || 'Error detecting people');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Person Detection System</h1>
      
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="file-input"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="upload-button">
          Choose Image
        </label>
        
        <button
          onClick={handleDetect}
          disabled={!selectedImage || loading}
          className="detect-button"
        >
          {loading ? 'Detecting...' : 'Detect People'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

   {imagePreview && (
  <div className="image-container">
    <div className="image-wrapper" style={{ position: 'relative' }}>
      <img
        ref={imgRef}
        src={imagePreview}
        alt="Selected"
        className="detection-image"
        onLoad={handleImageLoad}
      />
      {detectionResults && detectionResults.detections.map((detection, index) => {
        // Calculate scale factor
        const scaleX = imgRef.current?.naturalWidth / imgRef.current?.clientWidth || 1;
        const scaleY = imgRef.current?.naturalHeight / imgRef.current?.clientHeight || 1;
        
        return (
          <div
            key={index}
            className="bounding-box"
            style={{
              left: `${detection.bbox.x1 / scaleX}px`,
              top: `${detection.bbox.y1 / scaleY}px`,
              width: `${(detection.bbox.x2 - detection.bbox.x1) / scaleX}px`,
              height: `${(detection.bbox.y2 - detection.bbox.y1) / scaleY}px`,
            }}
          >
            <span className="confidence-label">
              {(detection.confidence * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  </div>
)}


      {detectionResults && (
        <div className="results-section">
          <h2>Detection Results</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{detectionResults.person_count}</div>
              <div className="stat-label">People Detected</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {(detectionResults.average_confidence * 100).toFixed(1)}%
              </div>
              <div className="stat-label">Avg Confidence</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {detectionResults.inference_time_seconds.toFixed(3)}s
              </div>
              <div className="stat-label">Processing Time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionView;
