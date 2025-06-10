import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ArticleDetail from '../components/ArticleDetail';
import { NewsArticle } from '../types/news';
import { ExternalLink } from 'lucide-react';

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Try to find the article in the React Query cache first
  const { data: article, isError } = useQuery<NewsArticle>({
    queryKey: ['article', id],
    queryFn: () => {
      // First try to find the article in the React Query cache
      const queries = queryClient.getQueriesData<NewsArticle[]>({ queryKey: ['news'] });
      
      for (const [_, articles] of queries) {
        if (articles) {
          const article = articles.find(a => a.id === id);
          if (article) {
            return article;
          }
        }
      }

      // If not found in React Query cache, try localStorage as fallback
      const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('news-cache-'));
      for (const key of cacheKeys) {
        try {
          const cacheData = JSON.parse(localStorage.getItem(key) || '{}');
          if (cacheData.articles && Array.isArray(cacheData.articles)) {
            const article = cacheData.articles.find((a: NewsArticle) => a.id === id);
            if (article) {
              // Add to React Query cache for future use
              queryClient.setQueryData(['news', article.location], (old: NewsArticle[] = []) => {
                if (!old.some(a => a.id === article.id)) {
                  return [...old, article];
                }
                return old;
              });
              return article;
            }
          }
        } catch (e) {
          console.error(`Error reading cache ${key}:`, e);
        }
      }

      throw new Error('Article not found');
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: false // Don't retry if article is not found
  });

  const handleBack = () => {
    navigate(-1);
  };

  const handleToggleFavorite = (articleId: string) => {
    // Get current favorites from localStorage
    const favorites = JSON.parse(localStorage.getItem('newsapp-favorites') || '[]');
    
    // Toggle favorite status
    const newFavorites = favorites.includes(articleId)
      ? favorites.filter((id: string) => id !== articleId)
      : [...favorites, articleId];
    
    // Save to localStorage
    localStorage.setItem('newsapp-favorites', JSON.stringify(newFavorites));

    // Update article in cache
    if (article) {
      queryClient.setQueryData(['article', id], {
        ...article,
        isFavorite: !article.isFavorite
      });
    }
  };

  if (isError || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Artikel niet gevonden</h1>
          <p className="text-gray-600 mb-6">
            Het artikel dat je zoekt bestaat niet of is niet meer beschikbaar. 
            Dit kan gebeuren als het artikel is verwijderd of als de cache is verlopen.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Terug naar home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ArticleDetail 
        article={article} 
        onBack={handleBack}
        onToggleFavorite={handleToggleFavorite}
      />
      
      {/* Original Article Link */}
      <div className="fixed bottom-6 right-6">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
        >
          <span>Origineel artikel</span>
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};

export default ArticlePage; 