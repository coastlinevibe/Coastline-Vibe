import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Supabase client with service key for admin privileges
const supabase = createClient(supabaseUrl, supabaseKey);

// Da Nang sample businesses
const danangBusinesses = [
  {
    name: "Cong Cafe Da Nang",
    description: "A Vietnamese chain cafe with a retro style, serving traditional Vietnamese coffee and drinks. Popular among locals and tourists alike.",
    category_id: "", // Will be filled in from database
    subcategory_id: "", // Will be filled in from database
    address: "96 Trần Phú, Hải Châu 1, Hải Châu, Da Nang",
    location: { latitude: 16.075, longitude: 108.223 },
    neighborhood: "Han Riverside",
    rating: 4.7,
    phone: "+84 236 3565 777",
    email: "contact@congcaphe.com",
    website: "https://congcaphe.com",
    logo_url: "/images/placeholder.svg",
    cover_image_url: "/images/placeholder.svg",
    is_featured: true,
    schedule: {
      monday: { open: "07:00", close: "22:00" },
      tuesday: { open: "07:00", close: "22:00" },
      wednesday: { open: "07:00", close: "22:00" },
      thursday: { open: "07:00", close: "22:00" },
      friday: { open: "07:00", close: "22:00" },
      saturday: { open: "07:00", close: "22:00" },
      sunday: { open: "07:00", close: "22:00" },
    },
    amenities: ["Free Wi-Fi", "Air Conditioning", "Outdoor Seating"],
    tags: ["coffee", "vietnamese coffee", "cafe", "hipster", "retro"],
    price_range: "$$"
  },
  {
    name: "The Chef - Bánh Mì",
    description: "Authentic Vietnamese bánh mì sandwiches with a variety of fillings. Known for their crispy bread and fresh ingredients.",
    category_id: "", // Will be filled in from database
    subcategory_id: "", // Will be filled in from database
    address: "112 Hùng Vương, Hải Châu 2, Hải Châu, Da Nang",
    location: { latitude: 16.071, longitude: 108.217 },
    neighborhood: "Han Riverside",
    rating: 4.8,
    phone: "+84 236 3899 123",
    email: "thechefbahnmi@gmail.com",
    website: "https://thechef-bahnmi.vn",
    logo_url: "/images/placeholder.svg",
    cover_image_url: "/images/placeholder.svg",
    is_featured: true,
    schedule: {
      monday: { open: "06:00", close: "20:00" },
      tuesday: { open: "06:00", close: "20:00" },
      wednesday: { open: "06:00", close: "20:00" },
      thursday: { open: "06:00", close: "20:00" },
      friday: { open: "06:00", close: "20:00" },
      saturday: { open: "06:00", close: "20:00" },
      sunday: { open: "06:00", close: "20:00" },
    },
    amenities: ["Takeaway", "Vegetarian Options"],
    tags: ["banh mi", "sandwich", "vietnamese", "street food", "quick bite"],
    price_range: "$"
  },
  {
    name: "My An Beach Resort",
    description: "Beachfront resort with comfortable rooms and excellent amenities. Features a pool, restaurant, and direct beach access.",
    category_id: "", // Will be filled in from database
    subcategory_id: "", // Will be filled in from database
    address: "12 Võ Nguyên Giáp, Mỹ An, Ngũ Hành Sơn, Da Nang",
    location: { latitude: 16.038, longitude: 108.247 },
    neighborhood: "My An Beach Area",
    rating: 4.5,
    phone: "+84 236 3951 888",
    email: "reservations@myanresort.com",
    website: "https://myanbeachresort.com",
    logo_url: "/images/placeholder.svg",
    cover_image_url: "/images/placeholder.svg",
    is_featured: true,
    schedule: {
      monday: { open: "00:00", close: "23:59" },
      tuesday: { open: "00:00", close: "23:59" },
      wednesday: { open: "00:00", close: "23:59" },
      thursday: { open: "00:00", close: "23:59" },
      friday: { open: "00:00", close: "23:59" },
      saturday: { open: "00:00", close: "23:59" },
      sunday: { open: "00:00", close: "23:59" },
    },
    amenities: ["Swimming Pool", "Free Wi-Fi", "Air Conditioning", "Restaurant", "Spa", "Beach Access", "Airport Shuttle"],
    tags: ["resort", "beach", "accommodation", "pool", "restaurant", "luxury"],
    price_range: "$$$$"
  },
  {
    name: "Son Tra Retreat",
    description: "Eco-friendly retreat on Son Tra Peninsula with stunning views of the ocean. Peaceful environment perfect for relaxation.",
    category_id: "", // Will be filled in from database
    subcategory_id: "", // Will be filled in from database
    address: "Son Tra Peninsula, Da Nang",
    location: { latitude: 16.106, longitude: 108.261 },
    neighborhood: "Son Tra Peninsula",
    rating: 4.6,
    phone: "+84 236 3924 555",
    email: "info@sontraretreat.vn",
    website: "https://sontraretreat.vn",
    logo_url: "/images/placeholder.svg",
    cover_image_url: "/images/placeholder.svg",
    is_featured: true,
    schedule: {
      monday: { open: "00:00", close: "23:59" },
      tuesday: { open: "00:00", close: "23:59" },
      wednesday: { open: "00:00", close: "23:59" },
      thursday: { open: "00:00", close: "23:59" },
      friday: { open: "00:00", close: "23:59" },
      saturday: { open: "00:00", close: "23:59" },
      sunday: { open: "00:00", close: "23:59" },
    },
    amenities: ["Swimming Pool", "Free Wi-Fi", "Air Conditioning", "Restaurant", "Spa", "Mountain View", "Yoga Classes"],
    tags: ["retreat", "eco-friendly", "yoga", "relaxation", "nature", "wellness"],
    price_range: "$$$"
  },
  {
    name: "Madame Lan Restaurant",
    description: "Upscale restaurant serving authentic Central Vietnamese cuisine with a modern twist. Beautiful riverside setting.",
    category_id: "", // Will be filled in from database
    subcategory_id: "", // Will be filled in from database
    address: "42 Bạch Đằng, Hải Châu, Da Nang",
    location: { latitude: 16.077, longitude: 108.224 },
    neighborhood: "Han Riverside",
    rating: 4.9,
    phone: "+84 236 3887 666",
    email: "reservations@madamelan.vn",
    website: "https://madamelan.vn",
    logo_url: "/images/placeholder.svg",
    cover_image_url: "/images/placeholder.svg",
    is_featured: true,
    schedule: {
      monday: { open: "11:00", close: "22:00" },
      tuesday: { open: "11:00", close: "22:00" },
      wednesday: { open: "11:00", close: "22:00" },
      thursday: { open: "11:00", close: "22:00" },
      friday: { open: "11:00", close: "22:00" },
      saturday: { open: "11:00", close: "22:00" },
      sunday: { open: "11:00", close: "22:00" },
    },
    amenities: ["Air Conditioning", "Riverside View", "Reservations", "Private Dining", "Vegan Options"],
    tags: ["restaurant", "vietnamese cuisine", "fine dining", "riverside", "central vietnamese food"],
    price_range: "$$$"
  },
  {
    name: "Bamboo Coworking Space",
    description: "Modern coworking space with fast internet, meeting rooms, and coffee bar. Popular among digital nomads and local entrepreneurs.",
    category_id: "", // Will be filled in from database
    subcategory_id: "", // Will be filled in from database
    address: "156 Nguyễn Văn Linh, Nam Dương, Hải Châu, Da Nang",
    location: { latitude: 16.067, longitude: 108.214 },
    neighborhood: "Han Riverside",
    rating: 4.7,
    phone: "+84 236 3652 999",
    email: "hello@bamboocoworking.vn",
    website: "https://bamboocoworking.vn",
    logo_url: "/images/placeholder.svg",
    cover_image_url: "/images/placeholder.svg",
    is_featured: false,
    schedule: {
      monday: { open: "08:00", close: "20:00" },
      tuesday: { open: "08:00", close: "20:00" },
      wednesday: { open: "08:00", close: "20:00" },
      thursday: { open: "08:00", close: "20:00" },
      friday: { open: "08:00", close: "20:00" },
      saturday: { open: "09:00", close: "18:00" },
      sunday: { open: "09:00", close: "18:00" },
    },
    amenities: ["Free Wi-Fi", "Air Conditioning", "Meeting Rooms", "Coffee Bar", "Printing Services", "24/7 Access"],
    tags: ["coworking", "digital nomad", "workspace", "business", "startup", "freelancer"],
    price_range: "$$"
  },
  {
    name: "Xuan Spa & Wellness",
    description: "Luxury spa offering traditional Vietnamese and modern treatments. Specializes in herbal therapies and massages.",
    category_id: "", // Will be filled in from database
    subcategory_id: "", // Will be filled in from database
    address: "28 An Thượng 4, Mỹ An, Ngũ Hành Sơn, Da Nang",
    location: { latitude: 16.046, longitude: 108.242 },
    neighborhood: "My An Beach Area",
    rating: 4.8,
    phone: "+84 236 3942 333",
    email: "booking@xuanspa.vn",
    website: "https://xuanspa.vn",
    logo_url: "/images/placeholder.svg",
    cover_image_url: "/images/placeholder.svg",
    is_featured: false,
    schedule: {
      monday: { open: "10:00", close: "22:00" },
      tuesday: { open: "10:00", close: "22:00" },
      wednesday: { open: "10:00", close: "22:00" },
      thursday: { open: "10:00", close: "22:00" },
      friday: { open: "10:00", close: "22:00" },
      saturday: { open: "09:00", close: "22:00" },
      sunday: { open: "09:00", close: "22:00" },
    },
    amenities: ["Air Conditioning", "Shower Facilities", "Sauna", "Herbal Tea", "Aromatherapy"],
    tags: ["spa", "massage", "wellness", "relaxation", "beauty", "herbal treatments"],
    price_range: "$$$"
  },
  {
    name: "Da Nang Surf School",
    description: "Surf school offering lessons for all levels. Equipment rental and guided surf trips to nearby beaches.",
    category_id: "", // Will be filled in from database
    subcategory_id: "", // Will be filled in from database
    address: "68 Võ Nguyên Giáp, Mỹ An, Ngũ Hành Sơn, Da Nang",
    location: { latitude: 16.042, longitude: 108.246 },
    neighborhood: "My An Beach Area",
    rating: 4.6,
    phone: "+84 236 3924 123",
    email: "ride@danangsurfschool.com",
    website: "https://danangsurfschool.com",
    logo_url: "/images/placeholder.svg",
    cover_image_url: "/images/placeholder.svg",
    is_featured: false,
    schedule: {
      monday: { open: "08:00", close: "18:00" },
      tuesday: { open: "08:00", close: "18:00" },
      wednesday: { open: "08:00", close: "18:00" },
      thursday: { open: "08:00", close: "18:00" },
      friday: { open: "08:00", close: "18:00" },
      saturday: { open: "07:00", close: "19:00" },
      sunday: { open: "07:00", close: "19:00" },
    },
    amenities: ["Equipment Rental", "Changing Rooms", "Shower Facilities", "Locker Storage"],
    tags: ["surf", "lessons", "beach", "water sports", "rental", "outdoor activity"],
    price_range: "$$"
  },
  {
    name: "Linh Ung Pagoda",
    description: "Important Buddhist temple with the tallest Lady Buddha statue in Vietnam. Offers panoramic views of Da Nang and the ocean.",
    category_id: "", // Will be filled in from database
    subcategory_id: "", // Will be filled in from database
    address: "Son Tra Peninsula, Da Nang",
    location: { latitude: 16.100, longitude: 108.278 },
    neighborhood: "Son Tra Peninsula",
    rating: 4.9,
    phone: "+84 236 3924 888",
    email: "info@linhungpagoda.vn",
    website: "https://linhungpagoda.vn",
    logo_url: "/images/placeholder.svg",
    cover_image_url: "/images/placeholder.svg",
    is_featured: true,
    schedule: {
      monday: { open: "07:00", close: "18:00" },
      tuesday: { open: "07:00", close: "18:00" },
      wednesday: { open: "07:00", close: "18:00" },
      thursday: { open: "07:00", close: "18:00" },
      friday: { open: "07:00", close: "18:00" },
      saturday: { open: "07:00", close: "18:00" },
      sunday: { open: "07:00", close: "18:00" },
    },
    amenities: ["Parking", "Viewpoint", "Prayer Hall", "Gardens"],
    tags: ["temple", "buddhist", "religious site", "lady buddha", "cultural", "spiritual"],
    price_range: "Free"
  },
  {
    name: "Fusion Maia Resort",
    description: "Luxury all-villa resort with private pools and included spa treatments. Beachfront location with exceptional service.",
    category_id: "", // Will be filled in from database
    subcategory_id: "", // Will be filled in from database
    address: "Võ Nguyên Giáp, Mỹ An, Ngũ Hành Sơn, Da Nang",
    location: { latitude: 16.036, longitude: 108.248 },
    neighborhood: "My An Beach Area",
    rating: 4.9,
    phone: "+84 236 3967 999",
    email: "reservations@fusionmaiaresort.com",
    website: "https://fusionresorts.com/maia",
    logo_url: "/images/placeholder.svg",
    cover_image_url: "/images/placeholder.svg",
    is_featured: true,
    schedule: {
      monday: { open: "00:00", close: "23:59" },
      tuesday: { open: "00:00", close: "23:59" },
      wednesday: { open: "00:00", close: "23:59" },
      thursday: { open: "00:00", close: "23:59" },
      friday: { open: "00:00", close: "23:59" },
      saturday: { open: "00:00", close: "23:59" },
      sunday: { open: "00:00", close: "23:59" },
    },
    amenities: ["Private Pool", "Free Spa Treatments", "Beach Access", "Restaurant", "Fitness Center", "Yoga Classes", "Airport Transfer"],
    tags: ["luxury", "resort", "spa", "all-inclusive", "beachfront", "wellness", "villa"],
    price_range: "$$$$$"
  }
];

