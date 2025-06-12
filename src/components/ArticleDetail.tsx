import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bookmark, BookmarkMinus, MapPin, Share, Image as ImageIcon } from 'lucide-react';
import { NewsArticle } from '../types/news';

interface ArticleDetailProps {
  article: NewsArticle;
  onBack: () => void;
  onToggleFavorite: (articleId: string) => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack, onToggleFavorite }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconden geleden`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minuut' : 'minuten'} geleden`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'uur' : 'uur'} geleden`;
    }
    
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleImageError = () => {
    console.error(`ArticleDetail: Image failed to load. URL: ${article.thumbnail}`);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  useEffect(() => {
    // ... existing code ...
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b mb-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <button 
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-1" />
              <span>Terug</span>
            </button>
            
            <div className="flex items-center space-x-2">
              {/* <button
                onClick={() => onToggleFavorite(article.id)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                {article.isFavorite ? (
                  <BookmarkMinus className="text-orange-500" size={20} />
                ) : (
                  <Bookmark className="text-gray-600" size={20} />
                )}
              </button>
              
              <button 
                onClick={() => navigator.share({ url: article.url })}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Share size={20} className="text-gray-600" />
              </button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8 text-gray-900">
        {/* Hero Image */}
        <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-6 relative">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-pulse w-24 h-24 rounded-full bg-gray-200" />
            </div>
          )}
          
          {imageError ? (
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
            <span>{article.relativeTime || formatDate(article.publishedAt)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{article.source}</span>
              <span className="mx-2">•</span>
              <span>Door {article.author}</span>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              article.category === 'belangrijk' 
                ? 'bg-red-100 text-red-700'
                : article.category === 'regionaal'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
            </span>
          </div>
        </div>

        {/* Article Content - Enhanced image handling */}
        <div className="prose prose-lg max-w-none">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: article.content.replace(
                /<img([^>]*)>/g, 
                (match, attributes) => `<img${attributes} loading="lazy" class="rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300" onerror="this.onerror=null; this.src='/news-placeholder.svg';">`
              ) 
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
