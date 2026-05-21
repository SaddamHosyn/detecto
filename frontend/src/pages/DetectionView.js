import React, { useState, useRef, useEffect } from 'react';
import { detectPeople } from '../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

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
  const [isThresholdExceeded, setIsThresholdExceeded] = useState(false);

  const [detectionHistory, setDetectionHistory] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  
  const wsRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const imgRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const threshold = 2;

  // Chart data
const chartData = {
  labels: detectionHistory.length > 0 
    ? detectionHistory.slice(-8).map(d => {
        const date = new Date(d.timestamp);
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      })
    : ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
  datasets: [
    {
      label: 'Human Count',
      data: detectionHistory.length > 0 
        ? detectionHistory.slice(-8).map(d => d.count) 
        : [2, 3, 2, 5, 7, 4, 3, 5],
      fill: true,
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return null;
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, 'rgba(74, 222, 128, 0)');
        gradient.addColorStop(1, 'rgba(74, 222, 128, 0.3)');
        return gradient;
      },
      borderColor: '#4ade80',
      pointBackgroundColor: '#4ade80',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#4ade80',
      tension: 0.4,
      borderWidth: 2,
    },
  ],
};


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: 'rgba(46, 57, 53, 0.5)',
        },
        ticks: {
          padding: 10,
          color: 'rgba(148, 163, 184, 0.7)',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          padding: 10,
          color: 'rgba(148, 163, 184, 0.7)',
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#1C2421',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        padding: 12,
        cornerRadius: 6,
        boxPadding: 4,
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  // Add alert to recent alerts
  const addAlert = (type, message) => {
    const newAlert = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleString(),
    };
    setRecentAlerts(prev => [newAlert, ...prev].slice(0, 3));
  };

  // Auto-start detection when video is ready
   useEffect(() => {
    if (isVideoReady && isWebcamActive && !isLiveDetection) {
      console.log('🎬 Auto-starting live detection...');
     startLiveDetection();
    }
  }, [isVideoReady, isWebcamActive]);

  // Start webcam and live detection
