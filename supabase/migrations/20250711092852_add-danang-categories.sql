-- Create Da Nang specific categories and subcategories
-- This migration adds categories and subcategories that are specific to Da Nang's market

-- First, clear existing categories and subcategories if needed
-- DELETE FROM subcategories;
-- DELETE FROM categories;

-- Insert Da Nang specific categories
INSERT INTO categories (id, name) VALUES 
('food-beverage', 'Food & Beverage'),
('accommodation', 'Accommodation'),
('tourism', 'Tourism & Attractions'),
('shopping', 'Shopping & Retail'),
('services', 'Local Services'),
('wellness', 'Health & Wellness'),
('education', 'Education & Training'),
('nightlife', 'Nightlife & Entertainment'),
('transportation', 'Transportation'),
('cultural', 'Cultural & Arts')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Insert Da Nang specific subcategories
-- Food & Beverage subcategories
INSERT INTO subcategories (id, name, category_id) VALUES
('vietnamese-cuisine', 'Vietnamese Cuisine', 'food-beverage'),
('seafood', 'Seafood Restaurants', 'food-beverage'),
('coffee-shops', 'Coffee Shops & Cafes', 'food-beverage'),
('street-food', 'Street Food Vendors', 'food-beverage'),
('international-cuisine', 'International Cuisine', 'food-beverage'),
('bakeries', 'Bakeries & Desserts', 'food-beverage'),
('vegetarian', 'Vegetarian & Vegan', 'food-beverage'),
('bars-pubs', 'Bars & Pubs', 'food-beverage'),
('food-delivery', 'Food Delivery Services', 'food-beverage')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- Accommodation subcategories
INSERT INTO subcategories (id, name, category_id) VALUES
('beachfront-resorts', 'Beachfront Resorts', 'accommodation'),
('boutique-hotels', 'Boutique Hotels', 'accommodation'),
('budget-hostels', 'Budget Hostels', 'accommodation'),
('vacation-rentals', 'Vacation Rentals', 'accommodation'),
('homestays', 'Homestays', 'accommodation'),
('serviced-apartments', 'Serviced Apartments', 'accommodation'),
('luxury-hotels', 'Luxury Hotels', 'accommodation'),
('family-resorts', 'Family Resorts', 'accommodation')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- Tourism & Attractions subcategories
INSERT INTO subcategories (id, name, category_id) VALUES
('beaches', 'Beaches', 'tourism'),
('landmarks', 'Landmarks & Monuments', 'tourism'),
('museums', 'Museums & Galleries', 'tourism'),
('nature-parks', 'Nature & Parks', 'tourism'),
('adventure-activities', 'Adventure Activities', 'tourism'),
('boat-tours', 'Boat Tours & Water Sports', 'tourism'),
('day-trips', 'Day Trips & Excursions', 'tourism'),
('cultural-sites', 'Cultural Sites', 'tourism'),
('eco-tourism', 'Eco Tourism', 'tourism')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- Shopping & Retail subcategories
INSERT INTO subcategories (id, name, category_id) VALUES
('markets', 'Local Markets', 'shopping'),
('souvenir-shops', 'Souvenir & Gift Shops', 'shopping'),
('malls', 'Shopping Malls', 'shopping'),
('fashion-clothing', 'Fashion & Clothing', 'shopping'),
('handicrafts', 'Handicrafts & Artisan Goods', 'shopping'),
('electronics', 'Electronics & Tech', 'shopping'),
('specialty-stores', 'Specialty Stores', 'shopping'),
('convenience-stores', 'Convenience Stores', 'shopping')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- Local Services subcategories
INSERT INTO subcategories (id, name, category_id) VALUES
('laundry', 'Laundry & Dry Cleaning', 'services'),
('banking', 'Banking & Currency Exchange', 'services'),
('postal', 'Postal & Shipping', 'services'),
('telecom', 'Telecom & Internet', 'services'),
('repair-services', 'Repair Services', 'services'),
('cleaning-services', 'Cleaning Services', 'services'),
('event-services', 'Event Services', 'services'),
('rental-services', 'Rental Services', 'services'),
('business-services', 'Business Services', 'services')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- Health & Wellness subcategories
INSERT INTO subcategories (id, name, category_id) VALUES
('spas', 'Spas & Massage', 'wellness'),
('yoga-studios', 'Yoga & Meditation', 'wellness'),
('fitness-centers', 'Fitness Centers', 'wellness'),
('beauty-salons', 'Beauty Salons', 'wellness'),
('medical-clinics', 'Medical Clinics', 'wellness'),
('pharmacies', 'Pharmacies', 'wellness'),
('traditional-medicine', 'Traditional Medicine', 'wellness'),
('wellness-retreats', 'Wellness Retreats', 'wellness')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- Education & Training subcategories
INSERT INTO subcategories (id, name, category_id) VALUES
('language-schools', 'Language Schools', 'education'),
('cooking-classes', 'Cooking Classes', 'education'),
('art-classes', 'Art & Craft Classes', 'education'),
('dance-schools', 'Dance Schools', 'education'),
('vocational-training', 'Vocational Training', 'education'),
('tutoring-services', 'Tutoring Services', 'education'),
('educational-centers', 'Educational Centers', 'education')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- Nightlife & Entertainment subcategories
INSERT INTO subcategories (id, name, category_id) VALUES
('nightclubs', 'Nightclubs', 'nightlife'),
('karaoke', 'Karaoke', 'nightlife'),
('live-music', 'Live Music Venues', 'nightlife'),
('beach-clubs', 'Beach Clubs', 'nightlife'),
('rooftop-bars', 'Rooftop Bars', 'nightlife'),
('cinema', 'Cinema & Theaters', 'nightlife'),
('gaming', 'Gaming & Arcades', 'nightlife')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- Transportation subcategories
INSERT INTO subcategories (id, name, category_id) VALUES
('taxis', 'Taxis & Ride Services', 'transportation'),
('motorbike-rental', 'Motorbike Rental', 'transportation'),
('car-rental', 'Car Rental', 'transportation'),
('airport-transfers', 'Airport Transfers', 'transportation'),
('bicycle-rental', 'Bicycle Rental', 'transportation'),
('bus-services', 'Bus Services', 'transportation'),
('boat-transportation', 'Boat Transportation', 'transportation'),
('tour-transportation', 'Tour Transportation', 'transportation')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- Cultural & Arts subcategories
INSERT INTO subcategories (id, name, category_id) VALUES
('art-galleries', 'Art Galleries', 'cultural'),
('theaters', 'Theaters & Performance Venues', 'cultural'),
('cultural-centers', 'Cultural Centers', 'cultural'),
('historical-sites', 'Historical Sites', 'cultural'),
('religious-sites', 'Religious Sites', 'cultural'),
('workshops', 'Workshops & Studios', 'cultural'),
('festivals-events', 'Festivals & Events', 'cultural')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

-- Add translations for categories and subcategories
-- Note: In a real implementation, translations would be stored in a separate table
-- or managed through the application's translation system
