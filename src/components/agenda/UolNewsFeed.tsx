
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

const UolNewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('https://rss.uol.com.br/feed/noticias.xml');
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');
        
        const newsItems = Array.from(items).slice(0, 10).map(item => ({
          title: item.querySelector('title')?.textContent || '',
          link: item.querySelector('link')?.textContent || '',
          pubDate: item.querySelector('pubDate')?.textContent || ''
        }));
        
        setNews(newsItems);
      } catch (error) {
        console.error('Error fetching RSS feed:', error);
      }
    };

    fetchNews();
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % 10);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (news.length === 0) {
    return null;
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
      />
      <span className="flex-1 truncate">
        {currentNews.title}
      </span>
    </a>
  );
};

export default UolNewsFeed;

