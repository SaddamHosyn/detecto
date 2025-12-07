import React, { useState, useRef, useEffect } from 'react';
import { detectPeople } from '../services/api';
import './DetectionView.css';

const DetectionView = () => {
  const [mode, setMode] = useState('upload');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [stream, setStream] = useState(null);
  const [isLiveDetection, setIsLiveDetection] = useState(false);
  
  const wsRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- HELPER: Determine Alert Class ---
  const getAlertClass = () => {
    if (!detectionResults) return '';
    const action = detectionResults.n8n_action;
    if (action === 'loud_noise') return 'alert-loud';
    if (action === 'low_noise') return 'alert-low';
    if (action === 'silence') return 'alert-safe';
    return '';
  };

  const getAlertMessage = () => {
    if (!detectionResults) return null;
    const action = detectionResults.n8n_action;
    if (action === 'loud_noise') return '🚨 CRITICAL ALERT: OVERCROWDED! 🚨';
    if (action === 'low_noise') return '⚠️ WARNING: Crowd Growing';
    if (action === 'silence') return '✅ Area Safe';
    return null;
  };

  // Auto-start detection when video is ready
  useEffect(() => {
    if (isVideoReady && isWebcamActive && !isLiveDetection) {
      console.log('🎬 Auto-starting live detection...');
      startLiveDetection();
    }
  }, [isVideoReady, isWebcamActive]);

  // Start webcam and live detection together
const startWebcamAndDetection = async () => {
  try {
    setIsVideoReady(false);
    setError(null);
    console.log('🎥 Requesting webcam access...');
    
    const mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    console.log('✅ Webcam access granted');
    
    // CRITICAL: Set video source immediately
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      console.log('✅ Video srcObject set');
      
      // Try to play
      try {
        await videoRef.current.play();
        console.log('✅ Video playing');
      } catch (playError) {
        console.warn('Play error (auto-play might be blocked):', playError);
      }
    } else {
      console.error('❌ videoRef.current is null!');
    }
    
    setStream(mediaStream);
    setIsWebcamActive(true);
    
    // Fallback timeout
    setTimeout(() => {
      if (!isVideoReady) {
        console.log('⚠️ Fallback: Force enabling video');
        setIsVideoReady(true);
      }
    }, 2000);
    
  } catch (err) {
    setError('Unable to access webcam. Please grant camera permissions.');
    console.error('❌ Webcam error:', err);
  }
};


  // Stop everything
  const stopWebcamAndDetection = () => {
    console.log('🛑 Stopping webcam and detection...');
    
    // Stop WebSocket
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Stop webcam
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setIsWebcamActive(false);
    setIsVideoReady(false);
    setIsLiveDetection(false);
    setDetectionResults(null);
  };

  const handleVideoReady = () => {
    if (videoRef.current) {
      console.log('📹 Video ready:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
    }
    setIsVideoReady(true);
  };

  // Start live detection with WebSocket
  const startLiveDetection = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.warn('Video or canvas not ready');
      return;
    }

    const wsUrl = 'ws://localhost:8000/api/ws/detect';
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsLiveDetection(true);
      setError(null);

      // Send frames every 100ms (10 FPS)
      frameIntervalRef.current = setInterval(() => {
        sendFrameToBackend();
      }, 100);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📊 Detection:', data.person_count, 'people');
      
      setDetectionResults({
        person_count: data.person_count,
        average_confidence: data.average_confidence,
        detections: data.detections,
        n8n_action: data.n8n_action || null, // Get n8n action from backend
        inference_time_seconds: 0
      });
    };

    wsRef.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setError('WebSocket connection failed. Make sure backend is running on port 8000.');
      stopWebcamAndDetection();
    };

    wsRef.current.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setIsLiveDetection(false);
    };
  };

  const sendFrameToBackend = () => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current) return;
    if (wsRef.current.readyState !== WebSocket.OPEN) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const frame = canvas.toDataURL('image/jpeg', 0.8);
    wsRef.current.send(frame);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcamAndDetection();
    };
  }, []);

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
    <div className={`container alert-container ${getAlertClass()}`}>
      
      {getAlertMessage() && (
        <div className={`alert-banner banner-${getAlertClass().replace('alert-', '')}`}>
          {getAlertMessage()}
        </div>
      )}

      <h1 className="title">Person Detection System</h1>
      
      <div className="mode-toggle">
        <button
          className={`mode-button ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => {
            setMode('upload');
            stopWebcamAndDetection();
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
  <div className="webcam-container">
    <div style={{ position: 'relative', width: '100%' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="webcam-video"
        onLoadedData={() => {
          console.log('✅ Video onLoadedData fired');
          handleVideoReady();
        }}
        onLoadedMetadata={() => {
          console.log('✅ Video metadata loaded');
          if (videoRef.current) {
            console.log('📹 Video dimensions:', 
              videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          }
        }}
        onCanPlay={() => {
          console.log('✅ Video onCanPlay fired');
          handleVideoReady();
        }}
      />
      
      {/* LIVE BOUNDING BOXES OVERLAY */}
      {isLiveDetection && detectionResults && detectionResults.detections && (
        detectionResults.detections.map((detection, index) => {
          if (!videoRef.current) return null;
          
          // Scale bounding boxes to video display size
          const videoElement = videoRef.current;
          const scaleX = videoElement.clientWidth / videoElement.videoWidth;
          const scaleY = videoElement.clientHeight / videoElement.videoHeight;
          
          return (
            <div
              key={index}
              className="bounding-box live-bbox"
              style={{
                position: 'absolute',
                left: `${detection.bbox.x1 * scaleX}px`,
                top: `${detection.bbox.y1 * scaleY}px`,
                width: `${(detection.bbox.x2 - detection.bbox.x1) * scaleX}px`,
                height: `${(detection.bbox.y2 - detection.bbox.y1) * scaleY}px`,
                border: '3px solid #00ff00',
                borderRadius: '4px',
                boxSizing: 'border-box',
                pointerEvents: 'none'
              }}
            >
              <span 
                className="confidence-label"
                style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '0',
                  background: '#00ff00',
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}
              >
                Person {(detection.confidence * 100).toFixed(1)}%
              </span>
            </div>
          );
        })
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {!isVideoReady && (
        <div className="video-loading">Initializing camera...</div>
      )}
      
      {isLiveDetection && (
        <div className="live-indicator">
          🔴 LIVE DETECTION
        </div>
      )}
    </div>
  </div>
  
  <div className="webcam-controls">
    {!isWebcamActive ? (
      <button 
        onClick={startWebcamAndDetection} 
        className="live-button"
      >
        🎥 Start Live Detection
      </button>
    ) : (
      <button 
        onClick={stopWebcamAndDetection} 
        className="stop-button"
      >
        ⏹️ Stop Webcam
      </button>
    )}
  </div>
</div>

)}

      {error && <div className="error">{error}</div>}

      {detectionResults && (
        <div className="results-section">
          <h2>Live Detection</h2>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionView;
