
import React, { useState, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Location } from '../types/news';

interface LocationPickerProps {
  currentLocation: Location | null;
  onLocationChange: (location: Location) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ currentLocation, onLocationChange }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      // Simulate GPS detection with setTimeout
      setTimeout(() => {
        const mockLocation: Location = {
          city: 'Amsterdam',
          region: 'Noord-Holland',
          country: 'Nederland',
          coordinates: { lat: 52.3676, lng: 4.9041 }
        };
        onLocationChange(mockLocation);
        setIsDetecting(false);
      }, 2000);
    } catch (error) {
      console.error('Location detection failed:', error);
      setIsDetecting(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const searchLocation: Location = {
        city: searchQuery,
        region: 'Nederland',
        country: 'Nederland'
      };
      onLocationChange(searchLocation);
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <MapPin className="text-orange-500 mr-2" size={20} />
          <span className="font-semibold text-gray-800">
            {currentLocation ? `${currentLocation.city}, ${currentLocation.region}` : 'Locatie niet ingesteld'}
          </span>
        </div>
        <button
          onClick={() => setIsSearching(!isSearching)}
          className="text-orange-500 hover:text-orange-600 transition-colors"
        >
          <Search size={20} />
        </button>
      </div>

      {isSearching && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Zoek een locatie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Zoek
            </button>
          </div>
        </div>
      )}

      <button
        onClick={detectLocation}
        disabled={isDetecting}
        className="w-full mt-3 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        {isDetecting ? 'Locatie detecteren...' : 'Gebruik huidige locatie'}
      </button>
    </div>
  );
};

export default LocationPicker;
