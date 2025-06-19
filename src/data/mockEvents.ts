import { Event } from '../types/news';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Groninger Museumnacht',
    description: 'Ontdek de magie van kunst en cultuur tijdens de Groninger Museumnacht. Alle musea in de stad zijn tot laat open met speciale activiteiten en performances.',
    fullDescription: `Tijdens de Groninger Museumnacht openen alle musea in de stad hun deuren voor een unieke culturele ervaring. Van moderne kunst tot historische collecties, elke locatie biedt speciale activiteiten, performances en workshops.

Wat kun je verwachten:
- Interactieve kunstinstallaties
- Live muziekoptredens
- Speciale rondleidingen
- Workshops voor alle leeftijden
- Culinaire verrassingen

De Museumnacht is dé kans om de rijke culturele scene van Groningen op een andere manier te beleven.`,
    date: '2024-04-15',
    time: '19:00 - 00:00',
    location: 'Diverse musea, Groningen',
    province: 'Groningen',
    image: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&auto=format&fit=crop&q=60',
    coordinates: {
      lat: 53.2194,
      lon: 6.5665
    },
    category: 'Cultuur',
    tags: ['museum', 'kunst', 'cultuur', 'nacht', 'performance'],
    ticketInfo: {
      price: '€15,00',
      url: 'https://museumnacht.groningen.nl',
      availability: 'available'
    },
    organizer: {
      name: 'Stichting Groninger Museumnacht',
      website: 'https://museumnacht.groningen.nl',
      email: 'info@museumnacht.groningen.nl',
      phone: '050-3666555'
    },
    lineup: [
      {
        name: 'Groninger Museum',
        time: '19:00 - 00:00',
        description: 'Speciale tentoonstelling moderne kunst'
      },
      {
        name: 'Noordelijk Scheepvaartmuseum',
        time: '19:00 - 00:00',
        description: 'Historische rondleidingen'
      },
      {
        name: 'GRID Grafisch Museum',
        time: '19:00 - 00:00',
        description: 'Drukwerk workshops'
      }
    ]
  },
  {
    id: '2',
    title: 'Friesland Culinair Festival',
    description: 'Proef de authentieke Friese keuken tijdens dit tweedaagse food festival. Met lokale producenten, kookworkshops en live muziek.',
    fullDescription: `Het Friesland Culinair Festival brengt het beste van de Friese keuken samen op één plek. Tijdens dit tweedaagse evenement kun je genieten van:

- Proeverijen van lokale specialiteiten
- Showcooking door bekende chefs
- Workshops Friese kooktechnieken
- Wijn- en bierproeverijen
- Live muziek van Friese artiesten

Een culinaire ontdekkingsreis door Friesland!`,
    date: '2024-05-20',
    time: '12:00 - 22:00',
    location: 'Wilhelminaplein, Leeuwarden',
    province: 'Friesland',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=60',
    coordinates: {
      lat: 53.2019,
      lon: 5.7999
    },
    category: 'Culinair',
    tags: ['food', 'festival', 'culinair', 'lokaal', 'muziek'],
    ticketInfo: {
      price: '€12,50',
      url: 'https://frieslandculinair.nl',
      availability: 'limited'
    },
    organizer: {
      name: 'Stichting Friesland Culinair',
      website: 'https://frieslandculinair.nl',
      email: 'info@frieslandculinair.nl'
    },
    lineup: [
      {
        name: 'Kookdemonstratie - Chef Jan de Vries',
        time: '14:00 - 15:00',
        description: 'Moderne twist op traditionele Friese gerechten'
      },
      {
        name: 'Workshop Suikerbrood Bakken',
        time: '16:00 - 17:30',
        description: 'Leer zelf authentiek Fries suikerbrood maken'
      }
    ]
  },
  {
    id: '3',
    title: 'Drentse Fiets4Daagse',
    description: 'De grootste fietsvierdaagse van Nederland. Ontdek de prachtige natuur van Drenthe op de fiets met routes voor alle niveaus.',
    date: '2024-07-16',
    time: '08:00 - 17:00',
    location: 'TT Hall, Assen',
    province: 'Drenthe',
    image: '/news-placeholder.svg'
  },
  {
    id: '4',
    title: 'Overijssels Kamermuziekfestival',
    description: 'Een weekend vol klassieke muziek in historische locaties door heel Overijssel. Met internationale topmusici en jong talent.',
    date: '2024-06-08',
    time: '14:00 - 22:00',
    location: 'Diverse locaties, Zwolle',
    province: 'Overijssel',
    image: '/news-placeholder.svg'
  },
  {
    id: '5',
    title: 'Flevoland Outdoor Festival',
    description: 'Het grootste outdoor sportevenement van Flevoland. Met klimmen, mountainbiken, kanoën en meer avontuurlijke activiteiten.',
    date: '2024-08-24',
    time: '10:00 - 18:00',
    location: 'Oostvaardersplassen, Lelystad',
    province: 'Flevoland',
    image: '/news-placeholder.svg'
  },
  {
    id: '6',
    title: 'Utrecht Foodtruck Festival',
    description: 'Drie dagen lang de lekkerste streetfood van lokale en internationale foodtrucks, met live muziek en entertainment.',
    date: '2024-06-14',
    time: '16:00 - 23:00',
    location: 'Park Transwijk, Utrecht',
    province: 'Utrecht',
    image: '/news-placeholder.svg'
  },
  {
    id: '7',
    title: 'Noord-Holland Dance Festival',
    description: 'Een spectaculair dansfestival met workshops, battles en shows van nationale en internationale dansers.',
    date: '2024-09-02',
    time: '13:00 - 23:00',
    location: 'NDSM-werf, Amsterdam',
    province: 'Noord-Holland',
    image: '/news-placeholder.svg'
  },
  {
    id: '8',
    title: 'Zuid-Holland Jazz Days',
    description: 'Drie dagen jazz in de historische binnenstad van Den Haag. Met optredens op verschillende podia en gratis workshops.',
    date: '2024-07-05',
    time: '15:00 - 00:00',
    location: 'Centrum, Den Haag',
    province: 'Zuid-Holland',
    image: '/news-placeholder.svg'
  },
  {
    id: '9',
    title: 'Zeeuws Vlaamse Mosselfeesten',
    description: 'Het grootste mosselfestijn van Nederland. Geniet van verse mosselen, lokale specialiteiten en Zeeuwse folklore.',
    date: '2024-08-10',
    time: '11:00 - 21:00',
    location: 'Haven, Yerseke',
    province: 'Zeeland',
    image: '/news-placeholder.svg'
  },
  {
    id: '10',
    title: 'Brabants Streekbierenfestival',
    description: 'Ontdek de rijke biercultuur van Noord-Brabant. Met proeverijen, brouwerijbezoeken en food pairing workshops.',
    fullDescription: `Het Brabants Streekbierenfestival is hét evenement voor bierliefhebbers. Ontdek de rijke biercultuur van Noord-Brabant met:

- Proeverijen van lokale brouwerijen
- Food pairing workshops
- Meet & greet met brouwmeesters
- Live muziek en entertainment
- Brabantse hapjes

Een gezellig festival waar je kennis kunt maken met de beste bieren uit de regio!`,
    date: '2024-05-25',
    time: '14:00 - 23:00',
    location: 'Chasséveld, Breda',
    province: 'Noord-Brabant',
    image: 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800&auto=format&fit=crop&q=60',
    coordinates: {
      lat: 51.5719,
      lon: 4.7683
    },
    category: 'Festival',
    tags: ['bier', 'festival', 'culinair', 'lokaal', 'muziek'],
    ticketInfo: {
      price: '€17,50',
      url: 'https://brabantsbierenfestival.nl',
      availability: 'available'
    },
    organizer: {
      name: 'Stichting Brabants Bier',
      website: 'https://brabantsbierenfestival.nl',
      email: 'info@brabantsbierenfestival.nl',
      phone: '076-5553333'
    },
    lineup: [
      {
        name: 'Proeverij Lokale Brouwerijen',
        time: '14:30 - 16:00',
        description: 'Ontdek verschillende Brabantse bieren'
      },
      {
        name: 'Workshop Bier & Spijs',
        time: '16:30 - 17:30',
        description: 'Leer over het combineren van bier met gerechten'
      },
      {
        name: 'Live Muziek - De Brabanders',
        time: '20:00 - 23:00',
        description: 'Gezellige muziek op het hoofdpodium'
      }
    ]
  },
  {
    id: '11',
    title: 'Limburgs Preuvenement',
    description: 'Het grootste culinaire evenement van Limburg. Lokale restaurants presenteren hun signature dishes in het historische centrum.',
    date: '2024-08-30',
    time: '17:00 - 23:00',
    location: 'Vrijthof, Maastricht',
    province: 'Limburg',
    image: '/news-placeholder.svg'
  },
  {
    id: '12',
    title: 'Gelders Kunstfestival',
    description: 'Een weekend vol kunst en cultuur in de openlucht. Met exposities, performances en workshops van lokale kunstenaars.',
    date: '2024-06-22',
    time: '11:00 - 20:00',
    location: 'Sonsbeek Park, Arnhem',
    province: 'Gelderland',
    image: '/news-placeholder.svg'
  }
]; 