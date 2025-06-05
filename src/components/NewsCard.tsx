
import React from 'react';
import { Bookmark, BookmarkMinus, MapPin } from 'lucide-react';
import { NewsArticle } from '../types/news';

interface NewsCardProps {
  article: NewsArticle;
  onToggleFavorite: (articleId: string) => void;
  onClick: (article: NewsArticle) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onToggleFavorite, onClick }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Net gepubliceerd';
    if (diffInHours < 24) return `${diffInHours}u geleden`;
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={() => onClick(article)}
    >
      <div className="aspect-video bg-gray-200 relative overflow-hidden">
        <img 
          src={article.thumbnail} 
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(article.id);
            }}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all duration-200"
          >
            {article.isFavorite ? (
              <BookmarkMinus className="text-orange-500" size={16} />
            ) : (
              <Bookmark className="text-gray-600" size={16} />
            )}
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="font-bold text-gray-900 text-xl leading-snug mb-3 line-clamp-2">
          {article.title}
        </h3>
        
        <p className="text-gray-600 text-base mb-4 line-clamp-2 leading-relaxed">
          {article.summary}
        </p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center">
            <MapPin size={14} className="mr-1.5" />
            <span>{article.location}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>{formatTime(article.publishedAt)}</span>
            <span>•</span>
            <span className="font-medium">{article.source}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Door {article.author}
          </span>
          
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
    </div>
  );
};

export default NewsCard;
