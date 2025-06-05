import { useState, useEffect } from 'react';
import { NewsArticle, Location, NewsFilter } from '../types/news';
import { fetchAllNews } from '../services/newsService';

export const useNews = (location: Location | null, filter: NewsFilter) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('newsapp-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      if (!location) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const newsArticles = await fetchAllNews(location);
        setArticles(newsArticles.map(article => ({
          ...article,
          isFavorite: favorites.includes(article.id)
        })));
      } catch (error) {
        setError('Failed to fetch news articles');
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [location, favorites]);

  const toggleFavorite = (articleId: string) => {
    const newFavorites = favorites.includes(articleId)
      ? favorites.filter(id => id !== articleId)
      : [...favorites, articleId];
    
    setFavorites(newFavorites);
    localStorage.setItem('newsapp-favorites', JSON.stringify(newFavorites));
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
    loading,
    error,
    toggleFavorite
  };
};
