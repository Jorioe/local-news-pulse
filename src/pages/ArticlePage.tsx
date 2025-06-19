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
    <div className="bg-background min-h-screen" style={{ background: '#faf9f7' }}>
      {/* Orange Header */}
      <div className="text-white px-4 sm:px-6 pt-12 pb-8" style={{ background: '#ff5f2e' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="inline-flex items-center text-white hover:text-orange-100 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              <span className="text-sm font-medium">Terug naar overzicht</span>
            </Link>
          </div>
          <div className="mt-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-white leading-tight">
              {article.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
              <div className="flex flex-wrap items-center gap-3 text-white">
                <div className="flex items-center">
                  <MapPin size={16} className="mr-1 flex-shrink-0" />
                  <span>{article.location}</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <span>{article.relativeTime || new Date(article.publishedAt).toLocaleDateString()}</span>
                <span className="hidden sm:inline">•</span>
                <span className="font-medium">{article.source}</span>
              </div>
              <div className="flex sm:flex-none">
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-700/90 rounded-full hover:bg-gray-800 transition-colors"
                >
                  Lees origineel artikel
                  <ExternalLink size={14} className="flex-shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Hero Image */}
        <div className="aspect-video bg-white rounded-xl overflow-hidden shadow-sm relative mb-8">
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

        {/* Article Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8">
          {isTranslating ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
              <span className="ml-4 text-gray-600">Tekst vertalen...</span>
            </div>
          ) : translationError ? (
            <div>
              <div 
                className="!text-[#111827] prose prose-lg max-w-none [&_p]:!text-[#111827] [&_span]:!text-[#111827] [&_div]:!text-[#111827]" 
                dangerouslySetInnerHTML={{ __html: article.content }} 
              />
              <div className="text-center p-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Vertalen is mislukt.</p>
                <a
                  href={`https://translate.google.com/?sl=auto&tl=${language}&text=${encodeURIComponent(article.content.replace(/<[^>]+>/g, ''))}&op=translate`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  Vertaal via Google Translate
                </a>
              </div>
            </div>
          ) : (
            <div 
              className="!text-[#111827] prose prose-lg max-w-none [&_p]:!text-[#111827] [&_span]:!text-[#111827] [&_div]:!text-[#111827]" 
              dangerouslySetInnerHTML={{ __html: translatedContent || article.content }} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlePage; 