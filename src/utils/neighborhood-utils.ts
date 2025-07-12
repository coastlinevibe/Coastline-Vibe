import { danangNeighborhoods, Neighborhood } from '@/data/danang-neighborhoods';

/**
 * Attempts to match a text address or neighborhood name to a neighborhood ID
 * @param text The address or neighborhood text to match
 * @returns The matched neighborhood ID or undefined if no match found
 */
export function matchNeighborhoodFromText(text: string): string | undefined {
  if (!text) return undefined;
  
  const normalizedText = text.toLowerCase();
  
  // First try direct ID match
  const directMatch = danangNeighborhoods.find(
    n => n.id.toLowerCase() === normalizedText
  );
  if (directMatch) return directMatch.id;
  
  // Try name match (both English and Vietnamese)
  const nameMatch = danangNeighborhoods.find(
    n => n.name.en.toLowerCase().includes(normalizedText) || 
         n.name.vi.toLowerCase().includes(normalizedText)
  );
  if (nameMatch) return nameMatch.id;
  
  // Try district match
  const districtMatch = danangNeighborhoods.find(
    n => n.district?.toLowerCase().includes(normalizedText)
  );
  if (districtMatch) return districtMatch.id;
  
  // Try keyword matching in descriptions
  const descriptionMatch = danangNeighborhoods.find(
    n => n.description.en.toLowerCase().includes(normalizedText) || 
         n.description.vi.toLowerCase().includes(normalizedText)
  );
  if (descriptionMatch) return descriptionMatch.id;
  
  return undefined;
}

/**
 * Gets the district for a given neighborhood ID
 * @param neighborhoodId The neighborhood ID
 * @returns The district name or undefined if not found
 */
export function getDistrictForNeighborhood(neighborhoodId: string): string | undefined {
  const neighborhood = danangNeighborhoods.find(n => n.id === neighborhoodId);
  return neighborhood?.district;
}

/**
 * Gets the coordinates for a given neighborhood ID
 * @param neighborhoodId The neighborhood ID
 * @returns The coordinates or undefined if not found
 */
export function getCoordinatesForNeighborhood(neighborhoodId: string): { latitude: number; longitude: number } | undefined {
  const neighborhood = danangNeighborhoods.find(n => n.id === neighborhoodId);
  return neighborhood?.coordinates;
}

/**
 * Gets the neighborhood name in the specified language
 * @param neighborhoodId The neighborhood ID
 * @param language The language code ('en' or 'vi')
 * @returns The localized name or the ID if not found
 */
export function getLocalizedNeighborhoodName(neighborhoodId: string, language: string = 'en'): string {
  const neighborhood = danangNeighborhoods.find(n => n.id === neighborhoodId);
  if (!neighborhood) return neighborhoodId;
  
  return language === 'vi' ? neighborhood.name.vi : neighborhood.name.en;
}

/**
 * Finds nearby neighborhoods based on coordinates and radius
 * @param latitude The latitude
 * @param longitude The longitude
 * @param radiusKm The radius in kilometers
 * @returns Array of neighborhoods within the radius
 */
export function findNearbyNeighborhoods(
  latitude: number, 
  longitude: number, 
  radiusKm: number = 2
): Neighborhood[] {
  // Simple distance calculation using the Haversine formula
  function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  return danangNeighborhoods.filter(neighborhood => {
    const distance = getDistanceInKm(
      latitude, 
      longitude, 
      neighborhood.coordinates.latitude, 
      neighborhood.coordinates.longitude
    );
    return distance <= radiusKm;
  });
} 