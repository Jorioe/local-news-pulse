import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { NewsArticle, Location, NewsFilter } from '../types/news';
import { getNews } from '../services/newsService';
import { useState, useEffect } from 'react';
import useLanguageStore from '../store/languageStore';

export const useNews = (location: Location | null, filter: NewsFilter) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { language } = useLanguageStore();

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('newsapp-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Use React Query's useInfiniteQuery for pagination
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['news', location?.city, location?.region, filter, language, JSON.stringify(location?.nearbyCities)],
    queryFn: async ({ pageParam = 1 }) => {
      if (!location) return { articles: [], hasMore: false };
      const pageData = await getNews(location, pageParam, filter, language);
      // Map favorites status to the newly fetched articles
      const articlesWithFavorites = pageData.articles.map(article => ({
        ...article,
        isFavorite: favorites.includes(article.id)
      }));
      return { ...pageData, articles: articlesWithFavorites };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    enabled: !!location,
    initialPageParam: 1,
    gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const toggleFavorite = (articleId: string) => {
    const newFavorites = favorites.includes(articleId)
      ? favorites.filter(id => id !== articleId)
      : [...favorites, articleId];
    
    setFavorites(newFavorites);
    localStorage.setItem('newsapp-favorites', JSON.stringify(newFavorites));
    
    // Update the article in the infinite query cache
    queryClient.setQueryData(
      ['news', location?.city, location?.region, filter, language, JSON.stringify(location?.nearbyCities)], 
      (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            articles: page.articles.map((article: NewsArticle) => 
              article.id === articleId 
                ? { ...article, isFavorite: !article.isFavorite } 
                : article
            ),
          })),
        };
      }
    );
  };

  const allArticles = data?.pages.flatMap(page => page.articles) || [];

  return {
    articles: allArticles,
    loading: isLoading,
    error: error ? 'Failed to fetch news articles' : null,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    toggleFavorite
  };
};
