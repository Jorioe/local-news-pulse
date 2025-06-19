import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Share2, 
  Ticket, 
  Globe, 
  Phone, 
  Mail, 
  Tag,
  ArrowLeft,
  Bookmark,
  BookmarkMinus
} from 'lucide-react';
import { Event } from '../types/news';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface EventDetailProps {
  event: Event;
  onBack: () => void;
  onToggleFavorite: (eventId: string) => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ event, onBack, onToggleFavorite }) => {
  const { t } = useTranslation();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      }).catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative h-[40vh] sm:h-[50vh]">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 drop-shadow-lg">
            {event.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-white/90">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onBack}
          className="absolute top-6 left-6 p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 transition-colors shadow-lg"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="absolute top-6 right-6 flex gap-2">
          <button
            onClick={() => onToggleFavorite(event.id)}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 transition-colors shadow-lg"
          >
            {event.isFavorite ? (
              <BookmarkMinus className="w-6 h-6 text-orange-500" />
            ) : (
              <Bookmark className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-gray-800 transition-colors shadow-lg"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Description */}
        <Card className="p-6 sm:p-8 shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('event_description')}</h2>
          <p className="text-gray-600 whitespace-pre-line">
            {event.fullDescription || event.description}
          </p>
        </Card>

        {/* Lineup */}
        {event.lineup && event.lineup.length > 0 && (
          <Card className="p-6 sm:p-8 shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">{t('event_lineup')}</h2>
            <div className="space-y-4">
              {event.lineup.map((act, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900">{act.name}</h3>
                    {act.time && <span className="text-gray-500 text-sm">{act.time}</span>}
                  </div>
                  {act.description && (
                    <p className="text-gray-600 text-sm mt-2">{act.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Ticket Info */}
        {event.ticketInfo && (
          <Card className="p-6 sm:p-8 shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">{t('ticket_info')}</h2>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Ticket className="w-5 h-5 mr-3 text-orange-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{event.ticketInfo.price}</p>
                    <p className="text-sm text-gray-600">
                      {t(`ticket_${event.ticketInfo.availability}`)}
                    </p>
                  </div>
                </div>
                {event.ticketInfo.availability !== 'sold_out' && (
                  <Button
                    onClick={() => window.open(event.ticketInfo?.url, '_blank')}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {t('buy_tickets')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Organizer Info */}
        {event.organizer && (
          <Card className="p-6 sm:p-8 shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">{t('organizer_info')}</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{event.organizer.name}</h3>
              <div className="space-y-2">
                {event.organizer.website && (
                  <a
                    href={event.organizer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-600 hover:text-orange-600"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    <span>{event.organizer.website}</span>
                  </a>
                )}
                {event.organizer.phone && (
                  <a
                    href={`tel:${event.organizer.phone}`}
                    className="flex items-center text-gray-600 hover:text-orange-600"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{event.organizer.phone}</span>
                  </a>
                )}
                {event.organizer.email && (
                  <a
                    href={`mailto:${event.organizer.email}`}
                    className="flex items-center text-gray-600 hover:text-orange-600"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{event.organizer.email}</span>
                  </a>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Map */}
        {event.coordinates && (
          <Card className="p-6 sm:p-8 shadow-lg overflow-hidden">
            <h2 className="text-xl font-semibold mb-4">{t('event_location')}</h2>
            <div className="h-64 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8">
              <iframe
                title="Event Location"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.coordinates.lon-0.01},${event.coordinates.lat-0.01},${event.coordinates.lon+0.01},${event.coordinates.lat+0.01}&layer=mapnik&marker=${event.coordinates.lat},${event.coordinates.lon}`}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EventDetail; 