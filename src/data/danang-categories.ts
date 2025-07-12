// Da Nang specific categories and subcategories with translations
// This file provides data structures for the categories and subcategories
// that are specific to Da Nang's market

export interface Category {
  id: string;
  name: {
    en: string;
    vi: string;
  };
  icon?: string; // Optional icon identifier
  popularityScore: number; // 1-10 scale for sorting popular categories
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: {
    en: string;
    vi: string;
  };
  categoryId: string;
  popularityScore: number; // 1-10 scale for sorting popular subcategories
}

export const danangCategories: Category[] = [
  {
    id: 'food-beverage',
    name: {
      en: 'Food & Beverage',
      vi: 'Ẩm thực & Đồ uống'
    },
    icon: 'restaurant',
    popularityScore: 10,
    subcategories: [
      {
        id: 'vietnamese-cuisine',
        name: {
          en: 'Vietnamese Cuisine',
          vi: 'Ẩm thực Việt Nam'
        },
        categoryId: 'food-beverage',
        popularityScore: 10
      },
      {
        id: 'seafood',
        name: {
          en: 'Seafood Restaurants',
          vi: 'Nhà hàng Hải sản'
        },
        categoryId: 'food-beverage',
        popularityScore: 9
      },
      {
        id: 'coffee-shops',
        name: {
          en: 'Coffee Shops & Cafes',
          vi: 'Quán Cà phê'
        },
        categoryId: 'food-beverage',
        popularityScore: 9
      },
      {
        id: 'street-food',
        name: {
          en: 'Street Food Vendors',
          vi: 'Đồ ăn Đường phố'
        },
        categoryId: 'food-beverage',
        popularityScore: 8
      },
      {
        id: 'international-cuisine',
        name: {
          en: 'International Cuisine',
          vi: 'Ẩm thực Quốc tế'
        },
        categoryId: 'food-beverage',
        popularityScore: 7
      },
      {
        id: 'bakeries',
        name: {
          en: 'Bakeries & Desserts',
          vi: 'Tiệm Bánh & Tráng miệng'
        },
        categoryId: 'food-beverage',
        popularityScore: 6
      },
      {
        id: 'vegetarian',
        name: {
          en: 'Vegetarian & Vegan',
          vi: 'Đồ ăn Chay'
        },
        categoryId: 'food-beverage',
        popularityScore: 5
      },
      {
        id: 'bars-pubs',
        name: {
          en: 'Bars & Pubs',
          vi: 'Quán Bar & Pub'
        },
        categoryId: 'food-beverage',
        popularityScore: 7
      },
      {
        id: 'food-delivery',
        name: {
          en: 'Food Delivery Services',
          vi: 'Dịch vụ Giao đồ ăn'
        },
        categoryId: 'food-beverage',
        popularityScore: 6
      }
    ]
  },
  {
    id: 'accommodation',
    name: {
      en: 'Accommodation',
      vi: 'Chỗ ở'
    },
    icon: 'hotel',
    popularityScore: 9,
    subcategories: [
      {
        id: 'beachfront-resorts',
        name: {
          en: 'Beachfront Resorts',
          vi: 'Khu nghỉ dưỡng Biển'
        },
        categoryId: 'accommodation',
        popularityScore: 9
      },
      {
        id: 'boutique-hotels',
        name: {
          en: 'Boutique Hotels',
          vi: 'Khách sạn Boutique'
        },
        categoryId: 'accommodation',
        popularityScore: 7
      },
      {
        id: 'budget-hostels',
        name: {
          en: 'Budget Hostels',
          vi: 'Nhà nghỉ Giá rẻ'
        },
        categoryId: 'accommodation',
        popularityScore: 8
      },
      {
        id: 'vacation-rentals',
        name: {
          en: 'Vacation Rentals',
          vi: 'Cho thuê Kỳ nghỉ'
        },
        categoryId: 'accommodation',
        popularityScore: 7
      },
      {
        id: 'homestays',
        name: {
          en: 'Homestays',
          vi: 'Homestay'
        },
        categoryId: 'accommodation',
        popularityScore: 8
      },
      {
        id: 'serviced-apartments',
        name: {
          en: 'Serviced Apartments',
          vi: 'Căn hộ Dịch vụ'
        },
        categoryId: 'accommodation',
        popularityScore: 6
      },
      {
        id: 'luxury-hotels',
        name: {
          en: 'Luxury Hotels',
          vi: 'Khách sạn Cao cấp'
        },
        categoryId: 'accommodation',
        popularityScore: 7
      },
      {
        id: 'family-resorts',
        name: {
          en: 'Family Resorts',
          vi: 'Khu nghỉ dưỡng Gia đình'
        },
        categoryId: 'accommodation',
        popularityScore: 6
      }
    ]
  },
  {
    id: 'tourism',
    name: {
      en: 'Tourism & Attractions',
      vi: 'Du lịch & Điểm tham quan'
    },
    icon: 'attraction',
    popularityScore: 9,
    subcategories: [
      {
        id: 'beaches',
        name: {
          en: 'Beaches',
          vi: 'Bãi biển'
        },
        categoryId: 'tourism',
        popularityScore: 10
      },
      {
        id: 'landmarks',
        name: {
          en: 'Landmarks & Monuments',
          vi: 'Địa danh & Di tích'
        },
        categoryId: 'tourism',
        popularityScore: 8
      },
      {
        id: 'museums',
        name: {
          en: 'Museums & Galleries',
          vi: 'Bảo tàng & Phòng trưng bày'
        },
        categoryId: 'tourism',
        popularityScore: 6
      },
      {
        id: 'nature-parks',
        name: {
          en: 'Nature & Parks',
          vi: 'Thiên nhiên & Công viên'
        },
        categoryId: 'tourism',
        popularityScore: 7
      },
      {
        id: 'adventure-activities',
        name: {
          en: 'Adventure Activities',
          vi: 'Hoạt động Mạo hiểm'
        },
        categoryId: 'tourism',
        popularityScore: 8
      },
      {
        id: 'boat-tours',
        name: {
          en: 'Boat Tours & Water Sports',
          vi: 'Tour Thuyền & Thể thao Dưới nước'
        },
        categoryId: 'tourism',
        popularityScore: 9
      },
      {
        id: 'day-trips',
        name: {
          en: 'Day Trips & Excursions',
          vi: 'Tour Ngày & Chuyến đi'
        },
        categoryId: 'tourism',
        popularityScore: 8
      },
      {
        id: 'cultural-sites',
        name: {
          en: 'Cultural Sites',
          vi: 'Địa điểm Văn hóa'
        },
        categoryId: 'tourism',
        popularityScore: 7
      },
      {
        id: 'eco-tourism',
        name: {
          en: 'Eco Tourism',
          vi: 'Du lịch Sinh thái'
        },
        categoryId: 'tourism',
        popularityScore: 6
      }
    ]
  },
  {
    id: 'shopping',
    name: {
      en: 'Shopping & Retail',
      vi: 'Mua sắm & Bán lẻ'
    },
    icon: 'shopping',
    popularityScore: 7,
    subcategories: [
      {
        id: 'markets',
        name: {
          en: 'Local Markets',
          vi: 'Chợ Địa phương'
        },
        categoryId: 'shopping',
        popularityScore: 9
      },
      {
        id: 'souvenir-shops',
        name: {
          en: 'Souvenir & Gift Shops',
          vi: 'Cửa hàng Quà lưu niệm'
        },
        categoryId: 'shopping',
        popularityScore: 8
      },
      {
        id: 'malls',
        name: {
          en: 'Shopping Malls',
          vi: 'Trung tâm Mua sắm'
        },
        categoryId: 'shopping',
        popularityScore: 7
      },
      {
        id: 'fashion-clothing',
        name: {
          en: 'Fashion & Clothing',
          vi: 'Thời trang & Quần áo'
        },
        categoryId: 'shopping',
        popularityScore: 6
      },
      {
        id: 'handicrafts',
        name: {
          en: 'Handicrafts & Artisan Goods',
          vi: 'Đồ thủ công & Hàng thủ công mỹ nghệ'
        },
        categoryId: 'shopping',
        popularityScore: 7
      },
      {
        id: 'electronics',
        name: {
          en: 'Electronics & Tech',
          vi: 'Điện tử & Công nghệ'
        },
        categoryId: 'shopping',
        popularityScore: 5
      },
      {
        id: 'specialty-stores',
        name: {
          en: 'Specialty Stores',
          vi: 'Cửa hàng Chuyên dụng'
        },
        categoryId: 'shopping',
        popularityScore: 5
      },
      {
        id: 'convenience-stores',
        name: {
          en: 'Convenience Stores',
          vi: 'Cửa hàng Tiện lợi'
        },
        categoryId: 'shopping',
        popularityScore: 6
      }
    ]
  },
  {
    id: 'services',
    name: {
      en: 'Local Services',
      vi: 'Dịch vụ Địa phương'
    },
    icon: 'services',
    popularityScore: 6,
    subcategories: [
      {
        id: 'laundry',
        name: {
          en: 'Laundry & Dry Cleaning',
          vi: 'Giặt ủi & Giặt khô'
        },
        categoryId: 'services',
        popularityScore: 7
      },
      {
        id: 'banking',
        name: {
          en: 'Banking & Currency Exchange',
          vi: 'Ngân hàng & Đổi tiền'
        },
        categoryId: 'services',
        popularityScore: 8
      },
      {
        id: 'postal',
        name: {
          en: 'Postal & Shipping',
          vi: 'Bưu điện & Vận chuyển'
        },
        categoryId: 'services',
        popularityScore: 6
      },
      {
        id: 'telecom',
        name: {
          en: 'Telecom & Internet',
          vi: 'Viễn thông & Internet'
        },
        categoryId: 'services',
        popularityScore: 7
      },
      {
        id: 'repair-services',
        name: {
          en: 'Repair Services',
          vi: 'Dịch vụ Sửa chữa'
        },
        categoryId: 'services',
        popularityScore: 6
      },
      {
        id: 'cleaning-services',
        name: {
          en: 'Cleaning Services',
          vi: 'Dịch vụ Vệ sinh'
        },
        categoryId: 'services',
        popularityScore: 5
      },
      {
        id: 'event-services',
        name: {
          en: 'Event Services',
          vi: 'Dịch vụ Sự kiện'
        },
        categoryId: 'services',
        popularityScore: 5
      },
      {
        id: 'rental-services',
        name: {
          en: 'Rental Services',
          vi: 'Dịch vụ Cho thuê'
        },
        categoryId: 'services',
        popularityScore: 7
      },
      {
        id: 'business-services',
        name: {
          en: 'Business Services',
          vi: 'Dịch vụ Doanh nghiệp'
        },
        categoryId: 'services',
        popularityScore: 5
      }
    ]
  },
  {
    id: 'wellness',
    name: {
      en: 'Health & Wellness',
      vi: 'Sức khỏe & Làm đẹp'
    },
    icon: 'wellness',
    popularityScore: 7,
    subcategories: [
      {
        id: 'spas',
        name: {
          en: 'Spas & Massage',
          vi: 'Spa & Massage'
        },
        categoryId: 'wellness',
        popularityScore: 9
      },
      {
        id: 'yoga-studios',
        name: {
          en: 'Yoga & Meditation',
          vi: 'Yoga & Thiền'
        },
        categoryId: 'wellness',
        popularityScore: 7
      },
      {
        id: 'fitness-centers',
        name: {
          en: 'Fitness Centers',
          vi: 'Trung tâm Thể dục'
        },
        categoryId: 'wellness',
        popularityScore: 6
      },
      {
        id: 'beauty-salons',
        name: {
          en: 'Beauty Salons',
          vi: 'Salon Làm đẹp'
        },
        categoryId: 'wellness',
        popularityScore: 8
      },
      {
        id: 'medical-clinics',
        name: {
          en: 'Medical Clinics',
          vi: 'Phòng khám Y tế'
        },
        categoryId: 'wellness',
        popularityScore: 7
      },
      {
        id: 'pharmacies',
        name: {
          en: 'Pharmacies',
          vi: 'Nhà thuốc'
        },
        categoryId: 'wellness',
        popularityScore: 7
      },
      {
        id: 'traditional-medicine',
        name: {
          en: 'Traditional Medicine',
          vi: 'Y học Cổ truyền'
        },
        categoryId: 'wellness',
        popularityScore: 6
      },
      {
        id: 'wellness-retreats',
        name: {
          en: 'Wellness Retreats',
          vi: 'Khu nghỉ dưỡng Sức khỏe'
        },
        categoryId: 'wellness',
        popularityScore: 5
      }
    ]
  },
  {
    id: 'education',
    name: {
      en: 'Education & Training',
      vi: 'Giáo dục & Đào tạo'
    },
    icon: 'education',
    popularityScore: 5,
    subcategories: [
      {
        id: 'language-schools',
        name: {
          en: 'Language Schools',
          vi: 'Trường Ngoại ngữ'
        },
        categoryId: 'education',
        popularityScore: 8
      },
      {
        id: 'cooking-classes',
        name: {
          en: 'Cooking Classes',
          vi: 'Lớp học Nấu ăn'
        },
        categoryId: 'education',
        popularityScore: 7
      },
      {
        id: 'art-classes',
        name: {
          en: 'Art & Craft Classes',
          vi: 'Lớp học Nghệ thuật & Thủ công'
        },
        categoryId: 'education',
        popularityScore: 6
      },
      {
        id: 'dance-schools',
        name: {
          en: 'Dance Schools',
          vi: 'Trường Khiêu vũ'
        },
        categoryId: 'education',
        popularityScore: 5
      },
      {
        id: 'vocational-training',
        name: {
          en: 'Vocational Training',
          vi: 'Đào tạo Nghề'
        },
        categoryId: 'education',
        popularityScore: 6
      },
      {
        id: 'tutoring-services',
        name: {
          en: 'Tutoring Services',
          vi: 'Dịch vụ Gia sư'
        },
        categoryId: 'education',
        popularityScore: 6
      },
      {
        id: 'educational-centers',
        name: {
          en: 'Educational Centers',
          vi: 'Trung tâm Giáo dục'
        },
        categoryId: 'education',
        popularityScore: 7
      }
    ]
  },
  {
    id: 'nightlife',
    name: {
      en: 'Nightlife & Entertainment',
      vi: 'Giải trí về Đêm'
    },
    icon: 'nightlife',
    popularityScore: 7,
    subcategories: [
      {
        id: 'nightclubs',
        name: {
          en: 'Nightclubs',
          vi: 'Câu lạc bộ Đêm'
        },
        categoryId: 'nightlife',
        popularityScore: 8
      },
      {
        id: 'karaoke',
        name: {
          en: 'Karaoke',
          vi: 'Karaoke'
        },
        categoryId: 'nightlife',
        popularityScore: 9
      },
      {
        id: 'live-music',
        name: {
          en: 'Live Music Venues',
          vi: 'Địa điểm Nhạc sống'
        },
        categoryId: 'nightlife',
        popularityScore: 7
      },
      {
        id: 'beach-clubs',
        name: {
          en: 'Beach Clubs',
          vi: 'Câu lạc bộ Biển'
        },
        categoryId: 'nightlife',
        popularityScore: 8
      },
      {
        id: 'rooftop-bars',
        name: {
          en: 'Rooftop Bars',
          vi: 'Quán Bar Trên sân thượng'
        },
        categoryId: 'nightlife',
        popularityScore: 8
      },
      {
        id: 'cinema',
        name: {
          en: 'Cinema & Theaters',
          vi: 'Rạp Chiếu phim & Nhà hát'
        },
        categoryId: 'nightlife',
        popularityScore: 7
      },
      {
        id: 'gaming',
        name: {
          en: 'Gaming & Arcades',
          vi: 'Trò chơi & Khu vui chơi'
        },
        categoryId: 'nightlife',
        popularityScore: 6
      }
    ]
  },
  {
    id: 'transportation',
    name: {
      en: 'Transportation',
      vi: 'Giao thông Vận tải'
    },
    icon: 'transportation',
    popularityScore: 8,
    subcategories: [
      {
        id: 'taxis',
        name: {
          en: 'Taxis & Ride Services',
          vi: 'Taxi & Dịch vụ Đi xe'
        },
        categoryId: 'transportation',
        popularityScore: 9
      },
      {
        id: 'motorbike-rental',
        name: {
          en: 'Motorbike Rental',
          vi: 'Cho thuê Xe máy'
        },
        categoryId: 'transportation',
        popularityScore: 10
      },
      {
        id: 'car-rental',
        name: {
          en: 'Car Rental',
          vi: 'Cho thuê Ô tô'
        },
        categoryId: 'transportation',
        popularityScore: 8
      },
      {
        id: 'airport-transfers',
        name: {
          en: 'Airport Transfers',
          vi: 'Đưa đón Sân bay'
        },
        categoryId: 'transportation',
        popularityScore: 9
      },
      {
        id: 'bicycle-rental',
        name: {
          en: 'Bicycle Rental',
          vi: 'Cho thuê Xe đạp'
        },
        categoryId: 'transportation',
        popularityScore: 7
      },
      {
        id: 'bus-services',
        name: {
          en: 'Bus Services',
          vi: 'Dịch vụ Xe buýt'
        },
        categoryId: 'transportation',
        popularityScore: 6
      },
      {
        id: 'boat-transportation',
        name: {
          en: 'Boat Transportation',
          vi: 'Giao thông Đường thủy'
        },
        categoryId: 'transportation',
        popularityScore: 7
      },
      {
        id: 'tour-transportation',
        name: {
          en: 'Tour Transportation',
          vi: 'Phương tiện Tour'
        },
        categoryId: 'transportation',
        popularityScore: 8
      }
    ]
  },
  {
    id: 'cultural',
    name: {
      en: 'Cultural & Arts',
      vi: 'Văn hóa & Nghệ thuật'
    },
    icon: 'cultural',
    popularityScore: 6,
    subcategories: [
      {
        id: 'art-galleries',
        name: {
          en: 'Art Galleries',
          vi: 'Phòng trưng bày Nghệ thuật'
        },
        categoryId: 'cultural',
        popularityScore: 6
      },
      {
        id: 'theaters',
        name: {
          en: 'Theaters & Performance Venues',
          vi: 'Nhà hát & Địa điểm Biểu diễn'
        },
        categoryId: 'cultural',
        popularityScore: 5
      },
      {
        id: 'cultural-centers',
        name: {
          en: 'Cultural Centers',
          vi: 'Trung tâm Văn hóa'
        },
        categoryId: 'cultural',
        popularityScore: 6
      },
      {
        id: 'historical-sites',
        name: {
          en: 'Historical Sites',
          vi: 'Di tích Lịch sử'
        },
        categoryId: 'cultural',
        popularityScore: 7
      },
      {
        id: 'religious-sites',
        name: {
          en: 'Religious Sites',
          vi: 'Địa điểm Tôn giáo'
        },
        categoryId: 'cultural',
        popularityScore: 7
      },
      {
        id: 'workshops',
        name: {
          en: 'Workshops & Studios',
          vi: 'Xưởng & Studio'
        },
        categoryId: 'cultural',
        popularityScore: 5
      },
      {
        id: 'festivals-events',
        name: {
          en: 'Festivals & Events',
          vi: 'Lễ hội & Sự kiện'
        },
        categoryId: 'cultural',
        popularityScore: 8
      }
    ]
  }
];

