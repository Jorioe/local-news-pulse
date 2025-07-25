import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkMinus, MapPin, Image as ImageIcon } from 'lucide-react';
import { NewsArticle } from '../types/news';
import { useNavigate } from 'react-router-dom';

interface NewsCardProps {
  article: NewsArticle;
  onToggleFavorite: (articleId: string) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onToggleFavorite }) => {
  const navigate = useNavigate();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Reset state when the article prop changes.
    // If the thumbnail is empty/falsy initially, it will trigger onError immediately.
    setImageError(false);
    setImageLoading(true);
  }, [article.thumbnail]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Net gepubliceerd';
    if (diffInHours < 24) return `${diffInHours}u geleden`;
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  const handleClick = () => {
    // Navigate to the article detail page and pass the article object in the state
    navigate(`/article/${article.id}`, { state: { article } });
  };

  const handleImageError = () => {
    console.error(`❌ NewsCard: Image FAILED to load for article: "${article.title}". Attempted URL was: "${article.thumbnail}"`);
    setImageLoading(false);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(`✅ NewsCard: Image loaded successfully for article: "${article.title}".`);
    setImageLoading(false);
    setImageError(false);
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
      onClick={handleClick}
    >
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-pulse w-16 h-16 rounded-full bg-gray-200" />
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
            <ImageIcon className="w-12 h-12 text-gray-300 mb-2" />
            <span className="text-xs text-gray-400">Geen afbeelding</span>
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
            loading="lazy"
          />
        )}
        <div className="absolute top-4 right-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(article.id);
            }}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all duration-200"
          >
            {article.isFavorite ? (
              <BookmarkMinus className="text-orange-500" size={16} />
            ) : (
              <Bookmark className="text-gray-600" size={16} />
            )}
          </button>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex gap-2 flex-wrap">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 ${
              article.category === 'belangrijk' 
                ? 'bg-red-100 text-red-700'
                : article.category === 'regionaal'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
            </span>
            {article.contentCategory && (
              <span className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 bg-purple-100 text-purple-700">
                {article.contentCategory.charAt(0).toUpperCase() + article.contentCategory.slice(1)}
              </span>
            )}
          </div>
          {/* <span className="text-sm text-gray-500 truncate">
            {article.author}
          </span> */}
        </div>
        
        <h3 className="font-bold text-gray-900 text-xl leading-tight mb-3 line-clamp-2 flex-grow">
          {article.title}
        </h3>
        
        <p className="text-gray-600 text-base mb-4 line-clamp-3 leading-relaxed">
          {article.summary}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center">
            <MapPin size={14} className="mr-2" />
            <span className="truncate">{article.location}</span>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            <span>{formatTime(article.publishedAt)}</span>
            <span>•</span>
            <span className="font-medium truncate max-w-24">{article.source}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
