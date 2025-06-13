import { XMLParser } from 'fast-xml-parser';
import { getRelativeTime } from '../utils/dateUtils';
import { Location, NewsArticle, NewsFilter } from '../types/news';

// --- CONSTANTS ---

const CORS_PROXY = 'https://corsproxy.io/?';
const SOURCE_TYPES = {
  RSS: 'RSS Feed',
};

// --- HELPERS ---

const extractTextFromXml = (node: any): string => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'object') {
    if (Array.isArray(node)) return node.map(extractTextFromXml).join(' ');
    if (node['#text']) return typeof node['#text'] === 'string' ? node['#text'] : extractTextFromXml(node['#text']);
    if (node['@_url']) return typeof node['@_url'] === 'string' ? node['@_url'] : extractTextFromXml(node['@_url']);
    return Object.values(node).map(value => extractTextFromXml(value)).filter(text => text).join(' ');
  }
  return String(node || '');
};

// Parses HTML from RSS description to find the first usable image.
const extractFirstImageFromHtml = (html: string): string | null => {
  if (!html) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const img = doc.querySelector("img");
    if (img && img.src && (!img.width || img.width > 50) && (!img.height || img.height > 50)) {
      if (img.src.startsWith('data:image/') && img.src.length < 200) return null;
      return img.src;
    }
    return null;
  } catch (error) {
    console.error("Error parsing HTML for image:", error);
    return null;
  }
};

