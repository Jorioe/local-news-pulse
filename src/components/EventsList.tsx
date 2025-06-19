import React from 'react';
import { Event } from '../types/news';
import EventCard from './EventCard';
import { mockEvents } from '../data/mockEvents';

interface EventsListProps {
  province?: string;
}

const EventsList: React.FC<EventsListProps> = ({ province }) => {
  // Filter events by province if provided
  const events = province
    ? mockEvents.filter(event => event.province === province)
    : mockEvents;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};

export default EventsList; 