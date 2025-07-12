// Da Nang neighborhoods with accurate location data
// Each neighborhood includes coordinates (latitude, longitude) and a brief description

export interface Neighborhood {
  id: string;
  name: {
    en: string;
    vi: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description: {
    en: string;
    vi: string;
  };
  popularityScore: number; // 1-10 scale for sorting popular neighborhoods
  district?: string; // Administrative district
}

export const danangNeighborhoods: Neighborhood[] = [
  {
    id: "my-khe",
    name: {
      en: "My Khe Beach",
      vi: "Biển Mỹ Khê"
    },
    coordinates: {
      latitude: 16.0598,
      longitude: 108.2467
    },
    description: {
      en: "Famous beach area with resorts, restaurants and water activities",
      vi: "Khu vực biển nổi tiếng với các khu nghỉ dưỡng, nhà hàng và hoạt động dưới nước"
    },
    popularityScore: 10,
    district: "Son Tra"
  },
  {
    id: "an-thuong",
    name: {
      en: "An Thuong Area",
      vi: "Khu vực An Thượng"
    },
    coordinates: {
      latitude: 16.0559,
      longitude: 108.2435
    },
    description: {
      en: "Popular tourist area with many restaurants, bars and hotels",
      vi: "Khu du lịch phổ biến với nhiều nhà hàng, quán bar và khách sạn"
    },
    popularityScore: 9,
    district: "Ngu Hanh Son"
  },
  {
    id: "han-riverside",
    name: {
      en: "Han Riverside",
      vi: "Bờ sông Hàn"
    },
    coordinates: {
      latitude: 16.0717,
      longitude: 108.2262
    },
    description: {
      en: "Scenic area along the Han River with parks, cafes and the Dragon Bridge",
      vi: "Khu vực đẹp dọc theo sông Hàn với công viên, quán cà phê và Cầu Rồng"
    },
    popularityScore: 9,
    district: "Hai Chau"
  },
  {
    id: "son-tra",
    name: {
      en: "Son Tra Peninsula",
      vi: "Bán đảo Sơn Trà"
    },
    coordinates: {
      latitude: 16.1059,
      longitude: 108.2613
    },
    description: {
      en: "Nature reserve with mountains, beaches and the Lady Buddha statue",
      vi: "Khu bảo tồn thiên nhiên với núi, biển và tượng Phật Bà"
    },
    popularityScore: 8,
    district: "Son Tra"
  },
  {
    id: "hai-chau",
    name: {
      en: "Hai Chau",
      vi: "Hải Châu"
    },
    coordinates: {
      latitude: 16.0678,
      longitude: 108.2144
    },
    description: {
      en: "Central business district with shopping malls, offices and government buildings",
      vi: "Khu trung tâm thương mại với trung tâm mua sắm, văn phòng và các tòa nhà chính phủ"
    },
    popularityScore: 8,
    district: "Hai Chau"
  },
  {
    id: "thanh-khe",
    name: {
      en: "Thanh Khe",
      vi: "Thanh Khê"
    },
    coordinates: {
      latitude: 16.0713,
      longitude: 108.1944
    },
    description: {
      en: "Residential district with local markets and authentic Vietnamese atmosphere",
      vi: "Quận dân cư với chợ địa phương và không khí Việt Nam đích thực"
    },
    popularityScore: 6,
    district: "Thanh Khe"
  },
  {
    id: "ngu-hanh-son",
    name: {
      en: "Ngu Hanh Son",
      vi: "Ngũ Hành Sơn"
    },
    coordinates: {
      latitude: 16.0218,
      longitude: 108.2566
    },
    description: {
      en: "Area around the Marble Mountains with temples, caves and stone carving villages",
      vi: "Khu vực xung quanh Ngũ Hành Sơn với đền chùa, hang động và làng đá mỹ nghệ"
    },
    popularityScore: 8,
    district: "Ngu Hanh Son"
  },
  {
    id: "lien-chieu",
    name: {
      en: "Lien Chieu",
      vi: "Liên Chiểu"
    },
    coordinates: {
      latitude: 16.0763,
      longitude: 108.1416
    },
    description: {
      en: "Developing district with industrial zones and Nam O Beach",
      vi: "Quận đang phát triển với các khu công nghiệp và biển Nam Ô"
    },
    popularityScore: 5,
    district: "Lien Chieu"
  },
  {
    id: "cam-le",
    name: {
      en: "Cam Le",
      vi: "Cẩm Lệ"
    },
    coordinates: {
      latitude: 16.0151,
      longitude: 108.2094
    },
    description: {
      en: "Southern district with residential areas and the new administrative center",
      vi: "Quận phía nam với khu dân cư và trung tâm hành chính mới"
    },
    popularityScore: 5,
    district: "Cam Le"
  },
  {
    id: "hoa-khanh",
    name: {
      en: "Hoa Khanh",
      vi: "Hòa Khánh"
    },
    coordinates: {
      latitude: 16.0671,
      longitude: 108.1693
    },
    description: {
      en: "Area with universities, industrial zones and affordable housing",
      vi: "Khu vực với các trường đại học, khu công nghiệp và nhà ở giá cả phải chăng"
    },
    popularityScore: 6,
    district: "Lien Chieu"
  },
  {
    id: "my-an",
    name: {
      en: "My An",
      vi: "Mỹ An"
    },
    coordinates: {
      latitude: 16.0467,
      longitude: 108.2417
    },
    description: {
      en: "Beachside neighborhood with many hotels, restaurants and expat community",
      vi: "Khu phố ven biển với nhiều khách sạn, nhà hàng và cộng đồng người nước ngoài"
    },
    popularityScore: 9,
    district: "Ngu Hanh Son"
  },
  {
    id: "an-hai",
    name: {
      en: "An Hai",
      vi: "An Hải"
    },
    coordinates: {
      latitude: 16.0614,
      longitude: 108.2329
    },
    description: {
      en: "Residential area between the city center and the beaches",
      vi: "Khu dân cư giữa trung tâm thành phố và các bãi biển"
    },
    popularityScore: 7,
    district: "Son Tra"
  },
  {
    id: "nam-duong",
    name: {
      en: "Nam Duong",
      vi: "Nam Dương"
    },
    coordinates: {
      latitude: 16.0597,
      longitude: 108.2193
    },
    description: {
      en: "Central area with shopping streets and local markets",
      vi: "Khu vực trung tâm với các con phố mua sắm và chợ địa phương"
    },
    popularityScore: 7,
    district: "Hai Chau"
  },
  {
    id: "non-nuoc",
    name: {
      en: "Non Nuoc Beach",
      vi: "Biển Non Nước"
    },
    coordinates: {
      latitude: 16.0024,
      longitude: 108.2649
    },
    description: {
      en: "Long beach with luxury resorts and golf courses",
      vi: "Bãi biển dài với các khu nghỉ dưỡng sang trọng và sân golf"
    },
    popularityScore: 8,
    district: "Ngu Hanh Son"
  },
  {
    id: "hoa-cuong",
    name: {
      en: "Hoa Cuong",
      vi: "Hòa Cường"
    },
    coordinates: {
      latitude: 16.0336,
      longitude: 108.2229
    },
    description: {
      en: "Southern area with residential neighborhoods and local businesses",
      vi: "Khu vực phía nam với các khu dân cư và doanh nghiệp địa phương"
    },
    popularityScore: 6,
    district: "Hai Chau"
  }
];

// Get neighborhoods sorted by popularity
export const getPopularNeighborhoods = (limit?: number): Neighborhood[] => {
  const sorted = [...danangNeighborhoods].sort((a, b) => b.popularityScore - a.popularityScore);
  return limit ? sorted.slice(0, limit) : sorted;
};

// Get neighborhoods by district
export const getNeighborhoodsByDistrict = (district: string): Neighborhood[] => {
  return danangNeighborhoods.filter(n => n.district?.toLowerCase() === district.toLowerCase());
};

// Get neighborhood by ID
export const getNeighborhoodById = (id: string): Neighborhood | undefined => {
  return danangNeighborhoods.find(n => n.id === id);
};

// Get all district names
export const getAllDistricts = (): string[] => {
  const districts = danangNeighborhoods
    .map(n => n.district)
    .filter((value, index, self) => value && self.indexOf(value) === index) as string[];
  return districts;
}; 