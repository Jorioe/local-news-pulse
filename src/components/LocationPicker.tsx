
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
          onClick={() => setIsSearching(!isSearching)}
          className="p-2 text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
        >
          <Search size={20} />
        </button>
      </div>

      {isSearching && (
        <div className="space-y-3 mb-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Zoek een locatie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
            >
              Zoek
            </button>
          </div>
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
