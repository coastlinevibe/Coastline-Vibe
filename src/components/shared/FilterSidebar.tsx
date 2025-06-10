'use client';

import React from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

interface FilterPanelProps {
  filterKey: string;
  value: any;
  onChange: (value: any) => void;
}

interface FilterSidebarProps {
  filters: Array<{
    key: string;
    label: string;
    icon: React.ComponentType<any>;
  }>;
  selectedFilters: Record<string, any>;
  openKey: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenKeyChange: (key: string | null) => void;
  onFilterChange: (key: string, value: any) => void;
  onClearAll: () => void;
  children?: React.ReactNode; // For filter panel components
}

export default function FilterSidebar({
  filters,
  selectedFilters,
  openKey,
  collapsed,
  onToggleCollapse,
  onOpenKeyChange,
  onFilterChange,
  onClearAll,
  children
}: FilterSidebarProps) {
  // Create a map of filter panels from children
  const filterPanels = React.Children.toArray(children).reduce((acc, child) => {
    if (
      React.isValidElement(child) && 
      typeof child.props === 'object' && 
      child.props !== null && 
      'filterKey' in child.props && 
      typeof child.props.filterKey === 'string'
    ) {
      return { ...acc, [child.props.filterKey]: child };
    }
    return acc;
  }, {} as Record<string, React.ReactNode>);

  // Count active filters
  const activeFiltersCount = Object.keys(selectedFilters).length;

  return (
    <aside 
      className={`bg-white h-full rounded-lg shadow-md transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        {!collapsed && (
          <h2 className="font-bold text-cyan-900">Filters</h2>
        )}
        <button 
          onClick={onToggleCollapse}
          className="p-1.5 bg-cyan-50 rounded-full text-cyan-600 hover:bg-cyan-100 transition-colors"
          aria-label={collapsed ? "Expand filters" : "Collapse filters"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Filter List */}
      <div className="flex-1 overflow-y-auto">
        <ul className="py-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isOpen = openKey === filter.key;
            const hasValue = filter.key in selectedFilters;
            
            return (
              <li key={filter.key} className="mb-1">
                <button
                  className={`w-full flex items-center ${
                    collapsed ? 'justify-center px-3 py-3' : 'justify-between px-4 py-2'
                  } ${
                    isOpen ? 'bg-cyan-50 text-cyan-700' : hasValue ? 'text-cyan-700' : 'text-gray-600'
                  } hover:bg-cyan-50 hover:text-cyan-700 transition-colors rounded-md`}
                  onClick={() => onOpenKeyChange(isOpen ? null : filter.key)}
                >
                  <div className="flex items-center">
                    <div className={`${hasValue ? 'text-cyan-600' : 'text-gray-400'}`}>
                      <Icon size={collapsed ? 20 : 16} />
                    </div>
                    {!collapsed && (
                      <span className="ml-3 font-medium">{filter.label}</span>
                    )}
                  </div>
                  {!collapsed && (
                    hasValue ? (
                      <span className="flex h-5 w-5 items-center justify-center bg-cyan-100 text-cyan-600 text-xs font-semibold rounded-full">
                        ✓
                      </span>
                    ) : (
                      <ChevronRight
                        size={16}
                        className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
                      />
                    )
                  )}
                </button>

                {/* Filter Panel */}
                {!collapsed && isOpen && (
                  <div className="mt-1 mx-2 p-3 bg-gray-50 rounded-md">
                    {filterPanels[filter.key] || (
                      <div className="text-sm text-gray-500 italic">No filter panel found</div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer with Clear All button */}
      {!collapsed && activeFiltersCount > 0 && (
        <div className="p-3 border-t">
          <button
            onClick={onClearAll}
            className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            <X size={14} />
            <span>Clear All Filters</span>
          </button>
        </div>
      )}
    </aside>
  );
}

// Export the FilterPanelProps interface for use in filter panel components
export type { FilterPanelProps }; 