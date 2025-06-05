import React from 'react';

export default function PostLeaseIcon({ className = '', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Blue rounded rectangle */}
      <rect x="2" y="2" width="60" height="28" rx="14" fill="#2563eb" />
      {/* POST text with subtle shadow */}
      <text
        x="32"
        y="19"
        textAnchor="middle"
        fontFamily="inherit"
        fontWeight="bold"
        fontSize="16"
        fill="#fff"
        filter="url(#shadow)"
        dominantBaseline="middle"
        style={{ textShadow: '1px 1px 4px #1e3a8a' }}
      >
        Post
      </text>
      <defs>
        <filter id="shadow" x="0" y="0" width="100%" height="100%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="#1e3a8a" />
        </filter>
      </defs>
    </svg>
  );
} 