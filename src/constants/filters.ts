import { MapPin, Home, DollarSign, Bed, Tag, Clock, ShoppingBag, Sliders } from 'lucide-react';

export const propertyFilters = [
  {
    key: 'location',
    label: 'Location',
    icon: MapPin,
    // value: { city: string; area: string }
  },
  {
    key: 'type',
    label: 'Property Type',
    icon: Home,
    // value: string // e.g. 'Apartment', 'House', 'Studio', etc.
  },
  {
    key: 'price',
    label: 'Price',
    icon: DollarSign,
    // value: { min: number; max: number }
  },
  {
    key: 'beds',
    label: 'Bedrooms',
    icon: Bed,
    // value: number or 'Any'
  },
  {
    key: 'amenities',
    label: 'Amenities',
    icon: Sliders,
    // value: string[] // e.g. ['Furnished', 'Parking', 'Pet Friendly']
  }
];

export const marketFilters = [
  {
    key: 'search',
    label: 'Search',
    icon: ShoppingBag,
    // value: string
  },
  {
    key: 'category',
    label: 'Category',
    icon: Tag,
    // value: string // e.g. 'Electronics', 'Sports', 'Furniture', etc.
  },
  {
    key: 'price',
    label: 'Price',
    icon: DollarSign,
    // value: { min: number; max: number }
  },
  {
    key: 'condition',
    label: 'Condition',
    icon: Sliders,
    // value: string // e.g. 'New', 'Like New', 'Good', 'Used'
  },
  {
    key: 'location',
    label: 'Location',
    icon: MapPin,
    // value: string // e.g. 'Miami', 'Miami Beach', 'Coral Gables', etc.
  }
]; 