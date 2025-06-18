import { Language, NewsArticle } from '../types/news';

const DEEPL_API_KEY = import.meta.env.VITE_DEEPL_API_KEY || "YOUR_DEEPL_API_KEY_PLACEHOLDER";
const API_URL = 'https://api-free.deepl.com/v2/translate';

const translationCache = new Map<string, string>();

export const translateText = async (
  text: string,
  targetLang: Language
): Promise<string> => {
  if (!text || !targetLang) return text;

  const targetLangUpper = targetLang.split('-')[0].toUpperCase();
  if (targetLangUpper === 'NL') return text;

  const cacheKey = `${targetLangUpper}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  if (!DEEPL_API_KEY || DEEPL_API_KEY === "YOUR_DEEPL_API_KEY_PLACEHOLDER") {
    console.warn("DeepL API key is not configured. Skipping translation.");
    return `${text} (not translated)`;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLangUpper,
        source_lang: 'NL',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`DeepL API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const translatedText = data.translations[0].text;
    translationCache.set(cacheKey, translatedText);
    return translatedText;
  } catch (error) {
    console.error('Error translating text:', error);
    return text;
  }
};

export const translateArticle = async (
  article: NewsArticle,
  targetLang: Language
): Promise<NewsArticle> => {
  if (!targetLang || targetLang === 'nl') {
    return article;
  }

  const [translatedTitle, translatedSummary] = await Promise.all([
    translateText(article.title, targetLang),
    translateText(article.summary, targetLang),
  ]);

  return {
    ...article,
    title: translatedTitle,
    summary: translatedSummary,
  };
}; 