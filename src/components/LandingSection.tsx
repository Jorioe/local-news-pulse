
import React from 'react';
import { MapPin, Instagram, Smartphone } from 'lucide-react';
import { Location } from '../types/news';

interface LandingSectionProps {
  onStart: () => void;
  onLocationChange: (location: Location) => void;
}

const LandingSection: React.FC<LandingSectionProps> = ({ onStart, onLocationChange }) => {
  const handleQuickStart = () => {
    // Set a default location for demo
    const defaultLocation: Location = {
      city: 'Amsterdam',
      region: 'Noord-Holland',
      country: 'Nederland',
      coordinates: { lat: 52.3676, lng: 4.9041 }
    };
    onLocationChange(defaultLocation);
  };

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      {/* Hero Section */}
      <div className="px-6 pt-16 pb-12">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <MapPin className="text-white" size={32} />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Stay in the know,<br />
            wherever you go.
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Reis slim. Ontvang het nieuws van jouw locatie.<br />
            Mobiel, lokaal en betrouwbaar.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleQuickStart}
              className="w-full bg-orange-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-orange-600 transition-colors shadow-lg"
            >
              📱 Volg nieuws via app
            </button>
            
            <button className="w-full bg-white border-2 border-orange-500 text-orange-500 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-orange-50 transition-colors">
              📷 Volg nieuws via Instagram
            </button>
          </div>
        </div>
      </div>

      {/* Phone Mockup */}
      <div className="px-6 mb-16">
        <div className="max-w-sm mx-auto">
          <div className="relative">
            <div className="bg-gray-900 rounded-3xl p-2 shadow-2xl">
              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="gradient-orange p-4 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                    <div className="text-sm font-medium">Nieuwsoverzicht</div>
                    <div className="w-6 h-6"></div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-2"></div>
                    <div className="text-sm">Amsterdam, Nederland</div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="bg-gray-100 rounded-lg h-20"></div>
                  <div className="bg-gray-100 rounded-lg h-20"></div>
                  <div className="bg-gray-100 rounded-lg h-20"></div>
                </div>
                <div className="flex justify-around border-t p-3">
                  <div className="text-orange-500 text-xs">Nieuws</div>
                  <div className="text-gray-400 text-xs">Favorieten</div>
                  <div className="text-gray-400 text-xs">Instellingen</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What is Loka Section */}
      <div className="px-6 mb-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Wat is Loka?</h2>
            <p className="text-gray-600 leading-relaxed">
              Loka verzamelt lokaal en landelijk nieuws voor reizigers. Van 
              weerswaarschuwingen tot events in jouw buurt. Altijd in je 
              JetSmarter. Kies zelf hoe je de hoogte blijft via onze app of 
              via Instagram.
            </p>
          </div>
        </div>
      </div>

      {/* Follow Options */}
      <div className="px-6 mb-16">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Kies jouw manier van volgen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* App Option */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="text-orange-500" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Via de app</h3>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>✓ Gepersonaliseerde app</li>
                <li>✓ Pushnotificaties bij belangrijk nieuws</li>
                <li>✓ Werkt wereldwijd</li>
              </ul>
              <button
                onClick={handleQuickStart}
                className="w-full bg-orange-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Volg nieuws via app
              </button>
            </div>

            {/* Instagram Option */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Instagram className="text-orange-500" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Via Instagram</h3>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>✓ Interactieve stories/posts</li>
                <li>✓ Geen aparte lokal media</li>
                <li>✓ Snel op de hoogte</li>
              </ul>
              <button className="w-full bg-white border-2 border-orange-500 text-orange-500 py-3 px-4 rounded-xl font-semibold hover:bg-orange-50 transition-colors">
                Volg nieuws via Instagram
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div className="px-6 mb-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Wat anderen zeggen</h2>
            <p className="text-gray-600 italic mb-4">
              "Op vakantie in Spanje wist ik precies wat er speelde. Handig 
              om op de hoogte te blijven, voor mijn vrienden en mezelf. 
              Loka is mijn vaste reisbuddy geworden."
            </p>
            <div className="flex items-center justify-center">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                F
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Fleur</div>
                <div className="text-sm text-gray-500">22 jaar</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="px-6 pb-16">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Klaar om te weten wat speelt?</h2>
          <div className="space-y-4">
            <button
              onClick={handleQuickStart}
              className="w-full bg-orange-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-orange-600 transition-colors shadow-lg"
            >
              📱 Volg nieuws via app
            </button>
            <button className="w-full bg-white border-2 border-orange-500 text-orange-500 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-orange-50 transition-colors">
              📷 Volg nieuws via Instagram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingSection;
