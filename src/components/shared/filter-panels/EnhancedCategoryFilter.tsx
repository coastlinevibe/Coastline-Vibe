'use client';

import React, { useState, useEffect } from 'react';
import { FilterPanelProps } from '../FilterSidebar';
import { Check, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  danangCategories, 
  Category, 
  Subcategory, 
  getCategoryById, 
  getSubcategoriesByCategoryId 
} from '@/data/danang-categories';

interface CategoryFilterValue {
  categoryId?: string;
  subcategoryId?: string;
}

export default function EnhancedCategoryFilter({ 
  filterKey, 
  value = {}, 
  onChange 
}: FilterPanelProps) {
  const { t, language } = useTranslation();
  const initialValue = value as CategoryFilterValue;
  
  // State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialValue.categoryId || '');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>(initialValue.subcategoryId || '');
  const [viewMode, setViewMode] = useState<'categories' | 'subcategories'>('categories');
  const [popularCategories, setPopularCategories] = useState<Category[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);
  
  // Initialize popular categories
  useEffect(() => {
    setPopularCategories(danangCategories.slice(0, 5));
  }, []);
  
  // Update available subcategories when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const category = getCategoryById(selectedCategoryId);
      if (category) {
        setAvailableSubcategories(category.subcategories);
        setViewMode('subcategories');
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [selectedCategoryId]);
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId('');
  };
  
  // Handle subcategory selection
  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId);
  };
  
  // Apply filters
  const handleSubmit = () => {
    const result: CategoryFilterValue = {};
    
    if (selectedCategoryId) {
      result.categoryId = selectedCategoryId;
    }
    
    if (selectedSubcategoryId) {
      result.subcategoryId = selectedSubcategoryId;
    }
    
    onChange(result);
  };
  
  // Get localized name
  const getLocalizedName = (item: { name: { en: string; vi: string } }) => {
    return language === 'vi' ? item.name.vi : item.name.en;
  };
  
  return (
    <div className="space-y-3">
      {/* View Mode Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          className={`flex-1 py-2 px-1 text-xs font-medium ${
            viewMode === 'categories'
              ? 'text-primaryTeal border-b-2 border-primaryTeal'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setViewMode('categories')}
        >
          {t('directory.categories', 'Categories')}
        </button>
        <button
          type="button"
          disabled={!selectedCategoryId}
          className={`flex-1 py-2 px-1 text-xs font-medium ${
            viewMode === 'subcategories'
              ? 'text-primaryTeal border-b-2 border-primaryTeal'
              : selectedCategoryId 
                ? 'text-gray-500 hover:text-gray-700' 
                : 'text-gray-300 cursor-not-allowed'
          }`}
          onClick={() => {
            if (selectedCategoryId) setViewMode('subcategories');
          }}
        >
          {t('directory.subcategories', 'Subcategories')}
        </button>
      </div>
      
      {/* Categories View */}
      {viewMode === 'categories' && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          <div 
            key="all-categories"
            className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md cursor-pointer ${
              !selectedCategoryId 
                ? 'bg-primaryTeal/10 text-primaryTeal font-medium' 
                : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleCategorySelect('')}
          >
            <span>{t('common.all', 'All')}</span>
            {!selectedCategoryId && (
              <Check size={16} className="text-primaryTeal" />
            )}
          </div>
          
          {danangCategories.map(category => (
            <div 
              key={category.id}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md cursor-pointer ${
                selectedCategoryId === category.id 
                  ? 'bg-primaryTeal/10 text-primaryTeal font-medium' 
                  : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => handleCategorySelect(category.id)}
            >
              <div className="flex items-center">
                <span>{getLocalizedName(category)}</span>
                <span className="ml-1.5 text-xs text-gray-500">({category.subcategories.length})</span>
              </div>
              {selectedCategoryId === category.id ? (
                <Check size={16} className="text-primaryTeal" />
              ) : (
                <ChevronRight size={16} className="text-gray-400" />
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Subcategories View */}
      {viewMode === 'subcategories' && selectedCategoryId && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          <div className="mb-2">
            <button
              type="button"
              onClick={() => setViewMode('categories')}
              className="flex items-center text-xs text-gray-500 hover:text-primaryTeal"
            >
              <ChevronRight size={14} className="rotate-180 mr-1" />
              {t('common.back', 'Back')}
            </button>
          </div>
          
          <div 
            key="all-subcategories"
            className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md cursor-pointer ${
              selectedCategoryId && !selectedSubcategoryId 
                ? 'bg-primaryTeal/10 text-primaryTeal font-medium' 
                : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => handleSubcategorySelect('')}
          >
            <span>{t('common.all', 'All')} {getCategoryById(selectedCategoryId)?.name[language === 'vi' ? 'vi' : 'en']}</span>
            {selectedCategoryId && !selectedSubcategoryId && (
              <Check size={16} className="text-primaryTeal" />
            )}
          </div>
          
          {availableSubcategories.map(subcategory => (
            <div 
              key={subcategory.id}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md cursor-pointer ${
                selectedSubcategoryId === subcategory.id 
                  ? 'bg-primaryTeal/10 text-primaryTeal font-medium' 
                  : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => handleSubcategorySelect(subcategory.id)}
            >
              <span>{getLocalizedName(subcategory)}</span>
              {selectedSubcategoryId === subcategory.id && (
                <Check size={16} className="text-primaryTeal" />
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Popular Categories */}
      {viewMode === 'categories' && popularCategories.length > 0 && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            {t('landing.popularCategories', 'Popular Categories')}
          </label>
          <div className="flex flex-wrap gap-2">
            {popularCategories.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategorySelect(category.id)}
                className={`px-2 py-1 text-xs rounded-full ${
                  selectedCategoryId === category.id
                    ? 'bg-primaryTeal text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getLocalizedName(category)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Apply Button */}
      <div className="pt-2 flex items-center justify-between space-x-2">
        <button
          type="button"
          onClick={() => {
            setSelectedCategoryId('');
            setSelectedSubcategoryId('');
            setViewMode('categories');
            onChange({});
          }}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
        >
          {t('common.clear', 'Clear')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-primaryTeal text-white text-sm font-medium rounded-md hover:bg-seafoam transition-colors"
        >
          {t('common.apply', 'Apply')}
        </button>
      </div>
    </div>
  );
} 