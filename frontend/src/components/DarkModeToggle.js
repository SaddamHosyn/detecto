import React from 'react';
import './DarkModeToggle.css';

const DarkModeToggle = ({ isDark, toggle }) => {
  return (
    <button className="dark-mode-toggle" onClick={toggle} aria-label="Toggle dark mode">
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

export default DarkModeToggle;
