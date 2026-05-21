import React from 'react';

const Logo = () => {
  return (
    <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#13ec5b" opacity="0.2"/>
      <circle cx="50" cy="50" r="35" fill="#13ec5b" opacity="0.4"/>
      <circle cx="50" cy="50" r="25" fill="#13ec5b"/>
      <circle cx="40" cy="45" r="8" fill="#0D1310"/>
      <circle cx="60" cy="45" r="8" fill="#0D1310"/>
      <path d="M 35 65 Q 50 75 65 65" stroke="#0D1310" strokeWidth="4" strokeLinecap="round" fill="none"/>
    </svg>
  );
};

export default Logo;
