import axios from 'axios';
import { Location } from '../types/news';

// Dutch region translations and corrections
const REGION_TRANSLATIONS: { [key: string]: string } = {
  'South Holland': 'Zuid-Holland',
  'North Holland': 'Noord-Holland',
  'North Brabant': 'Noord-Brabant',
  'Gelderland': 'Gelderland',
  'Utrecht': 'Utrecht',
  'Overijssel': 'Overijssel',
  'Limburg': 'Limburg',
  'Friesland': 'Friesland',
  'Groningen': 'Groningen',
  'Drenthe': 'Drenthe',
  'Zeeland': 'Zeeland',
  'Flevoland': 'Flevoland'
};

// City to region mapping for edge cases
const CITY_REGION_MAPPING: { [key: string]: string } = {
  'zevenbergen': 'Noord-Brabant',
  'moerdijk': 'Noord-Brabant',
  'klundert': 'Noord-Brabant',
  'willemstad': 'Noord-Brabant',
  'standdaarbuiten': 'Noord-Brabant',
  'zevenbergschen hoek': 'Noord-Brabant',
  'langeweg': 'Noord-Brabant'
};

// Constants
const REGION_MAPPING: { [key: string]: string } = {
  'zevenbergen': 'Noord-Brabant',
  'langeweg': 'Noord-Brabant'
};

// Function to get user's location using browser's Geolocation API
export const getUserLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

// Helper function to translate and correct region names
const translateRegion = (region: string, city: string): string => {
  // First check if we have a specific mapping for this city
  const cityLower = city.toLowerCase();
  if (CITY_REGION_MAPPING[cityLower]) {
    return CITY_REGION_MAPPING[cityLower];
  }
  
  // Then try to translate the region name
  return REGION_TRANSLATIONS[region] || region;
};

// Function to get nearby cities
const getNearbyCity = async (lat: number, lon: number): Promise<string[]> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=12`
    );
    const data = await response.json();
    
    // Get cities within 10km radius
    const nearbyResponse = await fetch(
      `https://nominatim.openstreetmap.org/search.php?q=city&format=json&bounded=1&viewbox=${
        lon - 0.1
      },${lat + 0.1},${lon + 0.1},${lat - 0.1}`
    );
    const nearbyData = await nearbyResponse.json();
    
    return nearbyData
      .filter((item: any) => item.type === 'city' || item.type === 'town')
      .map((item: any) => item.display_name.split(',')[0])
      .slice(0, 5); // Limit to 5 nearby cities
  } catch (error) {
    console.error('Error getting nearby cities:', error);
    return [];
  }
};

// Function to get location from coordinates
export const getLocationFromCoords = async (lat: number, lon: number): Promise<Location | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const data = await response.json();

    if (!data.address) {
      return null;
    }

    const city = data.address.city || data.address.town || data.address.village || '';
    const region = data.address.state || '';
    const country = data.address.country || '';

    if (!city || !region || !country) {
      return null;
    }

    // Get nearby cities
    const nearbyCities = await getNearbyCity(lat, lon);

    return {
      city,
      region,
      country,
      nearbyCities,
      lat,
      lon
    };
  } catch (error) {
    console.error('Error getting location from coordinates:', error);
    return null;
  }
};

// Function to search locations
export const searchLocations = async (query: string): Promise<Location[]> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&countrycodes=nl`
    );
    const data = await response.json();

    return await Promise.all(
      data
        .filter((item: any) => {
          const type = item.type.toLowerCase();
          return type === 'city' || type === 'town' || type === 'village';
        })
        .map(async (item: any) => {
          const region = item.address.state || '';
          const country = item.address.country || '';
          const nearbyCities = await getNearbyCity(parseFloat(item.lat), parseFloat(item.lon));

          return {
            city: item.display_name.split(',')[0],
            region,
            country,
            nearbyCities,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          };
        })
    );
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

// Function to get location from IP address as fallback
export const getLocationFromIP = async (): Promise<Location> => {
  try {
    // Using ip-api.com which provides free IP geolocation
    const response = await axios.get('http://ip-api.com/json/');
    const data = response.data;
    
    const city = data.city || '';
    const rawRegion = data.regionName || '';
    const region = translateRegion(rawRegion, city);
    const country = data.country === 'Netherlands' ? 'Nederland' : data.country || '';
    
    console.log('IP-locatie gevonden:', { city, region, country, lat: data.lat, lon: data.lon });
    
    return {
      city,
      region,
      country,
      nearbyCities: [],
      lat: data.lat,
      lon: data.lon
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    throw new Error('Failed to get location from IP');
  }
}; 