// Helper functions for working with categories and subcategories

/**
 * Get all categories
 * @returns Array of all categories
 */
export function getAllCategories(): Category[] {
  return danangCategories;
}

/**
 * Get a category by ID
 * @param categoryId The category ID
 * @returns The category or undefined if not found
 */
export function getCategoryById(categoryId: string): Category | undefined {
  return danangCategories.find(category => category.id === categoryId);
}

/**
 * Get all subcategories for a specific category
 * @param categoryId The category ID
 * @returns Array of subcategories for the specified category
 */
export function getSubcategoriesByCategoryId(categoryId: string): Subcategory[] {
  const category = getCategoryById(categoryId);
  return category ? category.subcategories : [];
}

/**
 * Get a subcategory by ID
 * @param subcategoryId The subcategory ID
 * @returns The subcategory or undefined if not found
 */
export function getSubcategoryById(subcategoryId: string): Subcategory | undefined {
  for (const category of danangCategories) {
    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
    if (subcategory) return subcategory;
  }
  return undefined;
}

/**
 * Get popular categories
 * @param limit Maximum number of categories to return
 * @returns Array of popular categories sorted by popularity score
 */
export function getPopularCategories(limit?: number): Category[] {
  const sortedCategories = [...danangCategories].sort(
    (a, b) => b.popularityScore - a.popularityScore
  );
  return limit ? sortedCategories.slice(0, limit) : sortedCategories;
}

