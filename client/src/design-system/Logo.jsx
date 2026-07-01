import React from 'react';

export const Logo = ({
  iconOnly = false,
  variant = 'dark', // 'dark' (dark text for light bg) or 'light' (white text for dark bg)
  size = 32,
  className = '',
  ...props
}) => {
  const textColor = variant === 'light' ? '#FFFFFF' : '#243746';

  const logoIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      style={{ width: size, height: size }}
      className="flex-shrink-0 transition-all duration-300 hover:scale-105"
      {...props}
    >
      <defs>
        <linearGradient id="ws-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0EAF9B" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" fill="url(#ws-logo-grad)" />
      <path
        d="M28,38 L42,65 L50,50 L58,65 L72,38"
        stroke="#FFFFFF"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="50" r="4" fill="#FFFFFF" />
    </svg>
  );

  if (iconOnly) {
    return logoIcon;
  }

  return (
    <div className={`d-flex align-items-center gap-2.5 ${className}`}>
      {logoIcon}
      <span
        className="font-heading fw-bold tracking-tight"
        style={{
          color: textColor,
          fontSize: typeof size === 'number' ? `${size * 0.58}px` : '1.25rem',
          lineHeight: 1,
          letterSpacing: '-0.025em'
        }}
      >
        Work<span style={{ color: 'var(--ws-primary)' }}>Sphere</span>
      </span>
    </div>
  );
};

export default Logo;
