import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  // Function to truncate text for small screens if needed
  const truncateLabel = (label: string, maxLength: number = 20) => {
    if (label.length <= maxLength) return label;
    return `${label.substring(0, maxLength)}...`;
  };

  return (
    <nav className={`flex items-center mb-6 ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex flex-wrap items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <li 
            key={`${item.label}-${index}`} 
            className={`inline-flex items-center ${index > 0 ? 'ml-1' : ''}`}
            {...(index === items.length - 1 ? { 'aria-current': 'page' } : {})}
          >
            {index > 0 && (
              <svg 
                className="w-2 h-2 sm:w-3 sm:h-3 text-gray-400 mx-1" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                  clipRule="evenodd"
                />
              </svg>
            )}
            
            {item.href && index !== items.length - 1 ? (
              <Link 
                href={item.href}
                className="inline-flex items-center text-primaryTeal hover:text-seafoam transition-colors"
              >
                {index === 0 && (
                  <svg className="w-3 h-3 mr-1 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                )}
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{truncateLabel(item.label, 15)}</span>
              </Link>
            ) : (
              <span className={`${index === items.length - 1 ? 'text-gray-500 font-medium' : 'text-primaryTeal'}`}>
                {index === 0 && !item.href && (
                  <svg className="w-3 h-3 mr-1 sm:mr-2 inline flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                )}
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{truncateLabel(item.label, 15)}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 