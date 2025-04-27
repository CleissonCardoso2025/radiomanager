
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
        
        // Adding cache-busting parameter to avoid browser caching
        const response = await fetch(`https://rss.uol.com.br/feed/noticias.xml?_=${Date.now()}`);
        
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
        
        console.log("UOL news items loaded:", newsItems.length);
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
  }, []);

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
      <img 
        src="https://conteudo.imguol.com.br/c/home/layout/v2/Icon-UOL-Home.png" 
        alt="UOL Logo" 
        className="h-4 w-4"
        onError={(e) => {
          // Fallback to icon if image doesn't load
          e.currentTarget.style.display = 'none';
          const icon = document.createElement('span');
          icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM9.5 16.5L16.5 12L9.5 7.5V16.5Z" fill="currentColor"/></svg>';
          e.currentTarget.parentElement?.appendChild(icon);
        }}
      />
      <span className="flex-1 truncate">
        {currentNews.title}
      </span>
    </a>
  );
};

export default UolNewsFeed;
