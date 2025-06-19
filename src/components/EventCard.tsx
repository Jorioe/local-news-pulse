import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin, Share2, Bookmark, BookmarkMinus } from 'lucide-react';
import { Event } from '../types/news';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface EventCardProps {
  event: Event;
  onShare?: () => void;
  onToggleFavorite: (eventId: string) => void;
  onClick: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onShare, onToggleFavorite, onClick }) => {
  const { t } = useTranslation();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare();
    } else {
      // Fallback to Web Share API if available
      if (navigator.share) {
        navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        }).catch(console.error);
      }
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onClick(event)}
    >
      <div className="relative">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(event.id);
            }}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all duration-200"
          >
            {event.isFavorite ? (
              <BookmarkMinus className="text-orange-500" size={16} />
            ) : (
              <Bookmark className="text-gray-600" size={16} />
            )}
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <h3 className="text-xl font-bold text-accent line-clamp-2">
          {event.title}
        </h3>
        <p className="text-gray-600 line-clamp-3">
          {event.description}
        </p>
        <div className="space-y-2">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-sm">{event.date}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span className="text-sm">{event.time}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">{event.location}</span>
          </div>
        </div>
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
            {t('share_event')}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EventCard; 