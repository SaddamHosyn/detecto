import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value, icon, color = 'blue', subtitle }) => {
  return (
    <div className={`stats-card stats-${color}`}>
      <div className="stats-icon-wrapper">
        <div className="stats-icon">{icon}</div>
      </div>
      <div className="stats-content">
        <div className="stats-title">{title}</div>
        <div className="stats-value">{value}</div>
        {subtitle && <div className="stats-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default StatsCard;
