import React, { useState } from 'react';
import { Event } from '../types/news';
import EventCard from './EventCard';
import EventDetail from './EventDetail';
import { mockEvents } from '../data/mockEvents';

interface EventsListProps {
  province?: string;
}

const EventsList: React.FC<EventsListProps> = ({ province }) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
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