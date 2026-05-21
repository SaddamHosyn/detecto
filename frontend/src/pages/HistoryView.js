import React, { useState, useEffect } from 'react';
import { getHistory, resetHistory } from '../services/api';

const HistoryView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHistory();
      setHistory((response.history || []).reverse());
    } catch (err) {
      setError('Failed to load history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('⚠️ Are you sure you want to clear all detection history? This action cannot be undone.')) {
      try {
        await resetHistory();
        setHistory([]);
      } catch (err) {
        setError('Failed to reset history');
        console.error(err);
      }
    }
  };

  const exportToCSV = () => {
    if (history.length === 0) {
      alert('❌ No data to export');
      return;
    }

    const headers = ['Timestamp', 'Filename', 'Source', 'People Count', 'Avg Confidence', 'Inference Time (s)'];
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map(record => [
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

  // Filter history
// Filter history
const filteredHistory = history.filter(record => {
  const dateMatch = filterDate
    ? new Date(record.timestamp).toLocaleDateString() === new Date(filterDate).toLocaleDateString()
    : true;
  
  let statusMatch = true;
  if (filterStatus === 'triggered') {
    statusMatch = record.person_count > 2; // Changed from 5 to 2
  } else if (filterStatus === 'ok') {
    statusMatch = record.person_count <= 2; // Changed from 5 to 2
  }
  
  return dateMatch && statusMatch;
});


  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredHistory.slice(startIndex, endIndex);

  // Calculate statistics
  const totalDetections = filteredHistory.length;
  const totalPeople = filteredHistory.reduce((sum, r) => sum + r.person_count, 0);
  const avgConfidence = filteredHistory.length > 0
    ? (filteredHistory.reduce((sum, r) => sum + r.average_confidence, 0) / filteredHistory.length * 100)
    : 0;
  const liveDetections = filteredHistory.filter(r => r.source === 'live_webcam').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 text-lg">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Page Title */}
      <div className="flex flex-col items-center justify-center gap-3 p-4 mt-12 mb-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700">
          <span className="material-symbols-outlined !text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
            history
          </span>
        </div>
        <h1 className="text-white text-4xl font-bold leading-tight tracking-[-0.033em]">
          Detection History
        </h1>
        <p className="text-slate-400 text-base font-normal leading-normal">
          Track and analyze all your detections
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mb-8">
        <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <span className="material-symbols-outlined !text-3xl">visibility</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">TOTAL DETECTIONS</p>
            <p className="text-2xl font-bold text-white">{totalDetections}</p>
            <p className="text-xs text-slate-400">{liveDetections} live sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <span className="material-symbols-outlined !text-3xl">group</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">PEOPLE DETECTED</p>
            <p className="text-2xl font-bold text-white">{totalPeople}</p>
            <p className="text-xs text-slate-400">Across all sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
            <span className="material-symbols-outlined !text-3xl">verified</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">AVG CONFIDENCE</p>
            <p className="text-2xl font-bold text-white">{avgConfidence.toFixed(1)}%</p>
            <p className="text-xs text-slate-400">Overall accuracy</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400">
            <span className="material-symbols-outlined !text-3xl">videocam</span>
          </div>
          <div>
            <p className="text-sm text-slate-400">LIVE SESSIONS</p>
            <p className="text-2xl font-bold text-white">{liveDetections}</p>
            <p className="text-xs text-slate-400">Webcam detections</p>
          </div>
        </div>
      </div>

{/* Filters & Actions */}
<div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4 px-4 py-3 mb-6">
  <div className="flex items-center gap-4">
    <div className="relative">
      <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        className="h-10 w-full sm:w-auto rounded-lg border border-slate-700 bg-slate-800 pl-4 pr-10 text-sm text-slate-300 focus:ring-green-500 focus:border-green-500"
        placeholder="Filter by date..."
      />
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        calendar_today
      </span>
    </div>

    <div className="relative">
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="appearance-none h-10 w-full sm:w-auto rounded-lg border border-slate-700 bg-slate-800 pl-4 pr-10 text-sm text-slate-300 focus:ring-green-500 focus:border-green-500"
      >
        <option value="all">All Status</option>
        <option value="triggered">Triggered</option>
        <option value="ok">OK</option>
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        expand_more
      </span>
    </div>
  </div>

  <div className="flex flex-wrap gap-3">
    <button
      onClick={handleReset}
      disabled={history.length === 0}
      className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-red-600 hover:bg-red-700 text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="material-symbols-outlined">delete_forever</span>
      <span>Clear All</span>
    </button>
    
    <button
      onClick={exportToCSV}
      disabled={history.length === 0}
      className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-green-600 hover:bg-green-700 text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="material-symbols-outlined">download</span>
      <span>Export CSV</span>
    </button>
  </div>
</div>



      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mx-4 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* History Table */}
      {currentItems.length === 0 ? (
        <div className="mx-4 rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">folder_open</span>
          <h3 className="text-white text-xl font-bold mb-2">No Detection Records Found</h3>
          <p className="text-slate-400">
            {filterDate || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Start detecting people to see your history here!'}
          </p>
        </div>
      ) : (
        <>
          <div className="px-4 py-3">
            <div className="flex overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50">
              <table className="w-full">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-400 w-[35%] text-sm font-medium leading-normal">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-slate-400 w-[25%] text-sm font-medium leading-normal">
                      Humans Detected
                    </th>
                    <th className="px-4 py-3 text-left text-slate-400 w-[20%] text-sm font-medium leading-normal">
                      Alert Status
                    </th>
                    <th className="px-4 py-3 text-left text-slate-400 w-[20%] text-sm font-medium leading-normal">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
               {currentItems.map((record, index) => {
  const isTriggered = record.person_count > 2; // Changed from 5 to 2
  return (
    <tr key={index} className="border-t border-slate-700 hover:bg-slate-700/30">
      <td className="h-[72px] px-4 py-2 text-white text-sm font-normal leading-normal">
        {new Date(record.timestamp).toLocaleString()}
      </td>
      <td className="h-[72px] px-4 py-2 text-white text-sm font-normal leading-normal">
        {record.person_count}
      </td>
      <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isTriggered ? 'bg-red-500' : 'bg-green-500'}`}></span>
          <span className={`text-sm font-medium ${isTriggered ? 'text-red-400' : 'text-green-400'}`}>
            {isTriggered ? 'Triggered' : 'OK'}
          </span>
        </div>
      </td>
      <td className="h-[72px] px-4 py-2 text-green-400 font-bold tracking-[0.015em] text-sm hover:underline cursor-pointer">
        View Snapshot
      </td>
    </tr>
  );
})}

                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 mt-4">
            <p className="text-sm text-slate-400">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-lg text-sm font-bold transition-colors ${
                    currentPage === i + 1
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryView;
