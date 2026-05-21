import React, { useState } from 'react';
import DetectionView from './pages/DetectionView';
import HistoryView from './pages/HistoryView';
import SettingsView from './pages/SettingsView';
import Logo from './components/Logo';

function App() {
  const [currentPage, setCurrentPage] = useState('detection');

  return (
    <div className="dark min-h-screen bg-background-dark font-display text-slate-200">
      <div className="flex min-h-screen w-full">
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Logo />
                <h1 className="text-white text-xl font-bold">Vision AI</h1>
              </div>
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage('detection')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    currentPage === 'detection'
                      ? 'bg-card-dark border border-border-dark text-primary-accent'
                      : 'hover:bg-card-dark text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">sensors</span>
                  Detection
                </button>
                <button
                  onClick={() => setCurrentPage('history')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    currentPage === 'history'
                      ? 'bg-card-dark border border-border-dark text-primary-accent'
                      : 'hover:bg-card-dark text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">history</span>
                  History
                </button>
                <button
                  onClick={() => setCurrentPage('settings')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    currentPage === 'settings'
                      ? 'bg-card-dark border border-border-dark text-primary-accent'
                      : 'hover:bg-card-dark text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">settings</span>
                  Settings
                </button>
              </nav>
            </header>

            {/* Page Content */}
            {currentPage === 'detection' && <DetectionView />}
            {currentPage === 'history' && <HistoryView />}
            {currentPage === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
