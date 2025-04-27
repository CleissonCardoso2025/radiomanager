
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
        
        // Using CORS proxy with proper UTF-8 handling
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = encodeURIComponent('https://rss.uol.com.br/feed/noticias.xml');
        const cacheParam = `&timestamp=${new Date().getTime()}`; // Cache busting
        const response = await fetch(`${proxyUrl}${targetUrl}${cacheParam}`, {
          headers: {
            'Accept': 'text/xml; charset=UTF-8',
            'Accept-Charset': 'UTF-8'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Raw XML response:', text.substring(0, 200)); // Log the first part of the response
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        
        if (xml.querySelector('parsererror')) {
          console.error('XML parse error:', xml.querySelector('parsererror')?.textContent);
          throw new Error('Invalid XML response');
        }
        
        const items = xml.querySelectorAll('item');
        console.log('Found items in XML:', items.length);
        
        if (items.length === 0) {
          throw new Error('No news items found in feed');
        }
        
        // Explicitly handle UTF-8 encoding
        const newsItems = Array.from(items).slice(0, 10).map(item => {
          const titleElement = item.querySelector('title');
          const title = titleElement?.textContent || '';
          
          return {
            title: decodeURIComponent(escape(title)), // Handle UTF-8 characters properly
            link: item.querySelector('link')?.textContent || '',
            pubDate: item.querySelector('pubDate')?.textContent || ''
          };
        });
        
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
        "flex items-center gap-2 text-sm overflow-hidden whitespace-nowrap w-full",
        "hover:text-primary transition-colors"
      )}
    >
      <span className="bg-orange-600 text-white px-1 py-0.5 text-xs font-bold rounded shrink-0">UOL</span>
      <span className="truncate flex-1">
        {currentNews.title}
      </span>
    </a>
  );
};

export default UolNewsFeed;
