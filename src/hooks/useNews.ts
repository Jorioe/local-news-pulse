
import { useState, useEffect } from 'react';
import { NewsArticle, Location, NewsFilter } from '../types/news';

// Mock data for demonstration
const mockArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Nieuwe fietsroute verbindt Amsterdam Noord met het centrum',
    content: 'De gemeente Amsterdam heeft vandaag een baanbrekende nieuwe fietsroute geopend die Amsterdam Noord direct verbindt met het stadscentrum. De route, die drie jaar in ontwikkeling was, belooft het dagelijkse woon-werkverkeer voor duizenden Amsterdammers aanzienlijk te verbeteren.\n\nDe nieuwe route, genaamd "Noorderbrug Express", strekt zich uit over 8 kilometer en bevat state-of-the-art fietsfaciliteiten, waaronder slimme verkeerslichten die prioriteit geven aan fietsers, verwarmde fietspaden voor de wintermaanden, en overdekte parkeerplaatsen op strategische locaties.\n\nWethouder van Verkeer, Sarah de Vries, noemde het project "een mijlpaal in onze visie voor een volledig duurzame stad." Volgens haar zal de route naar verwachting het autoverkeer in het centrum met 15% verminderen en de luchtkwaliteit aanzienlijk verbeteren.\n\nDe route is onderdeel van een groter stadsinitiatief dat tot doel heeft Amsterdam tot 2030 de meest fietsvriendelijke stad ter wereld te maken. Andere geplande projecten omvatten uitgebreide fietssnelwegen naar Zuidoost en West, evenals innovatieve fietsparkeeroplossingen in het centrum.',
    summary: 'Amsterdam opent een gloednieuwe fietsroute die Noord verbindt met het centrum, compleet met slimme verkeerslichten en verwarmde paden.',
    thumbnail: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
    location: 'Amsterdam Noord',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: 'Amsterdam Nieuws',
    author: 'Pieter van der Berg',
    category: 'lokaal',
    isFavorite: false
  },
  {
    id: '2',
    title: 'Historische ontdekking in Rotterdam: 17e-eeuwse scheepswrak gevonden',
    content: 'Archeologen hebben een opmerkelijke ontdekking gedaan in de Rotterdamse haven: de resten van een 17e-eeuws handelschip dat mogelijk behoorde tot de Verenigde Oost-Indische Compagnie (VOC). De vondst werd gedaan tijdens routinewerkzaamheden voor de uitbreiding van de Maasvlakte.\n\nHet schip, dat voorlopig de naam "Rotterdam Heritage" heeft gekregen, is volgens experts uitzonderlijk goed bewaard gebleven dankzij de unieke omstandigheden in de zeebodem. Eerste analyses suggereren dat het schip mogelijk zonk rond 1670, tijdens de Gouden Eeuw van de Nederlandse zeevaart.\n\nDr. Elisabeth Vermeer, hoofdarcheoloog van het project, legt uit: "Dit is een van de meest complete VOC-schepen die we ooit hebben gevonden. De lading lijkt grotendeels intact, wat ons een ongeëvenaard inkijkje geeft in de internationale handel van die tijd."\n\nTot nu toe hebben onderzoekers porselein, specerijen, en wat lijken op persoonlijke bezittingen van de bemanning opgegraven. Het stadsmuseum van Rotterdam plant een speciale tentoonstelling om de vondsten te tonen aan het publiek.',
    summary: 'Archeologen ontdekken een perfect bewaard gebleven 17e-eeuws VOC-schip in de Rotterdamse haven met intact gebleven lading.',
    thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    location: 'Rotterdam',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    source: 'Rotterdam Dagblad',
    author: 'Marcus Jansen',
    category: 'regionaal',
    isFavorite: false
  },
  {
    id: '3',
    title: 'Doorbraak in duurzame energie: Nederland opent grootste zonneparkveld van Europa',
    content: 'Nederland heeft vandaag officieel het grootste zonnepark van Europa geopend in de provincie Groningen. Het imposante project, genaamd "Zonneveld Noord", strekt zich uit over 650 hectare en kan energie leveren aan meer dan 230.000 huishoudens.\n\nHet zonnepark, dat twee jaar in aanbouw was, vertegenwoordigt een investering van 450 miljoen euro en markeert een belangrijke mijlpaal in Nederlands streven naar klimaatneutraliteit in 2050. Het project werd gerealiseerd door een consortium van Nederlandse en internationale energiebedrijven.\n\nMinister van Klimaat en Energie, Rob Jetten, benadrukte tijdens de openingsceremonie: "Dit project toont aan dat Nederland serieus is over de energietransitie. We bewijzen dat grootschalige duurzame energieproductie niet alleen mogelijk is, maar ook economisch rendabel."\n\nHet zonnepark gebruikt geavanceerde bifaciale zonnepanelen die energie kunnen opwekken aan beide zijden, waardoor de efficiëntie met 20% wordt verhoogd. Daarnaast is het terrein ingericht om biodiversiteit te bevorderen, met speciale corridors voor lokale wildlife.\n\nExperts voorspellen dat dit project een vliegwieleffect zal hebben op vergelijkbare projecten in heel Europa.',
    summary: 'Nederland opent Europas grootste zonnepark in Groningen, dat energie kan leveren aan meer dan 230.000 huishoudens.',
    thumbnail: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop',
    location: 'Groningen',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    source: 'NOS Nieuws',
    author: 'Linda Hoekstra',
    category: 'belangrijk',
    isFavorite: false
  },
  {
    id: '4',
    title: 'Utrecht lanceert innovatief deelvervoer programma voor studenten',
    content: 'De gemeente Utrecht heeft een baanbrekend nieuw deelvervoer programma gelanceerd dat specifiek is ontworpen voor de grote studentenpopulatie van de stad. Het programma, "StudenMobiel", integreert fietsen, elektrische steps, en kleine elektrische auto\'s in één gebruiksvriendelijke app.\n\nStudenten kunnen nu voor slechts €25 per maand onbeperkt gebruik maken van alle deelvervoermiddelen in de stad. Het initiatief is ontstaan uit bezorgdheid over de hoge vervoerskosten voor studenten en de groeiende verkeersdrukte rond universiteitscampussen.\n\nStudentenraadvoorzitter Emma Bakker reageerde enthousiast: "Dit is precies wat we nodig hadden. Veel van ons kunnen zich geen auto veroorloven, en dit geeft ons de flexibiliteit die we nodig hebben voor stages, bijbanen, en sociale activiteiten."\n\nHet programma wordt ondersteund door slimme technologie die realtime beschikbaarheid toont en optimale routes voorstelt. Sensoren op voertuigen monitoren gebruik en onderhoudsbehoefte, terwijl een AI-systeem de verdeling van voertuigen optimaliseert op basis van vraagpatronen.\n\nAls het programma succesvol is, overweegt Utrecht uitbreiding naar andere bevolkingsgroepen.',
    summary: 'Utrecht introduceert StudenMobiel: een betaalbaar deelvervoer programma dat fietsen, e-steps en elektrische auto\'s combineert voor studenten.',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
    location: 'Utrecht',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    source: 'Utrecht Centraal',
    author: 'Tom Visscher',
    category: 'lokaal',
    isFavorite: false
  },
  {
    id: '5',
    title: 'Revolutionair medisch onderzoek in Leiden leidt tot doorbraak in kankerbehandeling',
    content: 'Onderzoekers van het Leids Universitair Medisch Centrum (LUMC) hebben een revolutionaire doorbraak bereikt in de behandeling van een agressieve vorm van longkanker. Hun innovatieve immuuntherapie heeft in klinische proeven een succespercentage van 78% laten zien bij patiënten bij wie traditionele behandelingen hadden gefaald.\n\nHet onderzoeksteam, geleid door Professor Dr. Maria van den Heuvel, heeft vijf jaar gewerkt aan het ontwikkelen van een behandeling die het eigen immuunsysteem van de patiënt "herprogrammeert" om kankercellen effectiever te herkennen en aan te vallen.\n\n"We hebben in feite het immuunsysteem geleerd om kankercellen te zien als indringers die elimineerd moeten worden," legt Dr. van den Heuvel uit. "De resultaten overtreffen onze stoutste verwachtingen."\n\nDe behandeling, die nog goedkeuring van de Europese Medicijnautoriteit moet krijgen, zou binnen twee jaar beschikbaar kunnen zijn voor patiënten. Internationale farmaceutische bedrijven hebben al interesse getoond in het opschalen van de productie.\n\nDit onderzoek plaatst Nederland opnieuw op de kaart als wereldleider in medische innovatie en biedt hoop aan duizenden patiënten wereldwijd.',
    summary: 'LUMC-onderzoekers ontwikkelen revolutionaire immuuntherapie tegen longkanker met 78% succespercentage in klinische proeven.',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop',
    location: 'Leiden',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    source: 'Medisch Contact',
    author: 'Dr. Sandra Reijnders',
    category: 'belangrijk',
    isFavorite: false
  }
];

export const useNews = (location: Location | null, filter: NewsFilter) => {
  const [articles, setArticles] = useState<NewsArticle[]>(mockArticles);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('newsapp-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    // Update articles with favorite status
    setArticles(prev => prev.map(article => ({
      ...article,
      isFavorite: favorites.includes(article.id)
    })));
  }, [favorites]);

  const toggleFavorite = (articleId: string) => {
    const newFavorites = favorites.includes(articleId)
      ? favorites.filter(id => id !== articleId)
      : [...favorites, articleId];
    
    setFavorites(newFavorites);
    localStorage.setItem('newsapp-favorites', JSON.stringify(newFavorites));
  };

  const getFilteredArticles = () => {
    if (filter === 'alles') return articles;
    return articles.filter(article => article.category === filter);
  };

  const getFavoriteArticles = () => {
    return articles.filter(article => article.isFavorite);
  };

  return {
    articles: getFilteredArticles(),
    favoriteArticles: getFavoriteArticles(),
    loading,
    toggleFavorite
  };
};
