'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps {
  name: string;
  id?: string;
  options: Option[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function FormSelect({
  name,
  id,
  options,
  defaultValue,
  onChange,
  className,
}: FormSelectProps) {
  const [value, setValue] = useState(defaultValue || options[0]?.value || '');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    setIsOpen(false);
    if (onChange) {
      onChange(newValue);
    }
  };
  
  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedLabel = options.find(opt => opt.value === value)?.label || value;

  return (
    <div className={`relative ${className || ''}`} ref={dropdownRef}>
      <input type="hidden" name={name} value={value} />
      
      <button
        type="button"
        id={id}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="block truncate">{selectedLabel}</span>
        <span className="pointer-events-none flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24" 
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1">
            {options.map((option) => (
              <div
                key={option.value}
                className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${value === option.value ? 'bg-accent text-accent-foreground' : ''}`}
                onClick={() => handleChange(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 