/**
 * Get popular subcategories across all categories
 * @param limit Maximum number of subcategories to return
 * @returns Array of popular subcategories sorted by popularity score
 */
export function getPopularSubcategories(limit?: number): Subcategory[] {
  const allSubcategories: Subcategory[] = [];
  danangCategories.forEach(category => {
    allSubcategories.push(...category.subcategories);
  });
  
  const sortedSubcategories = [...allSubcategories].sort(
    (a, b) => b.popularityScore - a.popularityScore
  );
  return limit ? sortedSubcategories.slice(0, limit) : sortedSubcategories;
}

/**
 * Get localized category name
 * @param categoryId The category ID
 * @param language The language code ('en' or 'vi')
 * @returns The localized category name or the ID if not found
 */
export function getLocalizedCategoryName(categoryId: string, language: string = 'en'): string {
  const category = getCategoryById(categoryId);
  if (!category) return categoryId;
  
  return language === 'vi' ? category.name.vi : category.name.en;
}

/**
 * Get localized subcategory name
 * @param subcategoryId The subcategory ID
 * @param language The language code ('en' or 'vi')
 * @returns The localized subcategory name or the ID if not found
 */
export function getLocalizedSubcategoryName(subcategoryId: string, language: string = 'en'): string {
  const subcategory = getSubcategoryById(subcategoryId);
  if (!subcategory) return subcategoryId;
  
  return language === 'vi' ? subcategory.name.vi : subcategory.name.en;
} 