async function addSampleBusinesses() {
  try {
    console.log('Starting to add sample businesses for Da Nang...');

    // Get community ID for Da Nang
    const { data: communityData, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', 'da-nang')
      .single();

    if (communityError || !communityData) {
      throw new Error(`Could not find Da Nang community: ${communityError?.message || 'No community found'}`);
    }

    const communityId = communityData.id;
    console.log(`Found Da Nang community ID: ${communityId}`);

    // Get categories and subcategories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name');

    if (categoriesError || !categories) {
      throw new Error(`Error fetching categories: ${categoriesError?.message || 'No categories found'}`);
    }

    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('subcategories')
      .select('id, name, category_id');

    if (subcategoriesError || !subcategories) {
      throw new Error(`Error fetching subcategories: ${subcategoriesError?.message || 'No subcategories found'}`);
    }

    // Helper function to find category/subcategory IDs based on business type
    const findCategoryAndSubcategory = (businessName: string, businessTags: string[]) => {
      let categoryId = '';
      let subcategoryId = '';

      // Determine category and subcategory based on business type or tags
      if (businessName.includes('Cafe') || businessTags.includes('coffee') || businessTags.includes('cafe')) {
        const category = categories.find(c => c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('dining'));
        if (category) {
          categoryId = category.id;
          const subcategory = subcategories.find(s => 
            s.category_id === category.id && 
            (s.name.toLowerCase().includes('cafe') || s.name.toLowerCase().includes('coffee'))
          );
          if (subcategory) subcategoryId = subcategory.id;
        }
      } else if (businessName.includes('Restaurant') || businessTags.includes('restaurant') || businessTags.includes('dining')) {
        const category = categories.find(c => c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('dining'));
        if (category) {
          categoryId = category.id;
          const subcategory = subcategories.find(s => 
            s.category_id === category.id && 
            s.name.toLowerCase().includes('restaurant')
          );
          if (subcategory) subcategoryId = subcategory.id;
        }
      } else if (businessName.includes('Resort') || businessName.includes('Retreat') || businessTags.includes('accommodation')) {
        const category = categories.find(c => c.name.toLowerCase().includes('accommodation') || c.name.toLowerCase().includes('lodging'));
        if (category) {
          categoryId = category.id;
          const subcategory = subcategories.find(s => 
            s.category_id === category.id && 
            (s.name.toLowerCase().includes('resort') || s.name.toLowerCase().includes('hotel'))
          );
          if (subcategory) subcategoryId = subcategory.id;
        }
      } else if (businessTags.includes('spa') || businessTags.includes('wellness')) {
        const category = categories.find(c => c.name.toLowerCase().includes('health') || c.name.toLowerCase().includes('wellness'));
        if (category) {
          categoryId = category.id;
          const subcategory = subcategories.find(s => 
            s.category_id === category.id && 
            (s.name.toLowerCase().includes('spa') || s.name.toLowerCase().includes('wellness'))
          );
          if (subcategory) subcategoryId = subcategory.id;
        }
      } else if (businessTags.includes('coworking') || businessTags.includes('workspace')) {
        const category = categories.find(c => c.name.toLowerCase().includes('business') || c.name.toLowerCase().includes('service'));
        if (category) {
          categoryId = category.id;
          const subcategory = subcategories.find(s => 
            s.category_id === category.id && 
            (s.name.toLowerCase().includes('coworking') || s.name.toLowerCase().includes('office'))
          );
          if (subcategory) subcategoryId = subcategory.id;
        }
      } else if (businessTags.includes('surf') || businessTags.includes('water sports')) {
        const category = categories.find(c => c.name.toLowerCase().includes('activity') || c.name.toLowerCase().includes('recreation'));
        if (category) {
          categoryId = category.id;
          const subcategory = subcategories.find(s => 
            s.category_id === category.id && 
            (s.name.toLowerCase().includes('sport') || s.name.toLowerCase().includes('water'))
          );
          if (subcategory) subcategoryId = subcategory.id;
        }
      } else if (businessTags.includes('temple') || businessTags.includes('cultural')) {
        const category = categories.find(c => c.name.toLowerCase().includes('attraction') || c.name.toLowerCase().includes('sight'));
        if (category) {
          categoryId = category.id;
          const subcategory = subcategories.find(s => 
            s.category_id === category.id && 
            (s.name.toLowerCase().includes('culture') || s.name.toLowerCase().includes('temple'))
          );
          if (subcategory) subcategoryId = subcategory.id;
        }
      }

      // If no specific match found, use default categories
      if (!categoryId && categories.length > 0) {
        categoryId = categories[0].id;
      }
      if (!subcategoryId && subcategories.length > 0) {
        const categorySubcategories = subcategories.filter(s => s.category_id === categoryId);
        if (categorySubcategories.length > 0) {
          subcategoryId = categorySubcategories[0].id;
        }
      }

      return { categoryId, subcategoryId };
    };

    // Admin user for business listings
    const { data: adminUser, error: adminUserError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'community admin')
      .eq('community_id', communityId)
      .limit(1)
      .single();

    if (adminUserError || !adminUser) {
      throw new Error(`Could not find admin user: ${adminUserError?.message || 'No admin user found'}`);
    }

    const userId = adminUser.id;
    console.log(`Using admin user ID: ${userId}`);

    // Insert businesses
    for (const business of danangBusinesses) {
      // Find appropriate category and subcategory
      const { categoryId, subcategoryId } = findCategoryAndSubcategory(business.name, business.tags);
      business.category_id = categoryId;
      business.subcategory_id = subcategoryId;

      // Convert location to separate latitude and longitude
      const latitude = business.location.latitude;
      const longitude = business.location.longitude;

      // Insert business
      const { data: insertedBusiness, error: insertError } = await supabase
        .from('businesses')
        .insert({
          name: business.name,
          description: business.description,
          category_id: business.category_id,
          subcategory_id: business.subcategory_id,
          address: business.address,
          latitude,
          longitude,
          neighborhood: business.neighborhood,
          phone: business.phone,
          email: business.email,
          website: business.website,
          logo_url: business.logo_url,
          cover_url: business.cover_image_url, // Use the correct column name
          is_featured: business.is_featured,
          schedule: business.schedule,
          amenities: business.amenities,
          tags: business.tags,
          community_id: communityId,
          user_id: userId,
          approval_status: 'approved', // Auto-approve sample businesses
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, name')
        .single();

      if (insertError) {
        console.error(`Error inserting business ${business.name}:`, insertError);
      } else {
        console.log(`Added business: ${insertedBusiness.name} (ID: ${insertedBusiness.id})`);
      }
    }

    console.log('Finished adding sample businesses for Da Nang');
  } catch (error) {
    console.error('Error in addSampleBusinesses:', error);
  }
}

// Execute the function
addSampleBusinesses(); 