const fetchImageFromUrl = async (url: string): Promise<string | null> => {
  if (!url) return null;
  console.log(`Attempting to fetch og:image from ${url}`);
  try {
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}, status: ${response.status}`);
      return null;
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const ogImage = doc.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.getAttribute('content')) {
      console.log(`Found og:image: ${ogImage.getAttribute('content')}`);
      return ogImage.getAttribute('content');
    }
    
    const twitterImage = doc.querySelector('meta[name="twitter:image"]');
    if (twitterImage && twitterImage.getAttribute('content')) {
      console.log(`Found twitter:image: ${twitterImage.getAttribute('content')}`);
      return twitterImage.getAttribute('content');
    }

    console.log(`No og:image or twitter:image found for ${url}`);
    return null;
  } catch (error) {
    console.error(`Error fetching or parsing meta image from URL ${url}:`, error);
    return null;
  }
};

// --- NEWS SOURCES ---

const LOCAL_NEWS_SOURCES: { [key: string]: Array<{ name: string; rssUrl: string; baseUrl: string }> } = {
  'Noord-Brabant': [
    { name: 'Omroep Brabant', rssUrl: 'https://www.omroepbrabant.nl/rss', baseUrl: 'https://www.omroepbrabant.nl' },
    { name: 'BN DeStem Moerdijk', rssUrl: 'https://www.bndestem.nl/moerdijk/rss.xml', baseUrl: 'https://www.bndestem.nl' },
    { name: 'BN DeStem Regio', rssUrl: 'https://www.bndestem.nl/regio/rss.xml', baseUrl: 'https://www.bndestem.nl' },
    { name: 'Brabants Dagblad', rssUrl: 'https://www.bd.nl/moerdijk/rss.xml', baseUrl: 'https://www.bd.nl' },
    { name: 'Moerdijk Nieuws', rssUrl: 'https://moerdijk.nieuws.nl/feed/', baseUrl: 'https://moerdijk.nieuws.nl' },
    { name: 'Internet Bode', rssUrl: 'https://www.internetbode.nl/moerdijk/rss', baseUrl: 'https://internetbode.nl' },
    { name: 'Brabant Vandaag – Algemeen', rssUrl: 'https://brabantvandaag.nl/rss-feeds', baseUrl: 'https://brabantvandaag.nl' }, // Oozo feeds voor heel Brabant :contentReference[oaicite:1]{index=1}
    { name: 'Brabant Vandaag – Breda', rssUrl: 'https://brabantvandaag.nl/breda/feed/', baseUrl: 'https://brabantvandaag.nl' },
    { name: 'Brabant Vandaag – Zevenbergen', rssUrl: 'https://brabantvandaag.nl/zevenbergen/feed/', baseUrl: 'https://brabantvandaag.nl' },
    { name: 'Brabant Vandaag – Tilburg', rssUrl: 'https://brabantvandaag.nl/tilburg/feed/', baseUrl: 'https://brabantvandaag.nl' },
    { name: 'Brabant Vandaag – Oosterhout', rssUrl: 'https://brabantvandaag.nl/oosterhout/feed/', baseUrl: 'https://brabantvandaag.nl' },
    { name: 'Brabant Vandaag – Oss', rssUrl: 'https://brabantvandaag.nl/oss/feed/', baseUrl: 'https://brabantvandaag.nl' },
    { name: 'Brabant Vandaag – Eindhoven', rssUrl: 'https://brabantvandaag.nl/eindhoven/feed/', baseUrl: 'https://brabantvandaag.nl' },
    { name: 'Brabant Vandaag – Waalwijk', rssUrl: 'https://brabantvandaag.nl/waalwijk/feed/', baseUrl: 'https://brabantvandaag.nl' },
    { name: 'Brabant Vandaag – Meierij', rssUrl: 'https://brabantvandaag.nl/meierij/feed/', baseUrl: 'https://brabantvandaag.nl' },
    { name: 'Brabants Dagblad – Tilburg', rssUrl: 'https://www.bd.nl/tilburg/rss.xml', baseUrl: 'https://www.bd.nl' }, // BD feeds :contentReference[oaicite:3]{index=3}
    { name: 'Brabants Dagblad – Eindhoven', rssUrl: 'https://www.bd.nl/eindhoven/rss.xml', baseUrl: 'https://www.bd.nl' },
    { name: 'Brabants Dagblad – Den Bosch', rssUrl: 'https://www.bd.nl/s-hertogenbosch/rss.xml', baseUrl: 'https://www.bd.nl' }
  ],
  'Zuid-Holland': [
    { name: 'RTV Rijnmond', rssUrl: 'https://rijnmond.nl/rss', baseUrl: 'https://rijnmond.nl' },
    { name: 'AD Rotterdam', rssUrl: 'https://www.ad.nl/rotterdam/rss.xml', baseUrl: 'https://www.ad.nl' },
    { name: 'Omroep West', rssUrl: 'https://www.omroepwest.nl/nieuws/rss.xml', baseUrl: 'https://www.omroepwest.nl' }
  ],
  'Gelderland': [
    { name: 'Omroep Gelderland – Nieuws', rssUrl: 'https://www.omroepgelderland.nl/nieuws/rss', baseUrl: 'https://omroepgelderland.nl' },
    { name: 'De Gelderlander – Nieuws', rssUrl: 'https://www.gelderlander.nl/rss.xml', baseUrl: 'https://www.gelderlander.nl' },
    { name: 'AD Nijmegen', rssUrl: 'https://www.ad.nl/nijmegen/rss.xml', baseUrl: 'https://ad.nl' },
    { name: 'AD Arnhem', rssUrl: 'https://www.ad.nl/arnhem/rss.xml', baseUrl: 'https://ad.nl' },
    { name: 'AD Apeldoorn', rssUrl: 'https://www.ad.nl/apeldoorn/rss.xml', baseUrl: 'https://ad.nl' },
    { name: 'Nijmeegse Stadskrant', rssUrl: 'https://nijmegen.nieuws.nl/feed/', baseUrl: 'https://nijmegen.nieuws.nl' },
    { name: 'OMroep Lingewaard', rssUrl: 'https://lingewaard.nieuws.nl/feed/', baseUrl: 'https://lingewaard.nieuws.nl' },
    { name: 'Gemeente Arnhem – Nieuws', rssUrl: 'https://www.arnhem.nl/nieuws/rss', baseUrl: 'https://arnhem.nl' },
    { name: 'Gemeente Nijmegen – Nieuws', rssUrl: 'https://www.nijmegen.nl/rss', baseUrl: 'https://nijmegen.nl' },
    { name: 'Gemeente Apeldoorn – Nieuws', rssUrl: 'https://www.apeldoorn.nl/rss', baseUrl: 'https://apeldoorn.nl' },
    { name: 'Bommelerwaard Nieuws', rssUrl: 'https://bommelerwaard.nieuws.nl/feed/', baseUrl: 'https://bommelerwaard.nieuws.nl' },
    { name: 'Achterhoek Nieuws', rssUrl: 'https://achterhoek.nieuws.nl/feed/', baseUrl: 'https://achterhoek.nieuws.nl' },
    { name: 'Betuwe Nieuws', rssUrl: 'https://betuwe.nieuws.nl/feed/', baseUrl: 'https://betuwe.nieuws.nl' },
    { name: 'Mijn Streek Arnhem', rssUrl: 'https://arnhem.nieuws.nl/feed/', baseUrl: 'https://arnhem.nieuws.nl' },
    { name: 'Mijn Streek Nijmegen', rssUrl: 'https://nijmegen.nieuws.nl/feed/', baseUrl: 'https://nijmegen.nieuws.nl' },
    { name: 'Mijn Streek Apeldoorn', rssUrl: 'https://apeldoorn.nieuws.nl/feed/', baseUrl: 'https://apeldoorn.nieuws.nl' },
    { name: 'Barneveld Nieuws', rssUrl: 'https://barneveld.nieuws.nl/feed/', baseUrl: 'https://barneveld.nieuws.nl' },
    { name: 'Ede Nieuws', rssUrl: 'https://ede.nieuws.nl/feed/', baseUrl: 'https://ede.nieuws.nl' },
    { name: 'Heerlen Nieuws', rssUrl: 'https://heerlen.nieuws.nl/feed/', baseUrl: 'https://heerlen.nieuws.nl' },
    { name: 'Zutphen Nieuws', rssUrl: 'https://zutphen.nieuws.nl/feed/', baseUrl: 'https://zutphen.nieuws.nl' }
  ],
  'Utrecht': [
    { name: 'RTV Utrecht – Nieuws', rssUrl: 'https://rtvutrecht.nl/feed/rss.xml', baseUrl: 'https://rtvutrecht.nl' },
    { name: 'RTV Utrecht – Regio', rssUrl: 'https://rtvutrecht.nl/feed/rss.xml?categorie=regio', baseUrl: 'https://rtvutrecht.nl' },
    { name: 'AD Utrecht', rssUrl: 'https://www.ad.nl/utrecht/rss.xml', baseUrl: 'https://ad.nl' },
    { name: 'Dichtbij.nl – Utrecht', rssUrl: 'https://utrecht.dichtbij.nl/nieuws/rss', baseUrl: 'https://utrecht.dichtbij.nl' },
    { name: 'Utrechtse Internet Courant', rssUrl: 'https://uic.nl/feed/', baseUrl: 'https://uic.nl' },
    { name: 'Utrechts Nieuwsblad', rssUrl: 'https://utrechtsnieuwsblad.nl/feed/', baseUrl: 'https://utrechtsnieuwsblad.nl' },
    { name: 'Gemeente Utrecht – Nieuws', rssUrl: 'https://www.utrecht.nl/nieuws/rss', baseUrl: 'https://utrecht.nl' },
    { name: 'Gemeente Amersfoort – Nieuws', rssUrl: 'https://www.amersfoort.nl/nieuws/rss', baseUrl: 'https://amersfoort.nl' },
    { name: 'Omgevingsdienst Utrecht – Nieuws', rssUrl: 'https://odu-ned.nl/rss', baseUrl: 'https://odu-ned.nl' },
    { name: 'De Stad Amersfoort', rssUrl: 'https://www.destadamersfoort.nl/feed/', baseUrl: 'https://destadamersfoort.nl' },
    { name: 'Stad Amersfoort Nieuws', rssUrl: 'https://www.amersfoortnieuws.nl/rss', baseUrl: 'https://amersfoortnieuws.nl' },
    { name: 'Gemeente Zeist – Nieuws', rssUrl: 'https://www.zeist.nl/rss', baseUrl: 'https://zeist.nl' },
    { name: 'De Kaap (Nieuwegein)', rssUrl: 'https://www.dekaap.nl/?feed=rss2', baseUrl: 'https://dekaap.nl' },
    { name: 'Ouderherstel.nl – Utrecht', rssUrl: 'https://ouderherstel.nl/feed/', baseUrl: 'https://ouderherstel.nl' },
    { name: 'Utrechts Milieucentrum', rssUrl: 'https://umcnieuws.nl/feed/', baseUrl: 'https://umcnieuws.nl' },
    { name: 'Ronde Venen Nieuws', rssUrl: 'https://rondevenen.nieuws.nl/feed/', baseUrl: 'https://rondevenen.nieuws.nl' },
    { name: 'Nieuwsoverzicht Woerden', rssUrl: 'https://woerden.nieuws.nl/feed/', baseUrl: 'https://woerden.nieuws.nl' },
    { name: 'Hart van Holland (IJsselstein)', rssUrl: 'https://ijsselstein.nieuws.nl/feed/', baseUrl: 'https://ijsselstein.nieuws.nl' },
    { name: 'Mijn Stad Rhenen', rssUrl: 'https://rhenen.nieuws.nl/feed/', baseUrl: 'https://rhenen.nieuws.nl' },
    { name: 'Mijn Stad Veenendaal', rssUrl: 'https://veenendaal.nieuws.nl/feed/', baseUrl: 'https://veenendaal.nieuws.nl' }
  ],
  'Overijssel': [{ name: 'RTV Oost', rssUrl: 'https://www.rtvoost.nl/nieuws/rss', baseUrl: 'https://www.rtvoost.nl' }],
  'Friesland': [{ name: 'Omrop Fryslân', rssUrl: 'https://www.omropfryslan.nl/nieuws/rss.xml', baseUrl: 'https://www.omropfryslan.nl' }],
  'Groningen': [{ name: 'RTV Noord', rssUrl: 'https://www.rtvnoord.nl/nieuws/rss', baseUrl: 'https://www.rtvnoord.nl' }],
  'Drenthe': [{ name: 'RTV Drenthe', rssUrl: 'https://www.rtvdrenthe.nl/nieuws/rss', baseUrl: 'https://www.rtvdrenthe.nl' }],
  'Zeeland': [{ name: 'Omroep Zeeland', rssUrl: 'https://www.omroepzeeland.nl/nieuws/rss', baseUrl: 'https://www.omroepzeeland.nl' }],
  'Flevoland': [{ name: 'Omroep Flevoland', rssUrl: 'https://www.omroepflevoland.nl/nieuws/rss', baseUrl: 'https://www.omroepflevoland.nl' }],
  'Limburg': [
    { name: 'L1', rssUrl: 'https://l1.nl/feed/', baseUrl: 'https://l1.nl' },
    { name: 'De Limburger', rssUrl: 'https://www.limburger.nl/rss', baseUrl: 'https://www.limburger.nl' }
  ],
  'Noord-Holland': [{ name: 'NH Nieuws', rssUrl: 'https://www.nhnieuws.nl/feed/rss.xml', baseUrl: 'https://www.nhnieuws.nl' }],
  'Frankrijk – Nationale en regionale': [
    { name: 'France24 (Engels)', rssUrl: 'https://www.france24.com/en/rss', baseUrl: 'https://france24.com' },
    { name: 'Le Monde – Une', rssUrl: 'https://www.lemonde.fr/rss/une.xml', baseUrl: 'https://lemonde.fr' },
    { name: 'Mediapart', rssUrl: 'https://www.mediapart.fr/articles/feed', baseUrl: 'https://mediapart.fr' },
    { name: 'Paris Star', rssUrl: 'https://www.parisstaronline.com/feed', baseUrl: 'https://parisstaronline.com' },
    { name: 'L\'Obs', rssUrl: 'https://www.nouvelobs.com/a-la-une/rss.xml', baseUrl: 'https://nouvelobs.com' },
    { name: 'Franceinfo – Titres', rssUrl: 'https://www.francetvinfo.fr/titres.rss', baseUrl: 'https://francetvinfo.fr' },
    { name: 'Le Huffington Post FR', rssUrl: 'https://www.huffingtonpost.fr/feeds/index.xml', baseUrl: 'https://huffingtonpost.fr' },
    { name: 'La Dépêche du Midi', rssUrl: 'https://www.ladepeche.fr/rss.xml', baseUrl: 'https://ladepeche.fr' },
    { name: 'Sud Ouest – Essentiel', rssUrl: 'https://www.sudouest.fr/essentiel/rss.xml', baseUrl: 'https://sudouest.fr' },
    { name: 'Ouest‑France', rssUrl: 'https://www.ouest-france.fr/rss-en-continu.xml', baseUrl: 'https://ouest‑france.fr' },
    // Regionale stations
    { name: 'France Bleu Gascogne', rssUrl: 'https://www.francebleu.fr/rss/gascogne', baseUrl: 'https://francebleu.fr' },
    { name: 'France Bleu Provence', rssUrl: 'https://www.francebleu.fr/rss/provence', baseUrl: 'https://francebleu.fr' },
    { name: 'France Bleu Alsace', rssUrl: 'https://www.francebleu.fr/rss/alsace', baseUrl: 'https://francebleu.fr' },
    { name: 'France Bleu Île-de-France', rssUrl: 'https://www.francebleu.fr/rss/ile-de-france', baseUrl: 'https://francebleu.fr' },
    { name: 'France Bleu Nord', rssUrl: 'https://www.francebleu.fr/rss/nord', baseUrl: 'https://francebleu.fr' },
    { name: 'France Bleu Toulouse', rssUrl: 'https://www.francebleu.fr/rss/toulouse', baseUrl: 'https://francebleu.fr' },
    { name: 'France Bleu Occitanie', rssUrl: 'https://www.francebleu.fr/rss/occitanie', baseUrl: 'https://francebleu.fr' },
    { name: 'France Bleu Provence-Alpes', rssUrl: 'https://www.francebleu.fr/rss/provence-alpes', baseUrl: 'https://francebleu.fr' },
    { name: 'France Bleu Lorraine', rssUrl: 'https://www.francebleu.fr/rss/lorraine', baseUrl: 'https://francebleu.fr' },
    { name: 'France Bleu Champagne', rssUrl: 'https://www.francebleu.fr/rss/champagne', baseUrl: 'https://francebleu.fr' }
  ],
  'Spanje – Nacional y regional': [
    { name: 'El País', rssUrl: 'https://feeds.elpais.com/mrss-s/publico', baseUrl: 'https://elpais.com' },
    { name: 'ElDiario.es', rssUrl: 'https://www.eldiario.es/rss/', baseUrl: 'https://eldiario.es' },
    { name: 'The Local España', rssUrl: 'https://feeds.thelocal.com/rss/es', baseUrl: 'https://thelocal.es' },
    { name: 'El Confidencial', rssUrl: 'https://rss.elconfidencial.com/espana/', baseUrl: 'https://elconfidencial.com' },
    { name: 'Expansión', rssUrl: 'https://e00-expansion.uecdn.es/rss/portada.xml', baseUrl: 'https://expansion.com' },
    { name: 'El Periódico', rssUrl: 'https://www.elperiodico.com/es/rss/rss_portada.xml', baseUrl: 'https://elperiodico.com' },
    { name: 'HuffPost ES', rssUrl: 'https://www.huffingtonpost.es/feeds/index.xml', baseUrl: 'https://huffingtonpost.es' },
    { name: 'Euro Weekly News', rssUrl: 'https://www.euroweeklynews.com/feed/', baseUrl: 'https://euroweeklynews.com' },
    { name: 'Agencia EFE (EN)', rssUrl: 'https://www.efe.com/efe/english/4/rss', baseUrl: 'https://efe.com' },
    { name: 'La Vanguardia – Barcelona', rssUrl: 'https://www.lavanguardia.com/mvc/feed/rss/home', baseUrl: 'https://lavanguardia.com' },
    { name: 'Las Provincias – Valencia', rssUrl: 'https://www.lasprovincias.es/rss/feed.xml', baseUrl: 'https://lasprovincias.es' },
    { name: '20 minutos – Madrid', rssUrl: 'https://www.20minutos.es/rss', baseUrl: 'https://20minutos.es' },
    { name: 'El Norte de Castilla – Valladolid', rssUrl: 'https://www.elnortedecastilla.es/rss', baseUrl: 'https://elnortedecastilla.es' },
    { name: 'La Rioja', rssUrl: 'https://www.larioja.com/rss', baseUrl: 'https://larioja.com' },
    { name: 'Diario Sur – Málaga', rssUrl: 'https://www.diariosur.es/rss/feed.xml', baseUrl: 'https://diariosur.es' },
    { name: 'Faro de Vigo', rssUrl: 'https://www.farodevigo.es/rss', baseUrl: 'https://farodevigo.es' },
    { name: 'La Voz de Galicia', rssUrl: 'https://www.lavozdegalicia.es/rss', baseUrl: 'https://lavozdegalicia.es' },
    { name: 'El Comercio – Gijón', rssUrl: 'https://www.elcomercio.es/rss', baseUrl: 'https://elcomercio.es' },
    { name: 'Sur in English', rssUrl: 'https://www.surinenglish.com/rss', baseUrl: 'https://surinenglish.com' },
    { name: 'Marca', rssUrl: 'https://e00-marca.uecdn.es/rss/portada.xml', baseUrl: 'https://marca.com' }
  ],
  'China – Nationaal (SCMP)': [
    { name: 'South China Morning Post – China', rssUrl: 'https://www.scmp.com/rss/asia/china', baseUrl: 'https://scmp.com' }
  ],
  'VS – National and regional': [
    { name: 'New York Times – Home', rssUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', baseUrl: 'https://nytimes.com' },
    { name: 'BBC News US & Canada', rssUrl: 'http://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', baseUrl: 'https://bbc.com' },
    { name: 'Washington Post', rssUrl: 'http://feeds.washingtonpost.com/rss/homepage', baseUrl: 'https://washingtonpost.com' },
    { name: 'Los Angeles Times', rssUrl: 'https://www.latimes.com/rss2.0.xml', baseUrl: 'https://latimes.com' },
    { name: 'Chicago Tribune', rssUrl: 'https://www.chicagotribune.com/arcio/rss/category/news/', baseUrl: 'https://chicagotribune.com' },
    { name: 'The Boston Globe', rssUrl: 'https://www.bostonglobe.com/bigpicture/rss.xml', baseUrl: 'https://bostonglobe.com' },
    { name: 'SF Chronicle – Bay Area', rssUrl: 'https://www.sfchronicle.com/bayarea/?service=rss', baseUrl: 'https://sfchronicle.com' },
    { name: 'Gothamist – NYC', rssUrl: 'https://gothamist.com/feed', baseUrl: 'https://gothamist.com' },
    { name: 'Miami Herald', rssUrl: 'https://www.miamiherald.com/arcio/rss/category/news/', baseUrl: 'https://miamiherald.com' },
    { name: 'New Orleans Times-Picayune', rssUrl: 'https://www.nola.com/arcio/rss/category/news/', baseUrl: 'https://nola.com' },
    { name: 'Houston Chronicle', rssUrl: 'https://www.houstonchronicle.com/breadcrumbs/rss/', baseUrl: 'https://houstonchronicle.com' },
    { name: 'Dallas Morning News', rssUrl: 'https://www.dallasnews.com/arcio/rss/category/news/', baseUrl: 'https://dallasnews.com' },
    { name: 'Seattle Times', rssUrl: 'https://www.seattletimes.com/rss/feed/', baseUrl: 'https://seattletimes.com' },
    { name: 'Denver Post', rssUrl: 'https://www.denverpost.com/feed/', baseUrl: 'https://denverpost.com' },
    { name: 'Star Tribune (Minneapolis)', rssUrl: 'https://www.startribune.com/rss/', baseUrl: 'https://startribune.com' },
    { name: 'The Oregonian (Portland)', rssUrl: 'https://www.oregonlive.com/oregonian/rss/', baseUrl: 'https://oregonlive.com' },
    { name: 'Atlanta Journal-Constitution', rssUrl: 'https://www.ajc.com/arcio/rss/category/news/', baseUrl: 'https://ajc.com' },
    { name: 'Philadelphia Inquirer', rssUrl: 'https://www.inquirer.com/arcio/rss/category/news/', baseUrl: 'https://inquirer.com' },
    { name: 'The Columbus Dispatch', rssUrl: 'https://www.dispatch.com/arcio/rss/category/news/', baseUrl: 'https://dispatch.com' },
    { name: 'The Sacramento Bee', rssUrl: 'https://www.sacbee.com/arcio/rss/category/news/', baseUrl: 'https://sacbee.com' }
  ],
  'Italië – Nationaal': [
    { name: 'Corriere della Sera', rssUrl: 'https://rss.corriere.it/rss/homepage.xml', baseUrl: 'https://corriere.it' }
  ],
  'Italië – Lazio (Rome)': [
    { name: 'Roma Today', rssUrl: 'https://www.romatoday.it/rss.xml', baseUrl: 'https://romatoday.it' }
  ],
  'Italië – Lombardia (Milaan)': [
    { name: 'Milano Today', rssUrl: 'https://www.milanotoday.it/rss.xml', baseUrl: 'https://milanotoday.it' }
  ],
  'Turkije – Nationaal': [
    { name: 'Hürriyet Daily News', rssUrl: 'https://www.hurriyetdailynews.com/rss', baseUrl: 'https://hurriyetdailynews.com' }
  ],
  'Turkije – Istanbul': [
    { name: 'Hürriyet Daily News – Istanbul', rssUrl: 'https://www.hurriyetdailynews.com/rss', baseUrl: 'https://hurriyetdailynews.com' }
  ],
  'Mexico – Nationaal': [
    { name: 'El Universal', rssUrl: 'https://www.eluniversal.com.mx/rss.xml', baseUrl: 'https://eluniversal.com.mx' }
  ],
  'Mexico – Ciudad de México': [
    { name: 'Mexico News Daily', rssUrl: 'https://mexiconewsdaily.com/feed/', baseUrl: 'https://mexiconewsdaily.com' }
  ],
  'Mexico – Jalisco (Guadalajara)': [
    { name: 'El Informador', rssUrl: 'https://www.informador.mx/rss', baseUrl: 'https://informador.mx' }
  ],
  'Thailand – National and Bangkok': [
    { name: 'Bangkok Post – National', rssUrl: 'https://www.bangkokpost.com/rss/data/boom.rss', baseUrl: 'https://bangkokpost.com' },
    { name: 'The Nation', rssUrl: 'https://www.nationthailand.com/rss/data/national.rss', baseUrl: 'https://nationthailand.com' },
    { name: 'Thai PBS World', rssUrl: 'https://www.thaipbsworld.com/feed/', baseUrl: 'https://thaipbsworld.com' },
    { name: 'Bangkok Post – Bangkok', rssUrl: 'https://www.bangkokpost.com/rss/data/boom.rss', baseUrl: 'https://bangkokpost.com' },
    { name: 'Coconuts Bangkok', rssUrl: 'https://coconuts.co/bangkok/feed/', baseUrl: 'https://coconuts.co' },
    { name: 'Khaosod English', rssUrl: 'https://www.khaosodenglish.com/feed/', baseUrl: 'https://khaosodenglish.com' },
    { name: 'Chiang Mai Mail', rssUrl: 'https://chiam-mail.com/feed/', baseUrl: 'https://chiangmaimail.com' },
    { name: 'Pattaya Mail', rssUrl: 'https://www.pattayamail.com/rss', baseUrl: 'https://pattayamail.com' },
    { name: 'Thailand News Agency', rssUrl: 'http://tna.mcot.net/feed', baseUrl: 'http://tna.mcot.net' },
    { name: 'Bangkok Biz News', rssUrl: 'https://www.bangkokbiznews.com/rss', baseUrl: 'https://bangkokbiznews.com' },
    { name: 'Isaan Voice', rssUrl: 'https://isaanrecord.co/feed/', baseUrl: 'https://isaanrecord.co' },
    { name: 'Bangkok Coconuts', rssUrl: 'https://coconuts.co/bangkok/feed/', baseUrl: 'https://coconuts.co' },
    { name: 'Thai Enquirer', rssUrl: 'https://www.thaienquirer.com/feed/', baseUrl: 'https://thaienquirer.com' },
    { name: 'Bangkok Post – Politics', rssUrl: 'https://www.bangkokpost.com/rss/data/politics.rss', baseUrl: 'https://bangkokpost.com' },
    { name: 'Bangkok Post – Business', rssUrl: 'https://www.bangkokpost.com/rss/data/business.rss', baseUrl: 'https://bangkokpost.com' },
    { name: 'Bangkok Post – Lifestyle', rssUrl: 'https://www.bangkokpost.com/rss/data/life.rss', baseUrl: 'https://bangkokpost.com' },
    { name: 'Bangkok Post – Breaking news', rssUrl: 'https://www.bangkokpost.com/rss/data/breakingnews.rss', baseUrl: 'https://bangkokpost.com' },
    { name: 'Thai PBS World – Bangkok', rssUrl: 'https://www.thaipbsworld.com/category/bangkok/feed/', baseUrl: 'https://thaipbsworld.com' },
    { name: 'Coconuts Bangkok Events', rssUrl: 'https://coconuts.co/bangkok/events/feed/', baseUrl: 'https://coconuts.co' },
    { name: 'Khaosod English – Bangkok', rssUrl: 'https://www.khaosodenglish.com/bangkok/feed/', baseUrl: 'https://khaosodenglish.com' }
  ],
  'Duitsland – Bundesweit und regional': [
    { name: 'Der Spiegel', rssUrl: 'https://www.spiegel.de/international/index.rss', baseUrl: 'https://spiegel.de' },
    { name: 'Süddeutsche Zeitung', rssUrl: 'https://rss.sueddeutsche.de/rss/TopNews.xml', baseUrl: 'https://sueddeutsche.de' },
    { name: 'Die Welt', rssUrl: 'https://www.welt.de/feeds/latest.rss', baseUrl: 'https://welt.de' },
    { name: 'Frankfurter Allgemeine', rssUrl: 'https://www.faz.net/rss/aktuell/', baseUrl: 'https://faz.net' },
    { name: 'Tagesschau', rssUrl: 'https://www.tagesschau.de/xml/rss2', baseUrl: 'https://tagesschau.de' },
    { name: 'Focus', rssUrl: 'https://www.focus.de/feeds/rss/focus-1.968.rss', baseUrl: 'https://focus.de' },
    { name: 'Zeit Online', rssUrl: 'https://www.zeit.de/index.rdf', baseUrl: 'https://zeit.de' },
    { name: 'Stuttgarter Zeitung', rssUrl: 'https://www.stuttgarter-zeitung.de/rss', baseUrl: 'https://stuttgarter-zeitung.de' },
    { name: 'Hamburger Abendblatt', rssUrl: 'https://www.abendblatt.de/hamburg/feed', baseUrl: 'https://abendblatt.de' },
    { name: 'Rheinische Post', rssUrl: 'https://rp-online.de/rss', baseUrl: 'https://rp-online.de' },
    { name: 'Berliner Zeitung', rssUrl: 'https://www.berliner-zeitung.de/feed', baseUrl: 'https://berliner-zeitung.de' },
    { name: 'Kölner Stadt-Anzeiger', rssUrl: 'https://www.ksta.de/rss', baseUrl: 'https://ksta.de' },
    { name: 'Münchner Merkur', rssUrl: 'https://www.merkur.de/muenchen/rss', baseUrl: 'https://merkur.de' },
    { name: 'Frankfurter Rundschau', rssUrl: 'https://www.fr.de/rss', baseUrl: 'https://fr.de' },
    { name: 'WAZ – Essen', rssUrl: 'https://www.waz.de/rss', baseUrl: 'https://waz.de' },
    { name: 'Tagesspiegel – Berlin', rssUrl: 'https://www.tagesspiegel.de/rss/berlin/', baseUrl: 'https://tagesspiegel.de' },
    { name: 'Mitteldeutsche Zeitung', rssUrl: 'https://www.mz.de/rss', baseUrl: 'https://mz.de' },
    { name: 'Ostsee-Zeitung', rssUrl: 'https://www.ostsee-zeitung.de/rss', baseUrl: 'https://ostsee-zeitung.de' },
    { name: 'General-Anzeiger Bonn', rssUrl: 'https://ga.de/rss', baseUrl: 'https://ga.de' },
    { name: 'Nordwest-Zeitung', rssUrl: 'https://www.nwzonline.de/rss', baseUrl: 'https://nwzonline.de' }
  ],
  'België – Nationaal': [
    { name: 'Gazet van Antwerpen', rssUrl: 'https://www.gva.be/rss/home', baseUrl: 'https://gva.be' }
  ],
  'België – Vlaanderen (Antwerpen)': [
    { name: 'Gazet van Antwerpen – Antwerpen', rssUrl: 'https://www.gva.be/rss/home', baseUrl: 'https://gva.be' }
  ],
  'België – Wallonië (Luik)': [
    { name: 'La Meuse', rssUrl: 'https://www.lameuse.be/rss', baseUrl: 'https://lameuse.be' }
  ],
  'VK – National and regional': [
    { name: 'BBC News', rssUrl: 'http://feeds.bbci.co.uk/news/rss.xml', baseUrl: 'https://bbc.co.uk' },
    { name: 'The Guardian UK', rssUrl: 'https://www.theguardian.com/uk/rss', baseUrl: 'https://theguardian.com' },
    { name: 'The Independent', rssUrl: 'https://www.independent.co.uk/news/uk/rss', baseUrl: 'https://independent.co.uk' },
    { name: 'Daily Express', rssUrl: 'https://feeds.feedburner.com/daily-express-news-showbiz', baseUrl: 'https://express.co.uk' },
    { name: 'Evening Standard', rssUrl: 'https://www.standard.co.uk/news?view=rss', baseUrl: 'https://standard.co.uk' },
    { name: 'Metro UK', rssUrl: 'https://metro.co.uk/news/feed/', baseUrl: 'https://metro.co.uk' },
    { name: 'Manchester Evening News', rssUrl: 'https://www.manchestereveningnews.co.uk/news/?service=rss', baseUrl: 'https://menmedia.co.uk' },
    { name: 'Liverpool Echo', rssUrl: 'https://www.liverpoolecho.co.uk/news/rss/', baseUrl: 'https://liverpoolecho.co.uk' },
    { name: 'Birmingham Mail', rssUrl: 'https://www.birminghammail.co.uk/rss/', baseUrl: 'https://birminghammail.co.uk' },
    { name: 'Leeds Live', rssUrl: 'https://www.leeds-live.co.uk/rss.xml', baseUrl: 'https://leeds-live.co.uk' },
    { name: 'Bristol Post', rssUrl: 'https://www.bristolpost.co.uk/rss', baseUrl: 'https://bristolpost.co.uk' },
    { name: 'Hull Daily Mail', rssUrl: 'https://www.hulldailymail.co.uk/rss', baseUrl: 'https://hulldailymail.co.uk' },
    { name: 'West Scotland', rssUrl: 'https://www.dailyrecord.co.uk/rss/', baseUrl: 'https://dailyrecord.co.uk' },
    { name: 'Scotsman', rssUrl: 'https://www.scotsman.com/news/rss.xml', baseUrl: 'https://scotsman.com' },
    { name: 'London Evening Standard – World', rssUrl: 'https://www.standard.co.uk/news/world/rss', baseUrl: 'https://standard.co.uk' },
    { name: 'Wales Online', rssUrl: 'https://www.walesonline.co.uk/rss', baseUrl: 'https://walesonline.co.uk' },
    { name: 'Yorkshire Evening Post', rssUrl: 'https://www.yorkshireeveningpost.co.uk/rss.xml', baseUrl: 'https://yorkshireeveningpost.co.uk' },
    { name: 'Hull Live', rssUrl: 'https://www.hulldailymail.co.uk/rss/', baseUrl: 'https://hull-live.co.uk' },
    { name: 'South Wales Echo', rssUrl: 'https://www.walesonline.co.uk/rss', baseUrl: 'https://walesonline.co.uk' },
    { name: 'Evening News Aberdeen', rssUrl: 'https://www.eveningexpress.co.uk/rss/', baseUrl: 'https://eveningexpress.co.uk' }
  ]
};

const DUTCH_NATIONAL_NEWS_SOURCES = [
  { name: 'NOS', rssUrl: 'https://feeds.nos.nl/nosnieuwsalgemeen', baseUrl: 'https://nos.nl' },
  { name: 'NU.nl', rssUrl: 'https://www.nu.nl/rss/algemeen', baseUrl: 'https://www.nu.nl' }
];

const NATIONAL_NEWS_SOURCES = [
  { name: 'NOS', rssUrl: 'https://feeds.nos.nl/nosnieuwsalgemeen', baseUrl: 'https://nos.nl' },
  { name: 'NU.nl', rssUrl: 'https://www.nu.nl/rss/algemeen', baseUrl: 'https://www.nu.nl' },
  { name: 'France24 (ENG)', rssUrl: 'https://www.france24.com/en/rss', baseUrl: 'https://france24.com' },
  { name: 'El País (Spanje)', rssUrl: 'https://feeds.elpais.com/mrss-s/publico', baseUrl: 'https://elpais.com' },
  { name: 'South China Morning Post (China)', rssUrl: 'https://www.scmp.com/rss/asia/china', baseUrl: 'https://scmp.com' },
  { name: 'New York Times (VS)', rssUrl: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', baseUrl: 'https://nytimes.com' },
  { name: 'Corriere della Sera (Italië)', rssUrl: 'https://rss.corriere.it/rss/homepage.xml', baseUrl: 'https://corriere.it' },
  { name: 'Hürriyet Daily News (Turkije)', rssUrl: 'https://www.hurriyetdailynews.com/rss', baseUrl: 'https://hurriyetdailynews.com' },
  { name: 'El Universal (Mexico)', rssUrl: 'https://www.eluniversal.com.mx/rss.xml', baseUrl: 'https://eluniversal.com.mx' },
  { name: 'Bangkok Post (Thailand)', rssUrl: 'https://www.bangkokpost.com/rss/data/boom.rss', baseUrl: 'https://bangkokpost.com' },
  { name: 'Der Spiegel (Duitsland)', rssUrl: 'https://www.spiegel.de/international/index.rss', baseUrl: 'https://spiegel.de' },
  { name: 'BBC News (VK)', rssUrl: 'http://feeds.bbci.co.uk/news/rss.xml', baseUrl: 'https://bbc.co.uk' }
];

// --- PROCESSING LOGIC ---

// Creates a standardized NewsArticle object from an RSS item.
const processArticleFields = async (item: any, source: any, location: Location): Promise<NewsArticle | null> => {
  try {
    const publishedAt = new Date(item.pubDate || item.published || item.date).toISOString();
    const content = item.description || item['content:encoded'] || item.content?.['#text'] || item.content || item.summary || '';
    const cleanContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Efficiently find the thumbnail from data already present in the feed.
    let thumbnail: string | null = (Array.isArray(item.enclosure) ? item.enclosure[0]?.['@_url'] : item.enclosure?.['@_url']) || 
                    (Array.isArray(item['media:content']) ? item['media:content'][0]?.['@_url'] : item['media:content']?.['@_url']) || 
                    (Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0]?.['@_url'] : item['media:thumbnail']?.['@_url']) || 
                    '';
      if (!thumbnail) {
      thumbnail = extractFirstImageFromHtml(content);
    }
  
    const articleUrl = extractTextFromXml(item.link) || extractTextFromXml(item.guid);
        
    // If still no thumbnail, try fetching from the article page itself as a last resort
    if (!thumbnail && articleUrl) {
      thumbnail = await fetchImageFromUrl(articleUrl);
    }

      return {
      id: btoa(articleUrl), // URL-safe Base64 ID
      title: extractTextFromXml(item.title),
      content: extractTextFromXml(cleanContent),
      summary: extractTextFromXml(cleanContent).replace(/<[^>]+>/g, '').substring(0, 200),
      thumbnail: thumbnail || '',
        location: location.city,
        publishedAt,
      source: extractTextFromXml(source.name),
      author: extractTextFromXml(item.author) || extractTextFromXml(item.creator) || extractTextFromXml(source.name),
        category: 'lokaal',
        relevanceScore: 0,
      url: articleUrl,
      relativeTime: getRelativeTime(publishedAt),
      sourceType: SOURCE_TYPES.RSS,
      rawRssContent: content,
    };
  } catch (e) {
    console.error(`Error processing RSS item from ${source.name}:`, e, 'Item:', item);
    return null;
  }
};

// Filters and sorts the collected articles.
const processArticles = (articles: NewsArticle[], location: Location): NewsArticle[] => {
  const uniqueArticles = articles.reduce((acc: NewsArticle[], article) => {
    const isDuplicate = acc.some(existing => existing.url === article.url);
    if (!isDuplicate) acc.push(article);
    return acc;
  }, []);
  
  const internationalPlaceNames = [
    'india', 'verenigde staten', 'vs', 'china', 'frankrijk', 'spanje', 'italië', 'turkije', 'mexico', 'thailand', 'duitsland', 'belgië', 'verenigd koninkrijk', 'vk',
    'parijs', 'toulouse', 'barcelona', 'valencia', 'new york', 'san francisco', 'rome', 'milaan', 'istanbul', 'mexico-stad', 'guadalajara', 'bangkok', 'münchen', 'antwerpen', 'luik', 'londen', 'manchester'
  ];
  
  const dutchCityTerms = [
    'eersel', 'eindhoven', 'tilburg', 'breda', 'den bosch', 's-hertogenbosch', 'roosendaal', 'bergen op zoom', 'etten-leur', 'oosterhout', 'waalwijk', 'moerdijk', 'zevenbergen', 'klundert', 'willemstad', 'fijnaart', 'standdaarbuiten', 'noordhoek', 'oudenbosch', 'rotterdam', 'den haag', 'leiden', 'dordrecht', 'delft', 'gouda', 'zoetermeer', 'amsterdam', 'haarlem', 'alkmaar', 'zaanstad', 'hoorn', 'amstelveen', 'utrecht', 'amersfoort', 'nieuwegein', 'zeist', 'vianen', 'nijmegen', 'arnhem', 'apeldoorn', 'ede', 'zutphen', 'enschede', 'zwolle', 'deventer', 'hengelo', 'almelo', 'maastricht', 'heerlen', 'venlo', 'sittard', 'roermond', 'leeuwarden', 'drachten', 'sneek', 'heerenveen', 'groningen', 'delfzijl', 'assen', 'emmen', 'meppel', 'middelburg', 'vlissingen', 'goes', 'terneuzen', 'almere', 'lelystad', 'brabant'
  ];

  const determineArticleLocation = (text: string, userLocation: Location): string => {
    const lowerText = text.toLowerCase();
    
    // 1. Search for any known local/regional city in the text first.
    const localAndRegionalCities = [...new Set([userLocation.city, ...(userLocation.nearbyCities || []), ...dutchCityTerms].map(c => c.toLowerCase()))];

    for (const city of localAndRegionalCities) {
      if (new RegExp(`\\b${city}\\b`, 'i').test(lowerText)) {
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }

    // 2. Search for international place names.
    for (const place of internationalPlaceNames) {
      if (new RegExp(`\\b${place}\\b`, 'i').test(lowerText)) {
        return place.charAt(0).toUpperCase() + place.slice(1);
      }
    }
    
    // 3. Default to the user's city only if no other location is found.
    return userLocation.city;
  };

  const processedArticles = uniqueArticles.map(article => {
    const source = article.source.toLowerCase();
    const contentText = `${article.title} ${article.content}`;
    const articleDisplayLocation = determineArticleLocation(contentText, location);
    const lowerContentText = contentText.toLowerCase();
    
    const isDutchLocation = location.country === 'Nederland';
    let relevanceScore = 0;
    let category: 'belangrijk' | 'lokaal' | 'regionaal' = 'regionaal';

    // Give a base score for foreign articles so they are not filtered out
    if (!isDutchLocation) {
      relevanceScore = 5;
    }

    const isNationalSource = DUTCH_NATIONAL_NEWS_SOURCES.some(s => s.name.toLowerCase() === source);

    // Check for relevance to the user's specific location (city + nearby)
    const locationTerms = [location.city.toLowerCase(), ...(location.nearbyCities || []).map(city => city.toLowerCase())];
    const hasLocalRelevance = locationTerms.some(term => new RegExp(`\\b${term}\\b`, 'gi').test(lowerContentText));
    
    // Check for broader regional relevance (any Dutch city or regional source)
    const hasBroaderRegionalRelevance = dutchCityTerms.some(term => new RegExp(`\\b${term}\\b`, 'gi').test(lowerContentText)) || source.includes('brabant') || source.includes('bd.nl') || source.includes('bndestem');

    // If it's a Dutch national source without local relevance, filter it out. This rule does not apply to foreign news.
    if (isDutchLocation && isNationalSource && !hasLocalRelevance) {
      relevanceScore = 0;
    } else {
      // For local sources, or national news with local relevance, calculate the score.
      if (hasLocalRelevance) {
        relevanceScore += 10;
        category = 'lokaal';
      }
      
      if (hasBroaderRegionalRelevance) {
        relevanceScore += 5;
        if (category !== 'lokaal') category = 'regionaal';
      }
      
      const importantTerms = ['belangrijk', 'urgent', 'breaking', 'update', 'waarschuwing', 'alert'];
      if (importantTerms.some(term => lowerContentText.includes(term)) && (hasLocalRelevance || hasBroaderRegionalRelevance)) {
        relevanceScore += 3;
        if (category === 'lokaal') category = 'belangrijk';
      }
      
      const ageInHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
      if (ageInHours < 24) {
        relevanceScore += Math.max(0, (24 - ageInHours) / 24 * 5);
      } else {
        relevanceScore *= 0.5;
      }
      
      if (source.includes('brabant') || source.includes('bndestem') || source.includes('bd.nl')) {
        relevanceScore += 3;
      }
    }
    
    return { ...article, location: articleDisplayLocation, relevanceScore, category };
  });

  return processedArticles
    .filter(article => article.relevanceScore > 4) // Stricter filtering
    .sort((a, b) => {
      const categoryPriority = { 'belangrijk': 3, 'lokaal': 2, 'regionaal': 1 };
      const priorityDiff = categoryPriority[b.category] - categoryPriority[a.category];
      if (priorityDiff !== 0) return priorityDiff;
      const dateComparison = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (dateComparison !== 0) return dateComparison;
        return b.relevanceScore - a.relevanceScore;
    });
};

// --- CORE FETCHING LOGIC ---

const getSourcesForLocation = (location: Location): Array<{ name: string; rssUrl: string; baseUrl: string }> => {
  const sources = new Set<{ name: string; rssUrl: string; baseUrl: string }>();

  if (location.country === 'Nederland') {
    // For Dutch locations, add sources from the specific province (region)
    if (location.region && LOCAL_NEWS_SOURCES[location.region]) {
      LOCAL_NEWS_SOURCES[location.region].forEach(s => sources.add(s));
    }
    // And add national Dutch sources
    DUTCH_NATIONAL_NEWS_SOURCES.forEach(s => sources.add(s));
  } else {
    // For foreign locations, find the list of sources that starts with the country name
    const countryKey = Object.keys(LOCAL_NEWS_SOURCES).find(k => 
      k.toLowerCase().startsWith(location.country.toLowerCase())
    );
    if (countryKey) {
      LOCAL_NEWS_SOURCES[countryKey].forEach(s => sources.add(s));
    }
  }

  // Fallback to national sources of the user's country if no specific sources were found
  if (sources.size === 0) {
    const nationalKey = Object.keys(LOCAL_NEWS_SOURCES).find(k => 
      k.toLowerCase().startsWith(location.country.toLowerCase())
    );
    if (nationalKey) {
      LOCAL_NEWS_SOURCES[nationalKey].forEach(s => sources.add(s));
    }
  }

  return Array.from(sources);
};

const fetchRSSFeeds = async (location: Location): Promise<NewsArticle[]> => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseAttributeValue: true,
  });

  const sourcesToFetch = getSourcesForLocation(location);
  console.log(`Fetching from ${sourcesToFetch.length} sources for ${location.city}`, sourcesToFetch.map(s=>s.name));


  let allArticles: NewsArticle[] = [];

  const feedPromises = sourcesToFetch.map(async (source) => {
    try {
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(source.rssUrl)}`;
      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) }); // 10-second timeout
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const xmlText = await response.text();
      const result = parser.parse(xmlText);
      const items = result.rss?.channel?.item || result.feed?.entry || [];
      
      const articlePromises = items.map((item: any) => processArticleFields(item, source, location));
      
      const processedArticles = (await Promise.all(articlePromises))
        .filter((article): article is NewsArticle => article !== null);
        
      return processedArticles;
    } catch (error) {
      console.error(`Error fetching or parsing RSS feed ${source.name}:`, error);
      return [];
    }
  });

  const results = await Promise.all(feedPromises);
  return results.flat();
};

