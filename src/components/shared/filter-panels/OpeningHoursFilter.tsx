'use client';

import React, { useState, useEffect } from 'react';
import { FilterPanelProps } from '../FilterSidebar';

type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface OpeningHoursValue {
  openNow?: boolean;
  days?: Day[];
  timeRange?: {
    start: string;
    end: string;
  };
}

const daysOfWeek: { value: Day; label: string; short: string }[] = [
  { value: 'monday', label: 'Monday', short: 'M' },
  { value: 'tuesday', label: 'Tuesday', short: 'T' },
  { value: 'wednesday', label: 'Wednesday', short: 'W' },
  { value: 'thursday', label: 'Thursday', short: 'T' },
  { value: 'friday', label: 'Friday', short: 'F' },
  { value: 'saturday', label: 'Saturday', short: 'S' },
  { value: 'sunday', label: 'Sunday', short: 'S' },
];

export default function OpeningHoursFilter({ 
  filterKey, 
  value = {}, 
  onChange 
}: FilterPanelProps) {
  const initialValue = value as OpeningHoursValue;
  
  const [openNow, setOpenNow] = useState<boolean>(initialValue.openNow || false);
  const [selectedDays, setSelectedDays] = useState<Day[]>(initialValue.days || []);
  const [timeRange, setTimeRange] = useState<{start: string; end: string}>(
    initialValue.timeRange || { start: '09:00', end: '17:00' }
  );
  const [advancedMode, setAdvancedMode] = useState<boolean>(
    !!(initialValue.days?.length || initialValue.timeRange)
  );

  // Get current day and time for "Open Now" logic
  const getCurrentDayAndTime = () => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    return {
      day: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day] as Day,
      time: `${hours}:${minutes}`
    };
  };

  // Toggle day selection
  const toggleDay = (day: Day) => {
    setSelectedDays(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // Handle time range change
  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    setTimeRange(prev => ({ ...prev, [type]: value }));
  };

  // Apply filters
  const handleSubmit = () => {
    const result: OpeningHoursValue = {};
    
    if (openNow) {
      result.openNow = true;
    }
    
    if (advancedMode) {
      if (selectedDays.length > 0) {
        result.days = selectedDays;
      }
      
      if (timeRange.start !== '09:00' || timeRange.end !== '17:00') {
        result.timeRange = timeRange;
      }
    }
    
    onChange(result);
  };

  return (
    <div className="space-y-4">
      {/* Open Now Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Open Now</span>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={openNow}
            onChange={() => setOpenNow(!openNow)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primaryTeal transition-all duration-300 relative">
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-300 ${openNow ? 'translate-x-5' : ''}`}></div>
          </div>
        </label>
      </div>

      {/* Advanced Mode Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Advanced Filters</span>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={advancedMode}
            onChange={() => setAdvancedMode(!advancedMode)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primaryTeal transition-all duration-300 relative">
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-300 ${advancedMode ? 'translate-x-5' : ''}`}></div>
          </div>
        </label>
      </div>

      {/* Advanced Filters */}
      {advancedMode && (
        <div className="space-y-4 pt-2 border-t border-gray-200">
          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Days Open</label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                    selectedDays.includes(day.value)
                      ? 'bg-primaryTeal text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={day.label}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <div className="flex items-center space-x-2">
              <input
                type="time"
                value={timeRange.start}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                value={timeRange.end}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Apply Button */}
      <div className="pt-2 flex items-center justify-between space-x-2">
        <button
          type="button"
          onClick={() => {
            setOpenNow(false);
            setSelectedDays([]);
            setTimeRange({ start: '09:00', end: '17:00' });
            onChange({});
          }}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-primaryTeal text-white text-sm font-medium rounded-md hover:bg-seafoam transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
} 