// Start webcam and live detection
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
    console.log('Stream tracks:', mediaStream.getTracks());
    
    setStream(mediaStream);
    setIsWebcamActive(true);
    
    // Wait for next render cycle
    setTimeout(() => {
      if (videoRef.current) {
        console.log('🎬 Setting video srcObject...');
        videoRef.current.srcObject = mediaStream;
        
        // Force play
        videoRef.current.play()
          .then(() => {
            console.log('✅ Video playing');
            console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            setIsVideoReady(true);
          })
          .catch(err => {
            console.error('❌ Video play error:', err);
            // Try again
            setTimeout(() => {
              videoRef.current.play().catch(e => console.error('Retry failed:', e));
            }, 500);
          });
      } else {
        console.error('❌ videoRef.current is null!');
      }
    }, 100);
    
  } catch (err) {
    setError('Unable to access webcam. Please grant camera permissions.');
    console.error('❌ Webcam error:', err);
  }
};

  // Stop everything
  const stopWebcamAndDetection = () => {
    console.log('🛑 Stopping webcam and detection...');
    
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
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
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    console.log('📹 Video ready:', width, 'x', height);
    
    if (width > 0 && height > 0) {
      setIsVideoReady(true);
    } else {
      console.warn('⚠️ Video dimensions are 0, waiting...');
    }
  }
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
    n8n_action: data.n8n_action || null,
    inference_time_seconds: 0
  });

  // Add to history
  setDetectionHistory(prev => [...prev, {
    count: data.person_count,
    timestamp: new Date(),
  }].slice(-50));

  // Check threshold and trigger animation
  if (data.person_count > threshold) {
    setIsThresholdExceeded(true);
    addAlert('warning', 'Threshold Exceeded');
    
    // Reset after 2 seconds
    setTimeout(() => {
      setIsThresholdExceeded(false);
    }, 2000);
  } else {
    setIsThresholdExceeded(false);
  }

  if (data.n8n_action === 'loud_noise') {
    addAlert('campaign', 'Discord Alert Sent');
    addAlert('volume_up', 'Sound Alert Triggered');
  }
  
  drawBoundingBoxes(data.detections);
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

  // Draw bounding boxes
  const drawBoundingBoxes = (detections) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const scaleX = video.clientWidth / video.videoWidth;
    const scaleY = video.clientHeight / video.videoHeight;
    
    detections.forEach((detection) => {
      const x = detection.bbox.x1 * scaleX;
      const y = detection.bbox.y1 * scaleY;
      const w = (detection.bbox.x2 - detection.bbox.x1) * scaleX;
      const h = (detection.bbox.y2 - detection.bbox.y1) * scaleY;
      
      ctx.strokeStyle = '#13ec5b';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      
      const label = `Person ${(detection.confidence * 100).toFixed(1)}%`;
      ctx.font = 'bold 14px Inter';
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillStyle = '#13ec5b';
      ctx.fillRect(x, y - 25, textWidth + 10, 20);
      
      ctx.fillStyle = '#0D1310';
      ctx.fillText(label, x + 5, y - 10);
    });
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopWebcamAndDetection();
    };
  }, []);

  // Upload mode handlers
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setDetectionResults(null);
      setError(null);
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
    
    // Add to history
    setDetectionHistory(prev => [...prev, {
      count: results.person_count,
      timestamp: new Date(),
    }].slice(-50));

    // Check threshold and trigger animation
    if (results.person_count > threshold) {
      setIsThresholdExceeded(true);
      addAlert('warning', 'Threshold Exceeded');
      
      setTimeout(() => {
        setIsThresholdExceeded(false);
      }, 2000);
    } else {
      setIsThresholdExceeded(false);
    }
  } catch (err) {
    setError(err.detail || 'Error detecting people');
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  const getAlertIcon = (type) => {
    switch(type) {
      case 'warning': return { icon: 'warning', color: 'red' };
      case 'campaign': return { icon: 'campaign', color: 'blue' };
      case 'volume_up': return { icon: 'volume_up', color: 'yellow' };
      default: return { icon: 'info', color: 'blue' };
    }
  };

  return (
    <div>
      {/* Page Title */}
      <div className="text-center mb-8">
        <h2 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
          Human Signature Scanner
        </h2>
        <p className="text-slate-400 text-lg mt-2">
          Real-time Human detection powered by YOLOv8m
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Video & Chart */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Video Display */}
{/* Video Display */}
{/* Video Display */}



<div className={`relative rounded-xl overflow-hidden aspect-video transition-all duration-300 ${
  isThresholdExceeded 
    ? 'border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] bg-red-900/20' 
    : 'border border-border-dark bg-black'
}`}>














  {mode === 'webcam' && isWebcamActive ? (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedData={(e) => {
          console.log('📹 onLoadedData fired');
          console.log('Video dimensions:', e.target.videoWidth, 'x', e.target.videoHeight);
          handleVideoReady();
        }}
        onLoadedMetadata={(e) => {
          console.log('📹 onLoadedMetadata fired');
          handleVideoReady();
        }}
        onCanPlay={(e) => {
          console.log('📹 onCanPlay fired');
          handleVideoReady();
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          backgroundColor: 'black'
        }}
      />
      <canvas
        ref={overlayCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {isLiveDetection && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          LIVE
        </div>
      )}
    </>
  ) : imagePreview && mode === 'upload' ? (
    <div className="relative w-full h-full">
      <img
        ref={imgRef}
        src={imagePreview}
        alt="Preview"
        className="absolute inset-0 w-full h-full object-contain"
      />
      {detectionResults && detectionResults.detections.map((detection, index) => {
        if (!imgRef.current) return null;
        const scaleX = imgRef.current.naturalWidth / imgRef.current.clientWidth;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.clientHeight;
        
        return (
          <div
            key={index}
            className="absolute border-2 border-primary rounded"
            style={{
              left: `${detection.bbox.x1 / scaleX}px`,
              top: `${detection.bbox.y1 / scaleY}px`,
              width: `${(detection.bbox.x2 - detection.bbox.x1) / scaleX}px`,
              height: `${(detection.bbox.y2 - detection.bbox.y1) / scaleY}px`,
            }}
          >
            <span className="absolute -top-6 left-0 bg-primary text-background-dark px-2 py-0.5 rounded text-xs font-bold">
              {(detection.confidence * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  ) : (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center text-slate-500">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
          {mode === 'webcam' ? 'videocam' : 'image'}
        </span>
        <p className="text-lg">
          {mode === 'webcam' ? 'Click Start to begin live detection' : 'Upload an image to detect people'}
        </p>
      </div>
    </div>
  )}
</div>


          {/* Upload Controls */}
          {mode === 'upload' && (
            <div className="flex gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 h-12 px-6 bg-card-dark hover:bg-border-dark transition-colors text-white text-base font-bold rounded-lg border border-border-dark"
              >
                <span className="material-symbols-outlined">upload_file</span>
                <span>Choose Image</span>
              </button>
              <button
                onClick={handleDetect}
                disabled={!selectedImage || loading}
                className="flex-1 flex items-center justify-center gap-2 h-12 px-6 bg-primary hover:bg-green-500 transition-colors text-black text-base font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">search</span>
                <span>{loading ? 'Detecting...' : 'Detect People'}</span>
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Detection Trend Chart */}
     


{/* Detection Trend Chart */}
<div className="rounded-xl border border-border-dark bg-card-dark p-6">
  <h3 className="text-white text-lg font-bold mb-4">Detection Trend</h3>
  <div className="h-64">
    <Line data={chartData} options={chartOptions} />
  </div>
</div>









        </div>

        {/* Right Column - Stats & Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Mode Selector */}
     {/* Mode Selector */}
<div className="grid grid-cols-2 gap-4">
  <button
    onClick={() => {
      setMode('upload');
      stopWebcamAndDetection();
    }}
    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
      mode === 'upload'
        ? 'bg-primary text-black'
        : 'bg-card-dark border border-border-dark text-white hover:bg-border-dark'
    }`}
  >
    <span className="material-symbols-outlined">upload</span>
    Upload
  </button>
  <button
    onClick={() => {
      setMode('webcam');
      setSelectedImage(null);
      setImagePreview(null);
    }}
    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
      mode === 'webcam'
        ? 'bg-primary text-black'
        : 'bg-card-dark border border-border-dark text-white hover:bg-border-dark'
    }`}
  >
    <span className="material-symbols-outlined">videocam</span>
    Webcam
  </button>
</div>


          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 rounded-xl p-4 border border-border-dark bg-card-dark text-center">
              <p className="text-slate-300 text-sm font-medium">Human Count</p>
              <p className="text-primary-accent text-4xl font-bold">
                {detectionResults?.person_count || 0}
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-4 border border-border-dark bg-card-dark text-center">
  <p className="text-slate-300 text-sm font-medium">Threshold</p>
  <p className="text-white text-4xl font-bold">&gt; 2</p>
</div>

          </div>

          {/* Alert Status */}
          <div className={`flex flex-col gap-2 rounded-xl p-4 text-center ${
            detectionResults && detectionResults.person_count > threshold
              ? 'border border-red-500/50 bg-red-900/20'
              : 'border border-border-dark bg-card-dark'
          }`}>
            <p className="text-slate-300 text-sm font-medium">Alert Status</p>
            <p className={`text-2xl font-bold ${
              detectionResults && detectionResults.person_count > threshold
                ? 'text-red-400'
                : 'text-green-400'
            }`}>
              {detectionResults && detectionResults.person_count > threshold
                ? 'Threshold Exceeded'
                : 'Normal'}
            </p>
          </div>

          {/* Start/Stop Buttons */}
          {mode === 'webcam' && (
            <div className="flex gap-4">
              {!isWebcamActive ? (
                <button
                  onClick={startWebcamAndDetection}
                  className="flex-1 flex items-center justify-center gap-2 h-12 px-6 bg-primary hover:bg-green-500 transition-colors text-black text-base font-bold rounded-lg"
                >
                  <span className="material-symbols-outlined">play_arrow</span>
                  <span>Start</span>
                </button>
              ) : (
                <button
                  onClick={stopWebcamAndDetection}
                  className="flex-1 flex items-center justify-center gap-2 h-12 px-6 bg-red-600 hover:bg-red-700 transition-colors text-white text-base font-bold rounded-lg"
                >
                  <span className="material-symbols-outlined">stop</span>
                  <span>Stop</span>
                </button>
              )}
            </div>
          )}

          {/* Recent Alerts */}
    
<div className="flex flex-col gap-4 rounded-xl p-6 border border-border-dark bg-card-dark">
  <div className="flex justify-between items-center">
    <h3 className="text-white text-base font-medium">Recent Alerts</h3>
    <button className="text-sm font-medium text-primary-accent hover:underline">
      View All
    </button>
  </div>
  <div className="flex items-center justify-between gap-4 mt-4 bg-slate-800/50 p-1 rounded-lg">
    <button className="flex-1 px-3 py-1.5 text-sm font-semibold text-white bg-slate-700 rounded">
      All
    </button>
    <button className="flex-1 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:bg-slate-700/80 rounded">
      Critical
    </button>
  </div>
  <div className="flex flex-col gap-4 mt-4">
    {recentAlerts.length === 0 ? (
      <p className="text-slate-400 text-sm text-center py-4">No recent alerts</p>
    ) : (
      recentAlerts.map((alert) => {
        const { icon, color } = getAlertIcon(alert.type);
        return (
          <button
            key={alert.id}
            className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors w-full text-left"
          >
            <div className={`flex items-center justify-center size-8 bg-${color}-500/20 rounded-lg`}>
              <span className={`material-symbols-outlined text-${color}-400 text-xl`}>
                {icon}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{alert.message}</p>
              <p className="text-slate-400 text-xs">{alert.timestamp}</p>
            </div>
            <span className="material-symbols-outlined text-slate-500 group-hover:text-slate-300 transition-colors text-xl">
              arrow_forward_ios
            </span>
          </button>
        );
      })
    )}
  </div>
</div>

        </div>
      </div>
    </div>
  );
};

export default DetectionView;
