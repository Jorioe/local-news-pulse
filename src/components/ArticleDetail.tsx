import React from 'react';
import { ArrowLeft, Bookmark, BookmarkMinus, MapPin, Share } from 'lucide-react';
import { NewsArticle } from '../types/news';

interface ArticleDetailProps {
  article: NewsArticle;
  onBack: () => void;
  onToggleFavorite: (articleId: string) => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onBack, onToggleFavorite }) => {
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
        <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden mb-6">
          <img 
            src={article.thumbnail} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
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

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
