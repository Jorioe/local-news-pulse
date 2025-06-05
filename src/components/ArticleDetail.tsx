
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
    return date.toLocaleDateString('nl-NL', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(article.id)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {article.isFavorite ? (
                <BookmarkMinus className="text-foreground" size={24} />
              ) : (
                <Bookmark className="text-gray-600" size={24} />
              )}
            </button>
            
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Share size={24} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
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
            <span>{formatDate(article.publishedAt)}</span>
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
          <div className="text-gray-800 leading-relaxed">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
