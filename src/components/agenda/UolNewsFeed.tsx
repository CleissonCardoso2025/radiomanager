
import React, { useState, useEffect } from 'react';
import { Rss, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try multiple CORS proxies to increase chances of success
        const corsProxies = [
          'https://corsproxy.io/?',
          'https://api.allorigins.win/raw?url='
        ];
        
        let response = null;
        let proxyUsed = '';
        
        // Try each proxy until one works
        for (const proxy of corsProxies) {
          const targetUrl = encodeURIComponent('https://rss.uol.com.br/feed/noticias.xml');
          try {
            console.log(`Trying proxy: ${proxy}`);
            const tempResponse = await fetch(`${proxy}${targetUrl}`, {
              headers: {
                'Accept': 'application/xml, text/xml; charset=UTF-8',
                'Accept-Charset': 'UTF-8'
              }
            });
            
            if (tempResponse.ok) {
              response = tempResponse;
              proxyUsed = proxy;
              console.log(`Successfully fetched with proxy: ${proxy}`);
              break;
            }
          } catch (proxyError) {
            console.error(`Error with proxy ${proxy}:`, proxyError);
          }
        }
        
        if (!response || !response.ok) {
          throw new Error('Failed to fetch news from all available proxies');
        }
        
        const text = await response.text();
        console.log(`Raw XML response first 200 chars from ${proxyUsed}:`, text.substring(0, 200)); 
        
        if (!text || text.trim().length === 0) {
          throw new Error('Empty response received from proxy');
        }
        
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
              // Try multiple approaches to decode the text properly
              let title = titleElement.textContent;
              let decodedTitle = title;
              
              try {
                // Method 1: Use decodeURIComponent(escape())
                decodedTitle = decodeURIComponent(escape(title));
              } catch (decodeError) {
                console.warn('First decode method failed:', decodeError);
                try {
                  // Method 2: Directly use the string
                  decodedTitle = title;
                } catch (fallbackError) {
                  console.warn('Fallback decode method failed:', fallbackError);
                  // Just use the original as last resort
                  decodedTitle = title;
                }
              }
              
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
        console.log("First news item:", newsItems[0]);
        setNews(newsItems);
      } catch (err) {
        console.error('Error fetching RSS feed:', err);
        setError('Failed to load news');
        
        // Show a toast notification with the error
        toast({
          title: "Erro ao carregar notícias",
          description: "Não foi possível carregar o feed de notícias UOL",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
    
    // Try fetching again in 30 seconds if it failed the first time
    const retryTimer = setTimeout(() => {
      if (news.length === 0) {
        console.log("Retrying news fetch after 30 seconds");
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse w-full">
        <Newspaper className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">Carregando notícias...</span>
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground w-full">
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
