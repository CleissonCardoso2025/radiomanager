
import React, { useState, useEffect } from 'react';
import { Rss, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

const UolNewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Usando um proxy CORS para evitar problemas de CORS
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = encodeURIComponent('https://rss.uol.com.br/feed/noticias.xml');
        const response = await fetch(`${proxyUrl}${targetUrl}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        
        // Check if XML has parsing errors
        if (xml.querySelector('parsererror')) {
          throw new Error('Invalid XML response');
        }
        
        const items = xml.querySelectorAll('item');
        
        if (items.length === 0) {
          throw new Error('No news items found in feed');
        }
        
        const newsItems = Array.from(items).slice(0, 10).map(item => ({
          title: item.querySelector('title')?.textContent || '',
          link: item.querySelector('link')?.textContent || '',
          pubDate: item.querySelector('pubDate')?.textContent || ''
        }));
        
        console.log("UOL news items loaded:", newsItems);
        setNews(newsItems);
      } catch (error) {
        console.error('Error fetching RSS feed:', error);
        setError('Failed to load news');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
    
    // Rotate news every 8 seconds
    const interval = setInterval(() => {
      setCurrentIndex(prev => (news.length > 0 ? (prev + 1) % news.length : 0));
    }, 8000);

    return () => clearInterval(interval);
  }, [news.length]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <Newspaper className="h-4 w-4" />
        <span>Carregando notícias...</span>
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Rss className="h-4 w-4" />
        <span>{error || 'Notícias indisponíveis'}</span>
      </div>
    );
  }

  const currentNews = news[currentIndex];

  return (
    <a 
      href={currentNews.link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 text-sm overflow-hidden whitespace-nowrap",
        "hover:text-primary transition-colors"
      )}
    >
      <span className="bg-orange-600 text-white px-1 py-0.5 text-xs font-bold rounded">UOL</span>
      <span className="flex-1 truncate">
        {currentNews.title}
      </span>
    </a>
  );
};

export default UolNewsFeed;
