import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Location } from '../types/news';

interface LocationPickerProps {
  currentLocation: Location | null;
  onLocationChange: (location: Location) => void;
}

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name: string;
  type: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    county?: string;
    country?: string;
    state_district?: string;
  };
}

const LocationPicker: React.FC<LocationPickerProps> = ({ currentLocation, onLocationChange }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Nederlandse vertalingen voor landen
  const countryTranslations: { [key: string]: string } = {
    'Netherlands': 'Nederland',
    'Germany': 'Duitsland',
    'Belgium': 'België',
    'France': 'Frankrijk',
    'Spain': 'Spanje',
    'Italy': 'Italië',
    'United Kingdom': 'Verenigd Koninkrijk',
    'United States': 'Verenigde Staten',
    // Voeg hier meer vertalingen toe indien nodig
  };

  // Vertaal een landnaam naar Nederlands
  const translateCountry = (country: string): string => {
    return countryTranslations[country] || country;
  };

  // Nederlandse vertalingen voor regio's
  const regionTranslations: { [key: string]: string } = {
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
    'Flevoland': 'Flevoland',
  };

  // Vertaal een regionaam naar Nederlands
  const translateRegion = (region: string): string => {
    return regionTranslations[region] || region;
  };

  useEffect(() => {
    // Add click outside listener to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const reverseGeocode = async (lat: number, lng: number): Promise<Location> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=nl`
      );
      const data = await response.json();
      
      return {
        city: data.address.city || data.address.town || data.address.village || data.address.municipality || data.name,
        region: data.address.state || data.address.county || data.address.state_district,
        country: translateCountry(data.address.country),
        coordinates: { lat, lng }
      };
    } catch (error) {
      throw new Error('Kon locatie niet bepalen');
    }
  };

  const detectLocation = async () => {
    setIsDetecting(true);
    setError(null);
    setSuggestions([]);

    try {
      if (!navigator.geolocation) {
        throw new Error('Locatieservices worden niet ondersteund door je browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const location = await reverseGeocode(latitude, longitude);
      onLocationChange(location);
    } catch (error) {
      let errorMessage = 'Kon locatie niet bepalen';
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Geef toestemming voor locatietoegang om deze functie te gebruiken';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Locatie-informatie is niet beschikbaar';
            break;
          case error.TIMEOUT:
            errorMessage = 'Locatieverzoek duurde te lang';
            break;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsDetecting(false);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + 
        new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          'accept-language': 'nl',
          limit: '15'
        })
      );
      
      if (!response.ok) {
        throw new Error('Netwerkfout bij ophalen suggesties');
      }

      const data: LocationSuggestion[] = await response.json();
      
      // Filter en verwerk de resultaten
      const processedSuggestions = data
        // Filter op relevante types en verwijder duplicaten
        .filter((item, index, self) => {
          const isDuplicate = self.findIndex(other => 
            other.address.city === item.address.city &&
            other.address.state === item.address.state &&
            other.address.country === item.address.country
          ) !== index;
          
          return !isDuplicate;
        })
        // Sorteer op relevantie (steden eerst)
        .sort((a, b) => {
          const aIsCity = a.type === 'city' || a.address.city;
          const bIsCity = b.type === 'city' || b.address.city;
          if (aIsCity && !bIsCity) return -1;
          if (!aIsCity && bIsCity) return 1;
          return 0;
        })
        .slice(0, 8); // Beperk tot 8 resultaten

      setSuggestions(processedSuggestions);
    } catch (error) {
      console.error('Fout bij ophalen suggesties:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setError(null);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout to fetch suggestions
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: LocationSuggestion) => {
    const location: Location = {
      city: suggestion.address.city || 
            suggestion.address.town || 
            suggestion.address.village || 
            suggestion.address.municipality ||
            suggestion.display_name.split(',')[0].trim(),
      region: translateRegion(suggestion.address.state || suggestion.address.county || suggestion.address.state_district || ''),
      country: translateCountry(suggestion.address.country || ''),
      coordinates: {
        lat: parseFloat(suggestion.lat),
        lng: parseFloat(suggestion.lon)
      }
    };
    
    onLocationChange(location);
    setSearchQuery('');
    setSuggestions([]);
    setIsSearching(false);
  };

  const formatSuggestionName = (suggestion: LocationSuggestion): string => {
    const name = suggestion.address.city || 
                 suggestion.address.town || 
                 suggestion.address.village || 
                 suggestion.address.municipality ||
                 suggestion.display_name.split(',')[0].trim();
                 
    const region = translateRegion(suggestion.address.state || suggestion.address.county || suggestion.address.state_district || '');
    const country = translateCountry(suggestion.address.country || '');

    if (region && country) {
      return `${name}, ${region}, ${country}`;
    } else if (country) {
      return `${name}, ${country}`;
    }
    return name;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border-0 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
            <MapPin className="text-orange-500" size={20} />
          </div>
          <div>
            <div className="font-bold text-gray-900">
              {currentLocation ? currentLocation.city : 'Locatie'}
            </div>
            <div className="text-sm text-gray-500">
              {currentLocation ? `${currentLocation.region}, ${currentLocation.country}` : 'Niet ingesteld'}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setIsSearching(!isSearching);
            if (!isSearching) {
              setSuggestions([]);
              setSearchQuery('');
            }
          }}
          className="p-2 text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
        >
          <Search size={20} />
        </button>
      </div>

      {isSearching && (
        <div className="space-y-3 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Zoek een plaats..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300 text-gray-900 placeholder-gray-500"
              autoFocus
            />

            {(suggestions.length > 0 || isLoadingSuggestions) && (
              <div 
                ref={suggestionsRef}
                className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
              >
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center p-4 text-gray-500">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    <span>Zoeken...</span>
                  </div>
                ) : (
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-gray-900">
                        {formatSuggestionName(suggestion)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm mb-4">
          {error}
        </div>
      )}

      <button
        onClick={detectLocation}
        disabled={isDetecting}
        className="w-full py-3 px-4 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
      >
        {isDetecting ? 'Locatie detecteren...' : 'Gebruik huidige locatie'}
      </button>
    </div>
  );
};

export default LocationPicker;
