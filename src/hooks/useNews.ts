import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NewsArticle, Location, NewsFilter } from '../types/news';
import { getNews } from '../services/newsService';
import { useState, useEffect } from 'react';

export const useNews = (location: Location | null, filter: NewsFilter) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('newsapp-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Use React Query for news data
  const { data: articles = [], isLoading, error } = useQuery<NewsArticle[]>({
    queryKey: ['news', location?.city, location?.region],
    queryFn: async () => {
      if (!location) return [];
      const newsArticles = await getNews(location);
      return newsArticles.map(article => ({
        ...article,
        isFavorite: favorites.includes(article.id)
      }));
    },
    enabled: !!location,
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false // Don't refetch when window regains focus
  });

  const toggleFavorite = (articleId: string) => {
    const newFavorites = favorites.includes(articleId)
      ? favorites.filter(id => id !== articleId)
      : [...favorites, articleId];
    
    setFavorites(newFavorites);
    localStorage.setItem('newsapp-favorites', JSON.stringify(newFavorites));
    
    // Update the article in the cache
    queryClient.setQueryData<NewsArticle[]>(['news', location?.city, location?.region], 
      (oldData = []) => oldData.map(article => ({
        ...article,
        isFavorite: article.id === articleId ? !article.isFavorite : article.isFavorite
      }))
    );
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
    loading: isLoading,
    error: error ? 'Failed to fetch news articles' : null,
    toggleFavorite
  };
};
