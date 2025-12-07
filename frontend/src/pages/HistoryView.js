import React, { useState, useEffect } from 'react';
import { getHistory, resetHistory } from '../services/api';
import './HistoryView.css';

const HistoryView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHistory();
       // Reverse the array so newest entries appear first
      setHistory((response.history || []).reverse());
    } catch (err) {
      setError('Failed to load history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to clear all detection history?')) {
      try {
        await resetHistory();
        setHistory([]);
        alert('History cleared successfully!');
      } catch (err) {
        setError('Failed to reset history');
        console.error(err);
      }
    }
  };

  const exportToCSV = () => {
    if (history.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Timestamp', 'Filename', 'Source', 'People Count', 'Avg Confidence', 'Inference Time (s)'];
    const csvContent = [
      headers.join(','),
      ...history.map(record => [
        new Date(record.timestamp).toLocaleString(),
        record.filename,
        record.source || 'upload',
        record.person_count,
        record.average_confidence.toFixed(4),
        record.inference_time.toFixed(3)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detection_history_${Date.now()}.csv`;
    a.click();
  };

  const filteredHistory = filterDate
    ? history.filter(record => 
        new Date(record.timestamp).toLocaleDateString() === new Date(filterDate).toLocaleDateString()
      )
    : history;

  if (loading) {
    return <div className="container"><h2>Loading history...</h2></div>;
  }

  return (
    <div className="container">
      <h1 className="title">Detection History</h1>

      <div className="controls">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="date-filter"
        />
        <button onClick={() => setFilterDate('')} className="clear-filter-btn">
          Clear Filter
        </button>
        <button onClick={exportToCSV} className="export-btn">
          Export to CSV
        </button>
        <button onClick={handleReset} className="reset-btn">
          Clear History
        </button>
        <button onClick={fetchHistory} className="refresh-btn">
          Refresh
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {filteredHistory.length === 0 ? (
        <div className="no-data">
          <p>No detection records found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>Filename</th>
                <th>People Count</th>
                <th>Avg Confidence</th>
                <th>Inference Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((record, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{new Date(record.timestamp).toLocaleString()}</td>
                  <td>
                    {record.filename}
                    {record.source === 'live_webcam' && (
                      <span style={{
                        marginLeft: '10px',
                        padding: '2px 8px',
                        background: '#ff4444',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        🔴 LIVE
                      </span>
                    )}
                  </td>
                  <td>{record.person_count}</td>
                  <td>{(record.average_confidence * 100).toFixed(1)}%</td>
                  <td>{record.inference_time.toFixed(3)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="summary">
        <h3>Summary Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{filteredHistory.length}</div>
            <div className="stat-label">Total Detections</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {filteredHistory.reduce((sum, r) => sum + r.person_count, 0)}
            </div>
            <div className="stat-label">Total People Detected</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {filteredHistory.length > 0
                ? (filteredHistory.reduce((sum, r) => sum + r.average_confidence, 0) / filteredHistory.length * 100).toFixed(1)
                : 0}%
            </div>
            <div className="stat-label">Overall Avg Confidence</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
