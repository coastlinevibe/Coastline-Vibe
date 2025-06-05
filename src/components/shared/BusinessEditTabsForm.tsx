import React, { useState } from 'react';
import { Globe, Mail, Phone, Facebook, Twitter, Linkedin } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

const TABS = [
  'Basic',
  'Amenities',
  'Facilities',
  'Location',
  'Media',
  'SEO',
  'Schedule',
  'Contact',
  'Type',
];

interface BusinessFormState {
  title: string;
  description: string;
  category: string;
  subCategory: string;
  featuredType: string;
  amenities: string[];
  facilities: string[];
  facility_hours: {
    [key: string]: {
      open: string;
      close: string;
      days: string;
    };
  };
  country: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  thumbnail: File | null;
  cover: File | null;
  videoProvider: string;
  videoUrl: string;
  gallery: File[];
  tags: string[];
  metaTags: string[];
  schedule: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  website: string;
  email: string;
  phone: string;
  facebook: string;
  twitter: string;
  linkedin: string;
  businessTypes: string[];
  menuName: string;
  menuPrice: string;
  menuItems: string[];
  menuImage: File | null;
}

interface BusinessEditTabsFormProps {
  businessId: string;
  initialData: BusinessFormState;
  onComplete: (businessId: string) => void;
}

const categories = [
  { value: 'accommodations', label: 'Accommodations' },
  { value: 'dining-cafes', label: 'Dining & Cafés' },
  { value: 'tours-activities', label: 'Tours & Activities' },
  { value: 'shopping-retail', label: 'Shopping & Retail' },
  { value: 'health-wellness', label: 'Health & Wellness' },
  { value: 'beauty-personal-care', label: 'Beauty & Personal Care' },
  { value: 'home-services-repairs', label: 'Home Services & Repairs' },
  { value: 'professional-services', label: 'Professional Services' },
  { value: 'kids-education-family', label: 'Kids, Education & Family' },
  { value: 'pets-animals', label: 'Pets & Animals' },
  { value: 'transport-travel', label: 'Transport & Travel' },
  { value: 'arts-culture-events', label: 'Arts, Culture & Events' },
  { value: 'outdoors-recreation', label: 'Outdoors & Recreation' },
  { value: 'community-nonprofits', label: 'Community & Non-Profits' }
];

const subCategoriesMap: Record<string, {value: string, label: string}[]> = {
  accommodations: [
    { value: 'hotel', label: 'Hotel' },
    { value: 'resort', label: 'Resort' },
    { value: 'guesthouse', label: 'Guesthouse' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'bnb', label: 'Bed & Breakfast' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'camping', label: 'Camping' },
    { value: 'homestay', label: 'Homestay' },
    { value: 'other', label: 'Other' },
  ],
  // ... (other categories as in BusinessMultiStepForm)
};

