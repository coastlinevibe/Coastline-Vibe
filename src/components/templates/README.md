# Business Templates

This directory contains template components for different business categories.

## Accommodation Template

The Accommodation Template is designed for businesses in the "Accommodations" category. It provides a specialized layout for hotels, vacation rentals, B&Bs, and other lodging businesses.

### Components

1. **AccommodationTemplate.tsx** - Main template component that renders the entire accommodation page
2. **AccommodationBookingPanel.tsx** - Booking form component for accommodation reservations
3. **AccommodationGallery.tsx** - Gallery component for displaying accommodation images

### Usage

The template is automatically used when a business with the "Accommodations" category is viewed. The main business detail page (`/business/[businessId]/page.tsx`) determines which template to use based on the business category.

### Data Structure

The accommodation template expects the following data structure:

```typescript
interface Business {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  address?: string;
  location_lat?: number;
  location_lng?: number;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  amenities?: string[];
  gallery?: string[];
  rooms?: {
    name: string;
    description?: string;
    image_url?: string;
    price?: number;
    features?: string[];
  }[];
  key_facts?: {
    guests?: number;
    bedrooms?: number;
    bathrooms?: number;
    property_type?: string;
  };
  facilities?: string[];
  promotions?: {
    title: string;
    description: string;
    valid_until?: string;
    discount?: number;
  }[];
  base_price?: number;
}
```

### Required Images

- `/public/placeholder-accommodation.jpg` - Default placeholder for accommodation main image
- `/public/placeholder-room.jpg` - Default placeholder for room images

### Features

1. **Hero Section** - Large hero image with accommodation name and address
2. **Tabbed Navigation** - Easy navigation between different sections (Overview, Amenities, Rooms, Location, Gallery)
3. **Booking Panel** - Side panel for booking accommodations with date selection
4. **Key Facts** - Quick overview of important accommodation details
5. **Amenities & Facilities** - Lists of available amenities and facilities
6. **Room Listings** - Display of available rooms with details and pricing
7. **Location Information** - Address and map display (map integration to be implemented)
8. **Image Gallery** - Photo gallery with thumbnails and large image view
9. **Contact Information** - Easy access to contact details
10. **Promotions** - Special offers and discounts section

### Future Enhancements

- Integration with a real booking system
- Interactive map implementation
- Reviews and ratings section
- Availability calendar
- Virtual tour integration 