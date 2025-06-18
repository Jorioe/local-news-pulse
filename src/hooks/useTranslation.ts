import { useState, useCallback } from 'react';

const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateText = useCallback(async (text: string, targetLang: string): Promise<string | null> => {
    if (!text) return null;

    const cacheKey = `translation-${btoa(text)}-${targetLang}`;
    
    try {
      // Check cache first
      const cachedTranslation = localStorage.getItem(cacheKey);
      if (cachedTranslation) {
        return cachedTranslation;
      }

      setIsTranslating(true);
      setError(null);

      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: 'auto',
          target: targetLang,
          format: 'text',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translated = data.translatedText;

      // Save to cache
      localStorage.setItem(cacheKey, translated);

      return translated;
    } catch (err) {
      console.error(err);
      setError('Failed to translate text.');
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { isTranslating, error, translateText, setError };
};

export default useTranslation; 