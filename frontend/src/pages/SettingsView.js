import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/api';

const SettingsView = () => {
  const [confidenceThreshold, setConfidenceThreshold] = useState(35);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setConfidenceThreshold(Math.round(settings.confidence_threshold * 100));
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const settings = {
        confidence_threshold: confidenceThreshold / 100,
      };

      await updateSettings(settings);
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      console.log('✅ Settings saved:', settings);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Page Title */}
      <div className="flex flex-wrap justify-between gap-3 mb-8">
        <div className="flex min-w-72 flex-col gap-2">
          <p className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            Application Settings
          </p>
          <p className="text-[#9db9a6] text-base font-normal leading-normal">
            Manage your detection preferences.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="flex flex-col gap-8">
        
        {/* Detection Settings - FUNCTIONAL */}
        <div className="w-full border border-white/10 rounded-xl overflow-hidden bg-surface">
          <div className="px-6 py-4 bg-white/5">
            <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">
              Detection Settings
            </h2>
          </div>
          <div className="p-6">
            <div className="relative flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex w-full flex-col gap-1.5 shrink-[3]">
                <label className="text-white text-base font-medium leading-normal">
                  Detection Confidence Threshold
                </label>
                <p className="text-white/60 text-sm">
                  Confidence level required to detect a person. {confidenceThreshold}% currently set.
                </p>
              </div>
              <div className="flex h-4 w-full max-w-sm items-center gap-4">
                <div className="flex h-1.5 flex-1 rounded-full bg-[#3b5443] relative">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-200" 
                    style={{ width: `${confidenceThreshold}%` }}
                  ></div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div 
                    className="absolute -top-2 size-5 rounded-full bg-primary border-2 border-background-dark ring-2 ring-primary cursor-pointer transition-all duration-200"
                    style={{ left: `calc(${confidenceThreshold}% - 10px)` }}
                  ></div>
                </div>
                <p className="text-white text-sm font-medium leading-normal w-12 text-right">
                  {confidenceThreshold}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications - DISPLAY ONLY (dummy for n8n) */}
        <div className="w-full border border-white/10 rounded-xl overflow-hidden bg-surface">
          <div className="px-6 py-4 bg-white/5">
            <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">
              Alerts &amp; Notifications
            </h2>
          </div>
          <div className="divide-y divide-white/10">
            
            <div className="flex items-center justify-between p-6 opacity-60 cursor-not-allowed">
              <div className="flex flex-col">
                <label className="text-white font-medium">
                  Enable Sound Alerts
                </label>
                <p className="text-sm text-white/60">
                  Play a sound when a human is detected. (Managed by n8n)
                </p>
              </div>
              <div className="relative inline-flex items-center pointer-events-none">
                <div className="h-6 w-11 rounded-full bg-primary-dark after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-600 after:bg-white after:transition-all after:translate-x-full"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 opacity-60 cursor-not-allowed">
              <div className="flex flex-col">
                <label className="text-white font-medium">
                  Enable Discord Alerts
                </label>
                <p className="text-sm text-white/60">
                  Send a message to a Discord channel. (Managed by n8n)
                </p>
              </div>
              <div className="relative inline-flex items-center pointer-events-none">
                <div className="h-6 w-11 rounded-full bg-primary-dark after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-600 after:bg-white after:transition-all after:translate-x-full"></div>
              </div>
            </div>

            <div className="p-6 opacity-60">
              <label className="block text-sm font-medium leading-6 text-white">
                Discord Webhook URL (Read-only)
              </label>
              <div className="mt-2 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  link
                </span>
                <input
                  value="https://saddamhosyn.app.n8n.cloud/webhook-test/human-check-v2"
                  readOnly
                  disabled
                  className="block w-full rounded-lg border-0 py-2.5 pl-10 bg-background-dark text-gray-500 ring-1 ring-inset ring-white/20 cursor-not-allowed sm:text-sm sm:leading-6"
                  type="text"
                />
              </div>
              <p className="text-xs text-white/40 mt-2">
                ℹ️ This webhook is managed directly in my n8n workflow
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-6 bg-primary text-[#111813] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
        >
          <span className="truncate">Save Settings</span>
        </button>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="flex items-center w-full max-w-xs p-4 text-gray-200 bg-surface rounded-lg shadow border border-white/10 fixed bottom-5 right-5 animate-slide-in-right z-50">
          <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-200 bg-green-800 rounded-lg">
            <span className="material-symbols-outlined text-xl">check</span>
          </div>
          <div className="ms-3 text-sm font-normal">Settings saved successfully.</div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