export default function BusinessEditTabsForm({ businessId, initialData, onComplete }: BusinessEditTabsFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState<BusinessFormState>(initialData);

  // Get communityId from initialData or window.location
  let communityId = '';
  if (typeof window !== 'undefined') {
    const match = window.location.pathname.match(/community\/([^/]+)/);
    if (match) communityId = match[1];
  }

  // Helper to get subcategories for the selected category
  const getSubCategories = () => {
    return subCategoriesMap[form.category] || [];
  };

  return (
    <div className="max-w-content mx-auto bg-offWhite rounded-lg shadow-elevated p-0 overflow-hidden border border-seafoam/20">
      {/* Back Button */}
      <div className="p-6 pb-0">
        <button
          className="px-4 py-2 rounded-md bg-transparent text-primaryTeal font-semibold hover:underline transition-colors"
          type="button"
          onClick={() => router.push(`/community/${communityId}/business/directory/my-businesses`)}
        >
          ← Back to My Businesses
        </button>
      </div>
      {/* Tabs */}
      <div className="flex border-b border-seafoam/30">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              step === i
                ? 'bg-offWhite text-primaryTeal border-b-2 border-primaryTeal'
                : 'bg-seafoam/20 text-darkCharcoal hover:bg-seafoam/30'
            }`}
            onClick={() => setStep(i)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Step Content */}
      <div className="p-8">
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Basic Info</h2>
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-darkCharcoal">Business Name</label>
              <input 
                id="title"
                className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                placeholder="Enter your business name" 
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-darkCharcoal">Short Description</label>
              <textarea 
                id="description"
                className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none min-h-[100px]" 
                placeholder="Briefly describe your business" 
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
              />
              <p className="text-xs text-grayLight">Provide a concise description that will appear in search results.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium text-darkCharcoal">Category</label>
                <select 
                  id="category"
                  className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                  value={form.category}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setForm({...form, category: newCategory, subCategory: ''});
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
                {form.category === 'accommodations' && (
                  <div className="mt-2 px-3 py-2 bg-primaryTeal/10 border border-primaryTeal/30 rounded-md text-sm font-medium text-primaryTeal flex items-center gap-2">
                    <span className="text-lg">✓</span>
                    Accommodation template will be applied
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="subCategory" className="text-sm font-medium text-darkCharcoal">Sub-category</label>
                <select 
                  id="subCategory"
                  className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                  value={form.subCategory}
                  onChange={(e) => setForm({...form, subCategory: e.target.value})}
                  disabled={!form.category}
                >
                  <option value="">Select sub-category</option>
                  {getSubCategories().map(subCat => (
                    <option key={subCat.value} value={subCat.value}>{subCat.label}</option>
                  ))}
                </select>
                {!form.category && (
                  <p className="text-xs text-grayLight">Please select a category first</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="featuredType" className="text-sm font-medium text-darkCharcoal">Featured Type</label>
              <input 
                id="featuredType"
                className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                placeholder="e.g. Hot Deal, New Opening, etc." 
                value={form.featuredType}
                onChange={(e) => setForm({...form, featuredType: e.target.value})}
              />
              <p className="text-xs text-grayLight">Special tag that will be shown with your listing</p>
            </div>
            <button
              className="px-6 py-3 rounded-md bg-primaryTeal text-offWhite font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle"
              type="button"
              onClick={() => {/* update only basic info fields */}}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Amenities</h2>
            <p className="text-darkCharcoal mb-4">Select all amenities that your business offers:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'WiFi',
                'Parking',
                'Outdoor Seating',
                'Pet Friendly',
                'Wheelchair Accessible',
                'Air Conditioning',
                'Delivery',
                'Takeout',
                'Reservations',
                'Family-Friendly',
                'Live Music',
                'Waterfront View',
                'Beachfront',
                'Swimming Pool',
                'Fitness Center',
                'Spa Services',
                'Business Center',
                'Electric Vehicle Charging'
              ].map(amenity => (
                <label key={amenity} className="flex items-center gap-2 p-2 rounded-md border border-transparent hover:border-seafoam hover:bg-seafoam/10 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="text-primaryTeal focus:ring-primaryTeal h-4 w-4"
                    checked={form.amenities.includes(amenity)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({...form, amenities: [...form.amenities, amenity]});
                      } else {
                        setForm({...form, amenities: form.amenities.filter(a => a !== amenity)});
                      }
                    }}
                  />
                  <span className="text-darkCharcoal">{amenity}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-seafoam/30">
              <h3 className="font-heading font-semibold text-primaryTeal mb-3">Custom Amenities</h3>
              <p className="text-sm text-grayLight mb-3">Add any additional amenities not listed above:</p>
              <div className="flex gap-2">
                <input 
                  className="flex-1 border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                  placeholder="Enter custom amenity"
                  id="customAmenity"
                />
                <button 
                  type="button"
                  className="px-4 py-2 bg-seafoam text-primaryTeal font-semibold rounded-md hover:bg-seafoam/80 transition-colors"
                  onClick={() => {
                    const customAmenity = (document.getElementById('customAmenity') as HTMLInputElement).value.trim();
                    if (customAmenity && !form.amenities.includes(customAmenity)) {
                      setForm({...form, amenities: [...form.amenities, customAmenity]});
                      (document.getElementById('customAmenity') as HTMLInputElement).value = '';
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            <button
              className="px-6 py-3 rounded-md bg-primaryTeal text-offWhite font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle"
              type="button"
              onClick={() => {/* update only amenities fields */}}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Facilities</h2>
            <p className="text-darkCharcoal mb-4">Select on-site facilities that your business offers:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'Swimming Pool',
                'Spa',
                'Gym',
                'Restaurant',
                'Bar',
                'Conference Room',
                'Business Center',
                'Kids Club',
                'Tennis Court',
                'Golf Course',
                'Beach Access',
                'Water Sports',
              ].map(facility => (
                <label key={facility} className="flex items-center gap-2 p-2 rounded-md border border-transparent hover:border-seafoam hover:bg-seafoam/10 transition-colors cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="text-primaryTeal focus:ring-primaryTeal h-4 w-4"
                    checked={form.facilities?.includes(facility) || false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({...form, facilities: [...(form.facilities || []), facility]});
                      } else {
                        setForm({
                          ...form, 
                          facilities: form.facilities.filter(f => f !== facility),
                          facility_hours: Object.fromEntries(
                            Object.entries(form.facility_hours).filter(([key]) => key !== facility)
                          )
                        });
                      }
                    }}
                  />
                  <span className="text-darkCharcoal">{facility}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-seafoam/30">
              <h3 className="font-heading font-semibold text-primaryTeal mb-3">Custom Facilities</h3>
              <p className="text-sm text-grayLight mb-3">Add any additional facilities not listed above:</p>
              <div className="flex gap-2">
                <input 
                  className="flex-1 border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                  placeholder="Enter custom facility"
                  id="customFacility"
                />
                <button 
                  type="button"
                  className="px-4 py-2 bg-seafoam text-primaryTeal font-semibold rounded-md hover:bg-seafoam/80 transition-colors"
                  onClick={() => {
                    const customFacility = (document.getElementById('customFacility') as HTMLInputElement).value.trim();
                    if (customFacility && !form.facilities?.includes(customFacility)) {
                      setForm({...form, facilities: [...(form.facilities || []), customFacility]});
                      (document.getElementById('customFacility') as HTMLInputElement).value = '';
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            {form.facilities?.length > 0 && (
              <div className="mt-6 pt-4 border-t border-seafoam/30">
                <h3 className="font-heading font-semibold text-primaryTeal mb-3">Facility Operating Hours</h3>
                <p className="text-sm text-grayLight mb-4">Specify operating hours for each facility (if applicable):</p>
                <div className="space-y-4">
                  {form.facilities.map(facility => (
                    <div key={facility} className="p-4 bg-seafoam/10 rounded-lg">
                      <h4 className="font-medium text-primaryTeal mb-3">{facility}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-darkCharcoal">Opening Time</label>
                          <input 
                            type="time" 
                            className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                            value={form.facility_hours[facility]?.open || ''}
                            onChange={(e) => {
                              const updatedHours = { 
                                ...form.facility_hours,
                                [facility]: {
                                  open: e.target.value,
                                  close: form.facility_hours[facility]?.close || '',
                                  days: form.facility_hours[facility]?.days || 'Monday - Sunday'
                                }
                              };
                              setForm({...form, facility_hours: updatedHours});
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-darkCharcoal">Closing Time</label>
                          <input 
                            type="time" 
                            className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                            value={form.facility_hours[facility]?.close || ''}
                            onChange={(e) => {
                              const updatedHours = { 
                                ...form.facility_hours,
                                [facility]: {
                                  open: form.facility_hours[facility]?.open || '',
                                  close: e.target.value,
                                  days: form.facility_hours[facility]?.days || 'Monday - Sunday'
                                }
                              };
                              setForm({...form, facility_hours: updatedHours});
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-darkCharcoal">Days of Operation</label>
                          <input 
                            type="text" 
                            className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                            placeholder="e.g. Monday - Friday"
                            value={form.facility_hours[facility]?.days || ''}
                            onChange={(e) => {
                              const updatedHours = { 
                                ...form.facility_hours,
                                [facility]: {
                                  open: form.facility_hours[facility]?.open || '',
                                  close: form.facility_hours[facility]?.close || '',
                                  days: e.target.value
                                }
                              };
                              setForm({...form, facility_hours: updatedHours});
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="px-6 py-3 rounded-md bg-primaryTeal text-offWhite font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle" type="button" onClick={() => {/* update only facilities fields */}} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update'}</button>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="country" className="text-sm font-medium text-darkCharcoal">Country</label>
                  <select 
                    id="country"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    value={form.country}
                    onChange={(e) => setForm({...form, country: e.target.value})}
                  >
                    <option value="">Select country</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="United States">United States</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Philippines">Philippines</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium text-darkCharcoal">City</label>
                  <input 
                    id="city"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    placeholder="Enter city name"
                    value={form.city}
                    onChange={(e) => setForm({...form, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium text-darkCharcoal">Full Address</label>
                  <textarea 
                    id="address"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    placeholder="Enter full street address"
                    value={form.address}
                    onChange={(e) => setForm({...form, address: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="latitude" className="text-sm font-medium text-darkCharcoal">Latitude</label>
                    <input 
                      id="latitude"
                      className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="e.g. 16.0544"
                      value={form.latitude}
                      onChange={(e) => setForm({...form, latitude: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="longitude" className="text-sm font-medium text-darkCharcoal">Longitude</label>
                    <input 
                      id="longitude"
                      className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="e.g. 108.2022"
                      value={form.longitude}
                      onChange={(e) => setForm({...form, longitude: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="border border-grayLight rounded-lg overflow-hidden bg-white">
                <div className="bg-sand p-3 border-b border-grayLight">
                  <h3 className="font-medium text-darkCharcoal">Map Location</h3>
                </div>
                <div className="h-[300px] bg-seafoam/20 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">📍</div>
                    <p className="text-darkCharcoal font-medium">Map Preview</p>
                    <p className="text-sm text-grayLight">Enter location details to see your business on the map</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-sand/70 p-4 rounded-md border border-seafoam/20 mt-4">
              <p className="text-sm text-darkCharcoal">
                <span className="font-medium">Tip:</span> For the most accurate listing, please provide precise coordinates. You can find these by right-clicking on your location in Google Maps and selecting "What's here?".
              </p>
            </div>
            <button className="px-6 py-3 rounded-md bg-primaryTeal text-offWhite font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle" type="button" onClick={() => {/* update only location fields */}} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update'}</button>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-darkCharcoal">Thumbnail Image</label>
                  <div className="border-2 border-dashed border-seafoam rounded-md p-4 bg-sand/50 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-3xl text-seafoam">🖼️</div>
                      <p className="text-sm text-darkCharcoal">Drag and drop your thumbnail image or</p>
                      <label className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md cursor-pointer hover:bg-seafoam/80 transition-colors font-medium">
                        Browse Files
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setForm({...form, thumbnail: e.target.files[0]});
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-grayLight">Recommended: 400x300px, max 2MB</p>
                    </div>
                    {form.thumbnail && (
                      <div className="mt-4 p-2 bg-white rounded border border-seafoam">
                        <p className="text-sm text-darkCharcoal truncate">{form.thumbnail.name}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-darkCharcoal">Cover Image</label>
                  <div className="border-2 border-dashed border-seafoam rounded-md p-4 bg-sand/50 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-3xl text-seafoam">🌄</div>
                      <p className="text-sm text-darkCharcoal">Drag and drop your cover image or</p>
                      <label className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md cursor-pointer hover:bg-seafoam/80 transition-colors font-medium">
                        Browse Files
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setForm({...form, cover: e.target.files[0]});
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-grayLight">Recommended: 1200x600px, max 5MB</p>
                    </div>
                    {form.cover && (
                      <div className="mt-4 p-2 bg-white rounded border border-seafoam">
                        <p className="text-sm text-darkCharcoal truncate">{form.cover.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="videoProvider" className="text-sm font-medium text-darkCharcoal">Video Provider</label>
                  <select 
                    id="videoProvider"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    value={form.videoProvider}
                    onChange={(e) => setForm({...form, videoProvider: e.target.value})}
                  >
                    <option value="">Select provider</option>
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="videoUrl" className="text-sm font-medium text-darkCharcoal">Video URL</label>
                  <input 
                    id="videoUrl"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    placeholder="e.g. https://youtube.com/watch?v=..."
                    value={form.videoUrl}
                    onChange={(e) => setForm({...form, videoUrl: e.target.value})}
                  />
                  <p className="text-xs text-grayLight">Paste the full URL of your video</p>
                </div>
                <div className="space-y-2 mt-4">
                  <label className="text-sm font-medium text-darkCharcoal">Gallery Images</label>
                  <div className="border-2 border-dashed border-seafoam rounded-md p-4 bg-sand/50 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-3xl text-seafoam">📸</div>
                      <p className="text-sm text-darkCharcoal">Upload multiple gallery images</p>
                      <label className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md cursor-pointer hover:bg-seafoam/80 transition-colors font-medium">
                        Browse Files
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const filesArray = Array.from(e.target.files);
                              setForm({...form, gallery: [...form.gallery, ...filesArray]});
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-grayLight">Up to 10 images, max 2MB each</p>
                    </div>
                    {form.gallery.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {form.gallery.slice(0, 3).map((file, index) => (
                          <div key={index} className="p-2 bg-white rounded border border-seafoam">
                            <p className="text-xs text-darkCharcoal truncate">{file.name}</p>
                          </div>
                        ))}
                        {form.gallery.length > 3 && (
                          <div className="p-2 bg-white rounded border border-seafoam flex items-center justify-center">
                            <p className="text-xs text-darkCharcoal">+{form.gallery.length - 3} more</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button className="px-6 py-3 rounded-md bg-primaryTeal text-offWhite font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle" type="button" onClick={() => {/* update only media fields */}} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update'}</button>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">SEO</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="tags" className="text-sm font-medium text-darkCharcoal">Business Tags</label>
                <div className="relative">
                  <input 
                    id="tags"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    placeholder="Enter tags separated by commas (e.g. beach, seafood, family-friendly)" 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();
                        if (value && !form.tags.includes(value)) {
                          setForm({...form, tags: [...form.tags, value]});
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-seafoam text-primaryTeal rounded hover:bg-seafoam/80 transition-colors"
                    onClick={() => {
                      const input = document.getElementById('tags') as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !form.tags.includes(value)) {
                        setForm({...form, tags: [...form.tags, value]});
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-grayLight">Tags help customers find your business when searching</p>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.tags.map((tag, index) => (
                      <div 
                        key={index} 
                        className="bg-seafoam/20 text-primaryTeal px-2 py-1 rounded-md flex items-center gap-1 text-sm"
                      >
                        <span>{tag}</span>
                        <button 
                          type="button"
                          className="text-primaryTeal hover:text-coralAccent transition-colors"
                          onClick={() => setForm({...form, tags: form.tags.filter((_, i) => i !== index)})}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="metaTags" className="text-sm font-medium text-darkCharcoal">Meta Tags</label>
                <div className="relative">
                  <input 
                    id="metaTags"
                    className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                    placeholder="Enter meta tags separated by commas" 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();
                        if (value && !form.metaTags.includes(value)) {
                          setForm({...form, metaTags: [...form.metaTags, value]});
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-seafoam text-primaryTeal rounded hover:bg-seafoam/80 transition-colors"
                    onClick={() => {
                      const input = document.getElementById('metaTags') as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !form.metaTags.includes(value)) {
                        setForm({...form, metaTags: [...form.metaTags, value]});
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-grayLight">Meta tags improve your business's visibility in search engines</p>
                {form.metaTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.metaTags.map((tag, index) => (
                      <div 
                        key={index} 
                        className="bg-sand border border-grayLight px-2 py-1 rounded-md flex items-center gap-1 text-sm"
                      >
                        <span>{tag}</span>
                        <button 
                          type="button"
                          className="text-grayLight hover:text-coralAccent transition-colors"
                          onClick={() => setForm({...form, metaTags: form.metaTags.filter((_, i) => i !== index)})}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-sand/70 p-4 rounded-md border border-seafoam/20 mt-4">
                <h3 className="font-heading font-semibold text-primaryTeal mb-2">SEO Tips</h3>
                <ul className="text-sm text-darkCharcoal space-y-1 list-disc pl-5">
                  <li>Use relevant keywords that potential customers might search for</li>
                  <li>Include your location in tags (city, neighborhood, etc.)</li>
                  <li>Add specific services or products you offer</li>
                  <li>Consider including nearby landmarks or attractions</li>
                </ul>
              </div>
            </div>
            <button className="px-6 py-3 rounded-md bg-primaryTeal text-offWhite font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle" type="button" onClick={() => {/* update only SEO fields */}} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update'}</button>
          </div>
        )}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Business Hours</h2>
            <div className="bg-white rounded-lg border border-grayLight overflow-hidden">
              <div className="grid grid-cols-7 bg-sand border-b border-grayLight">
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Day</div>
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Open</div>
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Close</div>
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Open 24h</div>
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Closed</div>
                <div className="p-3 font-medium text-darkCharcoal border-r border-grayLight">Split Hours</div>
                <div className="p-3 font-medium text-darkCharcoal">Second Shift</div>
              </div>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, index) => {
                const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                return (
                  <div 
                    key={day} 
                    className={`grid grid-cols-7 ${index % 2 === 0 ? 'bg-white' : 'bg-sand/30'} border-b border-grayLight last:border-b-0`}
                  >
                    <div className="p-3 border-r border-grayLight flex items-center">
                      <span className="font-medium text-primaryTeal">{dayName}</span>
                    </div>
                    <div className="p-3 border-r border-grayLight">
                      <input 
                        type="time" 
                        className="w-full border border-grayLight rounded-md px-2 py-1 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none"
                        value={form.schedule[day as keyof typeof form.schedule].open}
                        onChange={(e) => {
                          setForm({
                            ...form,
                            schedule: {
                              ...form.schedule,
                              [day]: {
                                ...form.schedule[day as keyof typeof form.schedule],
                                open: e.target.value
                              }
                            }
                          });
                        }}
                      />
                    </div>
                    <div className="p-3 border-r border-grayLight">
                      <input 
                        type="time" 
                        className="w-full border border-grayLight rounded-md px-2 py-1 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none"
                        value={form.schedule[day as keyof typeof form.schedule].close}
                        onChange={(e) => {
                          setForm({
                            ...form,
                            schedule: {
                              ...form.schedule,
                              [day]: {
                                ...form.schedule[day as keyof typeof form.schedule],
                                close: e.target.value
                              }
                            }
                          });
                        }}
                      />
                    </div>
                    <div className="p-3 border-r border-grayLight flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-primaryTeal focus:ring-primaryTeal"
                        checked={form.schedule[day as keyof typeof form.schedule].open === '00:00' && form.schedule[day as keyof typeof form.schedule].close === '23:59'}
                        onChange={(e) => {
                          setForm({
                            ...form,
                            schedule: {
                              ...form.schedule,
                              [day]: {
                                ...form.schedule[day as keyof typeof form.schedule],
                                open: e.target.checked ? '00:00' : '',
                                close: e.target.checked ? '23:59' : ''
                              }
                            }
                          });
                        }}
                      />
                    </div>
                    <div className="p-3 border-r border-grayLight flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-primaryTeal focus:ring-primaryTeal"
                        checked={form.schedule[day as keyof typeof form.schedule].open === '' && form.schedule[day as keyof typeof form.schedule].close === ''}
                        onChange={(e) => {
                          setForm({
                            ...form,
                            schedule: {
                              ...form.schedule,
                              [day]: {
                                ...form.schedule[day as keyof typeof form.schedule],
                                open: e.target.checked ? '' : '09:00',
                                close: e.target.checked ? '' : '17:00'
                              }
                            }
                          });
                        }}
                      />
                    </div>
                    <div className="p-3 flex items-center justify-center text-xs text-grayLight">N/A</div>
                    <div className="p-3 flex items-center justify-center text-xs text-grayLight">N/A</div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4">
              <button 
                type="button"
                className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md hover:bg-seafoam/80 transition-colors font-medium text-sm"
                onClick={() => {
                  const newSchedule = {...form.schedule};
                  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
                    newSchedule[day as keyof typeof form.schedule].open = '09:00';
                    newSchedule[day as keyof typeof form.schedule].close = '17:00';
                  });
                  ['saturday', 'sunday'].forEach(day => {
                    newSchedule[day as keyof typeof form.schedule].open = '';
                    newSchedule[day as keyof typeof form.schedule].close = '';
                  });
                  setForm({...form, schedule: newSchedule});
                }}
              >
                Set Weekday Hours (9-5)
              </button>
              <button 
                type="button"
                className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md hover:bg-seafoam/80 transition-colors font-medium text-sm"
                onClick={() => {
                  const newSchedule = {...form.schedule};
                  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                  const mondayOpen = form.schedule.monday.open;
                  const mondayClose = form.schedule.monday.close;
                  days.forEach(day => {
                    newSchedule[day as keyof typeof form.schedule].open = mondayOpen;
                    newSchedule[day as keyof typeof form.schedule].close = mondayClose;
                  });
                  setForm({...form, schedule: newSchedule});
                }}
              >
                Copy Monday to All Days
              </button>
            </div>
            <button className="px-6 py-3 rounded-md bg-primaryTeal text-offWhite font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle" type="button" onClick={() => {/* update only schedule fields */}} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update'}</button>
          </div>
        )}
        {step === 7 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="website" className="text-sm font-medium text-darkCharcoal">Website</label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="website"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="https://www.example.com" 
                      value={form.website}
                      onChange={(e) => setForm({...form, website: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-darkCharcoal">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="email"
                      type="email"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="contact@yourbusiness.com" 
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-darkCharcoal">Phone Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="phone"
                      type="tel"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="+1 (555) 123-4567" 
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="font-heading font-semibold text-primaryTeal">Social Media Profiles</h3>
                <div className="space-y-2">
                  <label htmlFor="facebook" className="text-sm font-medium text-darkCharcoal">Facebook</label>
                  <div className="relative">
                    <Facebook size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="facebook"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="https://facebook.com/yourbusiness" 
                      value={form.facebook}
                      onChange={(e) => setForm({...form, facebook: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="twitter" className="text-sm font-medium text-darkCharcoal">Twitter</label>
                  <div className="relative">
                    <Twitter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="twitter"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="https://twitter.com/yourbusiness" 
                      value={form.twitter}
                      onChange={(e) => setForm({...form, twitter: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="linkedin" className="text-sm font-medium text-darkCharcoal">LinkedIn</label>
                  <div className="relative">
                    <Linkedin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grayLight" />
                    <input 
                      id="linkedin"
                      className="w-full border border-grayLight rounded-md pl-10 pr-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                      placeholder="https://linkedin.com/company/yourbusiness" 
                      value={form.linkedin}
                      onChange={(e) => setForm({...form, linkedin: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-sand/70 p-4 rounded-md border border-seafoam/20 mt-4">
              <h3 className="font-heading font-semibold text-primaryTeal mb-2">Contact Tips</h3>
              <ul className="text-sm text-darkCharcoal space-y-1 list-disc pl-5">
                <li>Include at least one contact method (phone, email, or website)</li>
                <li>Social media profiles help customers connect with your business</li>
                <li>Make sure your contact information is current and accurate</li>
              </ul>
            </div>
            <button className="px-6 py-3 rounded-md bg-primaryTeal text-offWhite font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle" type="button" onClick={() => {/* update only contact fields */}} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update'}</button>
          </div>
        )}
        {step === 8 && (
          <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-primaryTeal mb-6">Business Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-darkCharcoal">Business Type</label>
                  <p className="text-xs text-grayLight">Select all that apply to your business</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {['General', 'Shop', 'Hotel', 'Restaurant', 'Cafe', 'Bar', 'Tour', 'Activity', 'Service'].map(type => (
                      <label 
                        key={type} 
                        className={`flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer ${form.businessTypes.includes(type) ? 'bg-seafoam/20 border-primaryTeal text-primaryTeal' : 'bg-sand border-grayLight text-darkCharcoal hover:border-seafoam'}`}
                      >
                        <input 
                          type="checkbox" 
                          className="text-primaryTeal focus:ring-primaryTeal h-4 w-4"
                          checked={form.businessTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({...form, businessTypes: [...form.businessTypes, type]});
                            } else {
                              setForm({...form, businessTypes: form.businessTypes.filter(t => t !== type)});
                            }
                          }}
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-darkCharcoal">Has Menu?</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="hasMenu" 
                        className="text-primaryTeal focus:ring-primaryTeal h-4 w-4"
                        checked={form.menuName !== ''}
                        onChange={() => {
                          if (form.menuName === '') {
                            setForm({...form, menuName: 'Menu'});
                          }
                        }}
                      />
                      <span className="text-darkCharcoal">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="hasMenu" 
                        className="text-primaryTeal focus:ring-primaryTeal h-4 w-4"
                        checked={form.menuName === ''}
                        onChange={() => {
                          setForm({...form, menuName: '', menuPrice: '', menuItems: []});
                        }}
                      />
                      <span className="text-darkCharcoal">No</span>
                    </label>
                  </div>
                </div>
                {form.menuName !== '' && (
                  <div className="space-y-4 p-4 bg-sand/50 rounded-md border border-seafoam/20">
                    <div className="space-y-2">
                      <label htmlFor="menuName" className="text-sm font-medium text-darkCharcoal">Menu Name</label>
                      <input 
                        id="menuName"
                        className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                        placeholder="e.g. Lunch Menu, Dinner Menu" 
                        value={form.menuName}
                        onChange={(e) => setForm({...form, menuName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="menuPrice" className="text-sm font-medium text-darkCharcoal">Price Range</label>
                      <input 
                        id="menuPrice"
                        className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                        placeholder="e.g. $10-$30" 
                        value={form.menuPrice}
                        onChange={(e) => setForm({...form, menuPrice: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="menuItems" className="text-sm font-medium text-darkCharcoal">Menu Items</label>
                      <div className="relative">
                        <input 
                          id="menuItems"
                          className="w-full border border-grayLight rounded-md px-3 py-2 bg-sand focus:ring-2 focus:ring-primaryTeal focus:border-primaryTeal focus:outline-none" 
                          placeholder="Add menu items one by one" 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const value = input.value.trim();
                              if (value) {
                                setForm({...form, menuItems: [...form.menuItems, value]});
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button 
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-seafoam text-primaryTeal rounded hover:bg-seafoam/80 transition-colors"
                          onClick={() => {
                            const input = document.getElementById('menuItems') as HTMLInputElement;
                            const value = input.value.trim();
                            if (value) {
                              setForm({...form, menuItems: [...form.menuItems, value]});
                              input.value = '';
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <p className="text-xs text-grayLight">Press Enter after each item or click Add</p>
                      {form.menuItems.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-darkCharcoal">Added Items:</p>
                          <ul className="bg-white rounded-md border border-grayLight p-2 max-h-[150px] overflow-y-auto">
                            {form.menuItems.map((item, index) => (
                              <li 
                                key={index} 
                                className="flex justify-between items-center py-1 px-2 border-b border-grayLight/50 last:border-b-0"
                              >
                                <span className="text-sm text-darkCharcoal">{item}</span>
                                <button 
                                  type="button"
                                  className="text-grayLight hover:text-coralAccent transition-colors"
                                  onClick={() => setForm({...form, menuItems: form.menuItems.filter((_, i) => i !== index)})}
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-darkCharcoal">Menu Image</label>
                      <div className="border-2 border-dashed border-seafoam rounded-md p-4 bg-sand/50 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="text-2xl text-seafoam">🍽️</div>
                          <p className="text-sm text-darkCharcoal">Upload an image of your menu</p>
                          <label className="px-4 py-2 bg-seafoam text-primaryTeal rounded-md cursor-pointer hover:bg-seafoam/80 transition-colors font-medium">
                            Browse Files
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setForm({...form, menuImage: e.target.files[0]});
                                }
                              }}
                            />
                          </label>
                        </div>
                        {form.menuImage && (
                          <div className="mt-4 p-2 bg-white rounded border border-seafoam">
                            <p className="text-sm text-darkCharcoal truncate">{form.menuImage.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="px-6 py-3 rounded-md bg-primaryTeal text-offWhite font-semibold hover:bg-seafoam hover:text-primaryTeal transition-colors border-2 border-primaryTeal shadow-subtle" type="button" onClick={() => {/* update only type fields */}} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update'}</button>
          </div>
        )}
      </div>
    </div>
  );
} 