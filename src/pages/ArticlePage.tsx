import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Image as ImageIcon, ExternalLink, Loader2 } from 'lucide-react';
import { NewsArticle } from '../types/news';
import useLanguageStore from '../store/languageStore';
import useTranslation from '../hooks/useTranslation';

const ArticlePage: React.FC = () => {
  const { state } = useLocation();
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(state?.article || null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const language = useLanguageStore((s) => s.language);
  const { translateText, isTranslating, error: translationError, setError: setTranslationError } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (state?.article) {
      setArticle(state.article);
    }
  }, [id, state]);

  useEffect(() => {
    const translateArticle = async () => {
      if (article && language !== 'nl') {
        // Sanitize content by removing script/style tags before translation
        const sanitizedContent = article.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                                                  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

        const translation = await translateText(sanitizedContent, language);
        setTranslatedContent(translation);
      } else {
        setTranslatedContent(null);
        setTranslationError(null);
      }
    };
    translateArticle();
  }, [article, language, translateText, setTranslationError]);

  const handleImageError = () => {
    console.error(`ArticleDetail: Image failed to load. URL: ${article?.thumbnail}`);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Artikel niet gevonden</h1>
        <p className="text-gray-600 mb-6">Het artikel kon niet worden geladen. Dit kan gebeuren als je de pagina hebt vernieuwd.</p>
        <Link to="/" className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors">
          <ArrowLeft className="inline-block mr-2" size={16} />
          Terug naar het overzicht
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="text-gray-700" />
            </Link>
            <div className="text-center">
              <span className="text-sm font-medium text-gray-500 truncate max-w-xs">{article.source}</span>
            </div>
            <div className="w-8"></div> {/* Spacer */}
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 pb-8 text-gray-900">
        {/* Hero Image */}
        <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden my-6 relative">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-pulse w-24 h-24 rounded-full bg-gray-200" />
            </div>
          )}
          
          {imageError || !article.thumbnail ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-center p-4">
              <ImageIcon className="w-16 h-16 text-gray-300 mb-3" />
              <span className="text-sm text-gray-400">Geen afbeelding</span>
            </div>
          ) : (
            <img 
              src={article.thumbnail} 
              alt={article.title}
              crossOrigin="anonymous"
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          )}
        </div>

        {/* Article Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-accent leading-tight mb-4">
            {article.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <MapPin size={16} className="mr-1" />
              <span>{article.location}</span>
            </div>
            
            <span>•</span>
            <span>{article.relativeTime || new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Bron: {article.source}</span>
              {/* <span className="mx-2">•</span> */}
              {/* <span>Door {article.author}</span> */}
            </div>

            <div className="flex items-center gap-4">
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                Lees origineel
                <ExternalLink size={14} />
              </a>
            
              {/* <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                article.category === 'belangrijk' 
                  ? 'bg-red-100 text-red-700'
                  : article.category === 'regionaal'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
              </span> */}
            </div>
          </div>
        </div>

        {/* Article Content */}
        {isTranslating ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
            <span className="ml-4 text-gray-600">Tekst vertalen...</span>
          </div>
        ) : translationError ? (
          <div>
            <div 
              className="prose prose-lg max-w-none mb-4" 
              dangerouslySetInnerHTML={{ __html: article.content }} 
            />
            <div className="text-center p-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Vertalen is mislukt.</p>
              <a
                href={`https://translate.google.com/?sl=auto&tl=${language}&text=${encodeURIComponent(article.content.replace(/<[^>]+>/g, ''))}&op=translate`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Vertaal via Google Translate
              </a>
            </div>
          </div>
        ) : (
        <div 
          className="prose prose-lg max-w-none" 
            dangerouslySetInnerHTML={{ __html: translatedContent || article.content }} 
        />
        )}
      </div>
    </div>
  );
};

export default ArticlePage; 