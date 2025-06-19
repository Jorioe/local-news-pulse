import React, { useState } from 'react';
import { Event } from '../types/news';
import EventCard from './EventCard';
import EventDetail from './EventDetail';
import { mockEvents } from '../data/mockEvents';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EventsListProps {
  province?: string;
}

const EventsList: React.FC<EventsListProps> = ({ province }) => {
  const { t } = useTranslation();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('newsapp-event-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Filter events by province if provided
  const events = province
    ? mockEvents.filter(event => event.province === province)
    : mockEvents;

  // Add isFavorite property to events
  const eventsWithFavorites = events.map(event => ({
    ...event,
    isFavorite: favorites.includes(event.id)
  }));

  const handleToggleFavorite = (eventId: string) => {
    const newFavorites = favorites.includes(eventId)
      ? favorites.filter(id => id !== eventId)
      : [...favorites, eventId];
    
    setFavorites(newFavorites);
    localStorage.setItem('newsapp-event-favorites', JSON.stringify(newFavorites));
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  if (selectedEvent) {
    return (
      <EventDetail
        event={selectedEvent}
        onBack={() => setSelectedEvent(null)}
        onToggleFavorite={handleToggleFavorite}
      />
    );
  }

  if (eventsWithFavorites.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm max-w-md mx-auto">
          <Users className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-lg font-medium mb-2">{t('no_articles_found')}</p>
          <p className="text-sm">{t('try_another_filter')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {eventsWithFavorites.map(event => (
        <EventCard
          key={event.id}
          event={event}
          onToggleFavorite={handleToggleFavorite}
          onClick={handleEventClick}
        />
      ))}
    </div>
  );
};

export default EventsList; 