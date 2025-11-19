import React, { useState, useRef } from 'react';
import { detectPeople } from '../services/api';
import './DetectionView.css';

const DetectionView = () => {
  const [mode, setMode] = useState('upload'); // 'upload' or 'webcam'
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [stream, setStream] = useState(null);

  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [, setImageLoadedToggle] = useState(false);

const handleImageLoad = () => {
  // Trigger a state update to re-render after image loads to get correct dimensions
  setImageLoadedToggle(v => !v);
};

  const handleVideoReady = () => {
    if (videoRef.current) {
      console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
    }
    setIsVideoReady(true);
    console.log('Video stream is ready');
  };

  const startWebcam = async () => {
    try {
      setIsVideoReady(false);
      console.log('Requesting webcam access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      console.log('Webcam access granted', mediaStream);
      setStream(mediaStream);
      setIsWebcamActive(true);
      setError(null);
    } catch (err) {
      setError('Unable to access webcam. Please grant camera permissions.');
      console.error('Webcam error:', err);
    }
  };

  // Set video stream when ref and stream are available
  React.useEffect(() => {
    if (stream && videoRef.current) {
      console.log('Setting video srcObject');
      videoRef.current.srcObject = stream;
      
      // Fallback: Auto-enable after 2 seconds if events don't fire
      const timeout = setTimeout(() => {
        console.log('Fallback: Force enabling video after timeout');
        setIsVideoReady(true);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [stream, isVideoReady]);

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsWebcamActive(false);
    setIsVideoReady(false);
    setDetectionResults(null);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Webcam not ready. Please wait a moment and try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Video stream not ready. Please wait a moment and try again.');
      return;
    }

    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    setLoading(true);
    setError(null);

    try {
      // Convert canvas to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      if (!blob) {
        throw new Error('Failed to capture image from webcam');
      }

      const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
      console.log('Sending image to backend:', file.name, file.size, 'bytes');
      
      const results = await detectPeople(file);
      console.log('Detection results:', results);
      
      setDetectionResults(results);
      
      // Set the captured frame as preview
      setImagePreview(canvas.toDataURL());
    } catch (err) {
      console.error('Detection error:', err);
      setError(err.detail || err.message || 'Error detecting people. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup webcam on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);


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
      
      <div className="mode-toggle">
        <button
          className={`mode-button ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => {
            setMode('upload');
            stopWebcam();
            setDetectionResults(null);
            setImagePreview(null);
          }}
        >
          📁 Upload Image
        </button>
        <button
          className={`mode-button ${mode === 'webcam' ? 'active' : ''}`}
          onClick={() => {
            setMode('webcam');
            setSelectedImage(null);
            setImagePreview(null);
            setDetectionResults(null);
          }}
        >
          📷 Live Webcam
        </button>
      </div>

      {mode === 'upload' ? (
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
      ) : (
        <div className="webcam-section">
          {!isWebcamActive ? (
            <button onClick={startWebcam} className="webcam-button">
              Start Webcam
            </button>
          ) : (
            <>
              <div className="webcam-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="webcam-video"
                  onLoadedData={handleVideoReady}
                  onLoadedMetadata={() => console.log('Video metadata loaded')}
                  onCanPlay={() => {
                    console.log('Video can play');
                    handleVideoReady();
                  }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {!isVideoReady && <div className="video-loading">Initializing camera...</div>}
              </div>
              
              <div className="webcam-controls">
                <button 
                  onClick={captureFrame} 
                  disabled={loading || !isVideoReady} 
                  className="capture-button"
                >
                  {loading ? 'Detecting...' : isVideoReady ? '📸 Capture & Detect' : 'Loading video...'}
                </button>
                <button onClick={stopWebcam} className="stop-button">
                  Stop Webcam
                </button>
              </div>
            </>
          )}
        </div>
      )}

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
