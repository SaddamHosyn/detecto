import React, { useState } from 'react';
import DetectionView from './pages/DetectionView';
import HistoryView from './pages/HistoryView';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('detection');

  return (
    <div className="App">
      <nav className="navbar">
        <button 
          onClick={() => setCurrentPage('detection')}
          className={currentPage === 'detection' ? 'active' : ''}
        >
          Detection
        </button>
        <button 
          onClick={() => setCurrentPage('history')}
          className={currentPage === 'history' ? 'active' : ''}
        >
          History
        </button>
      </nav>

      {currentPage === 'detection' ? <DetectionView /> : <HistoryView />}
    </div>
  );
}

export default App;
