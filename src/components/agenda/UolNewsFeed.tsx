
import React, { useState, useEffect } from 'react';
import { Rss, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
        
        // Use a different CORS proxy that might work better with UTF-8 encoding
        const proxyUrl = 'https://corsproxy.io/?';
        const targetUrl = encodeURIComponent('https://rss.uol.com.br/feed/noticias.xml');
        const response = await fetch(`${proxyUrl}${targetUrl}`, {
          headers: {
            'Accept': 'application/xml, text/xml; charset=UTF-8',
            'Accept-Charset': 'UTF-8'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Raw XML response first 200 chars:', text.substring(0, 200)); 
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        
        if (xml.querySelector('parsererror')) {
          console.error('XML parse error:', xml.querySelector('parsererror')?.textContent);
          throw new Error('Invalid XML response');
        }
        
        const items = xml.querySelectorAll('item');
        
        if (items.length === 0) {
          console.log('No items found in the XML feed');
          throw new Error('No news items found in feed');
        }
        
        console.log(`Found ${items.length} items in XML feed`);
        
        const newsItems: NewsItem[] = [];
        
        // Process items one by one with better error handling
        for (let i = 0; i < Math.min(items.length, 10); i++) {
          try {
            const item = items[i];
            const titleElement = item.querySelector('title');
            const linkElement = item.querySelector('link');
            const pubDateElement = item.querySelector('pubDate');
            
            if (titleElement && titleElement.textContent) {
              const title = titleElement.textContent;
              // Handle UTF-8 encoding - try multiple approaches
              const decodedTitle = decodeURIComponent(escape(title));
              
              newsItems.push({
                title: decodedTitle,
                link: linkElement?.textContent || '#',
                pubDate: pubDateElement?.textContent || ''
              });
            }
          } catch (itemError) {
            console.error('Error processing news item:', itemError);
          }
        }
        
        if (newsItems.length === 0) {
          throw new Error('Failed to process any news items');
        }
        
        console.log("UOL news items loaded:", newsItems.length);
        setNews(newsItems);
      } catch (err) {
        console.error('Error fetching RSS feed:', err);
        setError('Failed to load news');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
    
    // Try fetching again in 30 seconds if it failed the first time
    const retryTimer = setTimeout(() => {
      if (news.length === 0) {
        fetchNews();
      }
    }, 30000);
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (news.length > 0 ? (prev + 1) % news.length : 0));
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(retryTimer);
    };
  }, [news.length]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <Newspaper className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">Carregando notícias...</span>
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Rss className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{error || 'Notícias indisponíveis'}</span>
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
        "flex items-center gap-2 text-sm overflow-hidden w-full",
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