// --- MAIN EXPORT ---

// Location-aware cache to store articles per city/region.
const articlesCache: { [locationKey: string]: { articles: NewsArticle[], timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getNews = async (
  location: Location, 
  page = 1, 
  filter: NewsFilter = 'alles',
  pageSize = 9
): Promise<{ articles: NewsArticle[], hasMore: boolean }> => {
  const now = Date.now();
  const locationKey = `${location.city}-${location.region}`;
  const cachedEntry = articlesCache[locationKey];

  let currentArticles: NewsArticle[] = [];

  // Use cache if it's recent and for the correct location, otherwise refetch
  if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION) {
    console.log(`Using cached articles for ${locationKey} (Page ${page}).`);
    currentArticles = cachedEntry.articles;
  } else {
    console.log(`Cache expired or empty for ${locationKey}. Fetching fresh articles.`);
    const rssArticles = await fetchRSSFeeds(location);
    console.log(`Found ${rssArticles.length} total articles from all feeds for ${locationKey}.`);
    
    if (rssArticles.length === 0) {
      console.warn("No articles were found from any RSS feed.");
      currentArticles = [];
    } else {
      currentArticles = processArticles(rssArticles, location);
    }
    
    // Store the newly fetched and processed articles in the location-specific cache
    articlesCache[locationKey] = {
      articles: currentArticles,
      timestamp: now,
    };
    console.log(`Processing complete. Total processed articles in cache for ${locationKey}: ${currentArticles.length}`);
  }

  const filteredArticles = filter === 'alles'
    ? currentArticles
    : currentArticles.filter(a => a.category === filter);

  // Paginate from the current articles (either from cache or freshly fetched)
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
  const hasMore = endIndex < filteredArticles.length;
  
  console.log(`Returning page ${page} with ${paginatedArticles.length} articles for ${locationKey}. Has more: ${hasMore}`);

  return { articles: paginatedArticles, hasMore };
}; 
