"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Avatar as AvatarComponent } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CryptoIcon,
  ChevronIcon,
  // ChevronLeftIcon,
  // ChevronRightIcon,
  SearchIcon,
  ArrowRightIcon,
  TimeIcon,
} from "@/components/ui/icons";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, BellIcon } from 'lucide-react';
import Newsletter from "@/components/NewsFooter/Newsletter";
import Footer from "@/components/NewsFooter/Footer";

// Inters
interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  source: {
    name: string;
    icon?: string;
  };
  publishedAt: string;
}

interface TwitterPost {
  id: string;
  text: string;
  user: {
    name: string;
    screen_name: string;
    profile_image_url: string;
  };
  created_at: string;
}

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
}

const DEFAULT_FALLBACK_IMAGE = "https://cdn-icons-png.flaticon.com/512/4588/4588164.png";

// Add new animation keyframes
const gradientAnimation = {
  '@keyframes gradient': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
  '.animate-gradient-x': {
    backgroundSize: '200% 200%',
    animation: 'gradient 15s ease infinite',
  },
};

// Add the styles to your Tailwind config if not already present
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animate-gradient-x {
      background-size: 200% 200%;
      animation: gradient 15s ease infinite;
    }
  `;
  document.head.appendChild(style);
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 6;
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [prevPageToken, setPrevPageToken] = useState<string | null>(null);
  const [redditNews, setRedditNews] = useState<NewsArticle[]>([]);
  const [nextRedditPageToken, setNextRedditPageToken] = useState<string | null>(null);
  const [prevRedditPageToken, setPrevRedditPageToken] = useState<string | null>(null);
  const [twitterPosts, setTwitterPosts] = useState<TwitterPost[]>([]);
  const [nextTwitterPageToken, setNextTwitterPageToken] = useState<string | null>(null);
  const [prevTwitterPageToken, setPrevTwitterPageToken] = useState<string | null>(null);
  const [rssNews, setRssNews] = useState<NewsArticle[]>([]);
  const [rssLoading, setRssLoading] = useState(true);

  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "YOUR_YOUTUBE_API_KEY";

  const next = () => {
    if (currentIndex + itemsPerPage < news.length) {
      setCurrentIndex(currentIndex + itemsPerPage);
    }
  };

  const prev = () => {
    if (currentIndex - itemsPerPage >= 0) {
      setCurrentIndex(currentIndex - itemsPerPage);
    }
  };

  const fetchRedditNews = async (afterToken: string | null = null, query: string = "cryptocurrency") => {
    try {
      const redditResponse = await fetch(
        `https://www.reddit.com/r/CryptoCurrency/search.json?q=${query}&sort=top&limit=9${afterToken ? `&after=${afterToken}` : ""
        }`
      );
      const redditData = await redditResponse.json();
      const redditArticles = redditData.data.children.map((child: any) => ({
        title: child.data.title,
        url: `https://www.reddit.com${child.data.permalink}`,
        urlToImage: child.data.thumbnail,
        source: { name: 'Reddit' },
        publishedAt: new Date(child.data.created_utc * 1000).toISOString(),
      }));
      setRedditNews(redditArticles);
      setNextRedditPageToken(redditData.data.after);
      setPrevRedditPageToken(redditData.data.before);
    } catch (err) {
      setError("Failed to fetch Reddit news");
    }
  };
  const [gNews, setGNews] = useState<NewsArticle[]>([]);
  const [gNewsLoading, setGNewsLoading] = useState(true);
  const [gNewsError, setGNewsError] = useState<string | null>(null);
  const [gNewsCurrentPage, setGNewsCurrentPage] = useState(1);
  const gNewsItemsPerPage = 3;

  const fetchGNews = async (query: string = "cryptocurrency") => {
    try {
      setGNewsLoading(true);
      const API_KEY = process.env.NEXT_PUBLIC_GNEWS_API_KEY;
      if (!API_KEY) {
        throw new Error("GNews API key is not configured");
      }

      console.log("Fetching GNews with API key:", API_KEY.substring(0, 5) + '...');
      console.log("Query:", query);

      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=us&max=9&apikey=${API_KEY}`;
      console.log("Fetch URL:", url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response text:", errorText);
        throw new Error(`Failed to fetch GNews. Status: ${response.status}, ${errorText}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      const gNewsArticles = data.articles.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.image || DEFAULT_FALLBACK_IMAGE,
        source: {
          name: article.source.name || 'GNews',
          icon: undefined
        },
        publishedAt: article.publishedAt || new Date().toISOString()
      }));

      setGNews(gNewsArticles);
      setGNewsError(null);
    } catch (err) {
      console.error("Detailed GNews Error:", err);
      setGNewsError(err instanceof Error ? err.message : "An unknown error occurred");
      setGNews([]);
    } finally {
      setGNewsLoading(false);
    }
  };

  const handleGNewsPageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(gNews.length / gNewsItemsPerPage)) {
      setGNewsCurrentPage(newPage);
    }
  };

  useEffect(() => {
    fetchGNews();
  }, []);

  // const fetchNews = async (query: string) => {
  //   const API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;

  //   try {
  //     setLoading(true);
  //     const response = await fetch(
  //       `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&apiKey=${API_KEY}&pageSize=24`,
  //       {
  //         headers: {
  //           'X-Api-Key': API_KEY || '',
  //           'Accept': 'application/json',
  //           'User-Agent': 'CryoW3Times/1.0',
  //         },
  //         next: { revalidate: 300 }, // Cache for 5 minutes
  //       }
  //     );

  //     if (response.status === 426) {
  //       throw new Error("API version upgrade required. Please check News API documentation.");
  //     }

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || "Failed to fetch news");
  //     }

  //     const data = await response.json();

  //     if (!data.articles || !Array.isArray(data.articles)) {
  //       throw new Error("Invalid response format from News API");
  //     }

  //     const processedArticles = data.articles.map((article: NewsArticle) => ({
  //       ...article,
  //       urlToImage: article.urlToImage || DEFAULT_FALLBACK_IMAGE,
  //       publishedAt: article.publishedAt || new Date().toISOString(),
  //       source: {
  //         name: article.source?.name || 'Unknown Source',
  //         icon: article.source?.icon || DEFAULT_FALLBACK_IMAGE
  //       }
  //     }));

  //     setNews(processedArticles);
  //     setError(null);
  //   } catch (err) {
  //     console.error('News API Error:', err);
  //     setError(err instanceof Error ? err.message : "Failed to fetch news. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchYouTubeVideos = async (query: string = "cryptocurrency news") => {
    try {
      const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      if (!API_KEY) {
        console.warn("YouTube API key is not configured");
        setYoutubeVideos([]);
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=9&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`
      );

      if (!response.ok) {
        console.warn(`YouTube API request failed with status: ${response.status}`);
        setYoutubeVideos([]);
        return;
      }

      const data = await response.json();
      const videos = data.items.map((item: any) => ({
        id: { videoId: item.id.videoId },
        videoId: item.id.videoId,
        snippet: {
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          thumbnails: {
            medium: {
              url: item.snippet.thumbnails.medium.url
            }
          }
        },
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnails: {
          medium: {
            url: item.snippet.thumbnails.medium.url
          }
        },
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }));

      setYoutubeVideos(videos);
    } catch (error) {
      console.warn("Error fetching YouTube videos:", error);
      setYoutubeVideos([]);
    }
  };

  interface RSSItem {
    title: string;
    description: string;
    link: string;
    thumbnail?: string;
    enclosure?: {
      link: string;
    };
    pubDate: string;
  }

  interface RSSFeed {
    items: RSSItem[];
    feed: {
      title: string;
      favicon?: string;
    };
  }

  const fetchRSSFeeds = async () => {
    try {
      setRssLoading(true);
      const feeds = [
        'https://www.newsbtc.com/feed/',
        'https://bitcoinmagazine.com/.rss/full/',
        'https://cryptopotato.com/feed/'
      ];

      const responses = await Promise.all(
        feeds.map(feed =>
          fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`)
        )
      );

      const data = await Promise.all(responses.map(res => res.json()));

      const transformedArticles = data.flatMap((feed: RSSFeed) =>
        feed.items.map((item: RSSItem) => ({
          title: item.title,
          description: item.description,
          url: item.link,
          urlToImage: item.thumbnail || item.enclosure?.link,
          source: {
            name: feed.feed.title,
            icon: feed.feed.favicon
          },
          publishedAt: item.pubDate
        }))
      );

      // Sort by date and take latest 6 articles
      const sortedArticles = transformedArticles
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 9);

      setRssNews(sortedArticles);
      setError(null);
    } catch (err) {
      console.error('RSS Feed Error:', err);
      setError("Failed to fetch RSS feeds. Please try again.");
    } finally {
      setRssLoading(false);
    }
  };
  /* current news function */
  // const fetchCurrentsNews = async () => {
  //   try {
  //     setRssLoading(true);
  //     const apiKey = 'bvwzz-YoLk9Matt4f9rweH7BpWj7XlCfUK06czIuYCjFpLYs'; // Replace with your Currents API key
  //     const endpoint = 'https://api.currentsapi.services/v1/latest-news';
  //     const query = 'cryptocurrency'; // You can customize the search query
  //     const count = 9; // Number of articles to fetch

  //     const response = await fetch(`${endpoint}?category=${encodeURIComponent(query)}&language=en&apiKey=${apiKey}`);

  //     if (!response.ok) {
  //       throw new Error('Failed to fetch news');
  //     }

  //     const data = await response.json();

  //     const transformedArticles = data.news.map((item) => ({
  //       title: item.title,
  //       description: item.description,
  //       url: item.url,
  //       urlToImage: item.image || item.urlToImage,
  //       source: {
  //         name: item.source,
  //         icon: item.icon, // If the source has an icon, you can use this
  //       },
  //       publishedAt: item.published,
  //     }));

  //     // Sort by date and take the latest 6 articles
  //     const sortedArticles = transformedArticles
  //       .sort(
  //         (a, b) =>
  //           new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  //       )
  //       .slice(0, count);

  //     setRssNews(sortedArticles);
  //     setError(null);
  //   } catch (err) {
  //     console.error("Currents API Error:", err);
  //     setError("Failed to fetch news. Please try again.");
  //   } finally {
  //     setRssLoading(false);
  //   }
  // };


  const fetchTwitterPosts = async (query: string, pageToken: string | null = null) => {
    try {
      setLoading(true);

      const url = `https://twitter-api45.p.rapidapi.com/usermedia.php?screenname=${encodeURIComponent(query)}${pageToken ? `&pagination_token=${encodeURIComponent(pageToken)}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": "7760b52a34mshe145977f1ea47fep190b18jsn60ad0f119d3",
          "X-RapidAPI-Host": "twitter-api45.p.rapidapi.com",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Twitter posts: ${response.status}`);
      }

      const data = await response.json();

      // Transform the API response to match our TwitterPost interface
      const transformedPosts = data?.map((tweet: any) => ({
        id: tweet.id_str || tweet.id,
        text: tweet.text || tweet.full_text,
        user: {
          name: tweet.user.name,
          screen_name: tweet.user.screen_name,
          profile_image_url: tweet.user.profile_image_url_https || tweet.user.profile_image_url,
        },
        created_at: tweet.created_at,
      })) || [];

      setTwitterPosts(transformedPosts);

      // Update pagination tokens if available in the response
      setNextTwitterPageToken(data.pagination_token || null);
      setPrevTwitterPageToken(null); // This endpoint might not support previous page
      setError(null);
    } catch (err) {
      console.error('Twitter API Error:', err);
      setError("Failed to fetch Twitter posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavbarSearch = (query: string) => {
    setSearchTerm(query);
    // fetchCurrentsNews(query)
    // fetchNews(query);

    fetchYouTubeVideos(query);
    fetchRedditNews(null, query);
    fetchRSSFeeds(); // Keep RSS feeds as they are crypto-specific already
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // fetchCurrentsNews(searchTerm.trim());
      // fetchNews(searchTerm.trim());
      fetchYouTubeVideos(searchTerm.trim());
      fetchRedditNews(null, searchTerm.trim());
      fetchTwitterPosts("elonmusk"); // Keep showing Elon's tweets regardless of search
    }
  };

  const handleNextRedditPage = () => {
    if (nextRedditPageToken) {
      fetchRedditNews(nextRedditPageToken, searchTerm);
    }
  };

  const handlePrevRedditPage = () => {
    if (prevRedditPageToken) {
      fetchRedditNews(prevRedditPageToken, searchTerm);
    }
  };

  const handleNextTwitterPage = () => {
    if (nextTwitterPageToken) {
      fetchTwitterPosts(searchTerm, nextTwitterPageToken);
    }
  };

  const handlePrevTwitterPage = () => {
    if (prevTwitterPageToken) {
      fetchTwitterPosts(searchTerm, prevTwitterPageToken);
    }
  };

  useEffect(() => {
    const defaultQuery = "cryptocurrency news";
    setSearchTerm(defaultQuery);
    fetchGNews(defaultQuery);
    // fetchNews(defaultQuery);
    fetchYouTubeVideos(defaultQuery);
    fetchRedditNews(null, defaultQuery);
    fetchRSSFeeds();
  }, []);

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }} className="min-h-screen bg-gradient-to-br from-[#0D0B12] text-gray-100 animate-gradient-x">
      {/* Navigation */}
      <div className="fixed p-4  inset-0 z-0 select-none pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full">
          {/* Purple gradient lines */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_45%,rgba(123,97,255,0.1)_45%,rgba(123,97,255,0.1)_55%,transparent_55%)]" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_35%,rgba(123,97,255,0.1)_35%,rgba(123,97,255,0.1)_45%,transparent_45%)]" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[linear-gradient(45deg,transparent_25%,rgba(123,97,255,0.1)_25%,rgba(123,97,255,0.1)_35%,transparent_35%)]" />
        </div>
      </div>
      <nav className="sticky top-0 z-50 bg-[#0D0B12]/90 backdrop-blur-xl border-b border-[#2A2438] shadow-lg p-4">
        <div className="container flex font-sans items-center justify-between">
          {/* Logo or website title */}
          <h1 className="text-2xl font-bold text-gray-100">CryoW3Times</h1>
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleNavbarSearch("cryptocurrency news")}
              className="text-gray-300 font-sans hover:text-white font-medium font-sans transition-colors"
            >
              Crypto News
            </button>
            <button
              onClick={() => handleNavbarSearch("nft crypto")}
              className="text-gray-300 font-sans hover:text-white font-medium transition-colors"
            >
              NFTs
            </button>
            <button
              onClick={() => handleNavbarSearch("cryptocurrency market price")}
              className="text-gray-300 font-sans hover:text-white font-medium transition-colors"
            >
              Market Updates
            </button>
            <button
              onClick={() => handleNavbarSearch("web3 blockchain")}
              className="text-gray-300 font-sans hover:text-white font-medium transition-colors"
            >
              Web3
            </button>
            <button
              onClick={() => handleNavbarSearch("defi crypto")}
              className="text-gray-300 font-sans hover:text-white font-medium transition-colors"
            >
              DeFi
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-4">
              <div className="border border-white rounded-full">
                <Button variant="ghost" size="icon" className="relative border rounded-full border-white ">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full  text-[10px] font-medium text-white flex items-center justify-center">
                    3
                  </span>
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Avatar>
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="Profile"
                    className="object-cover"
                  />
                  <AvatarFallback>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-300"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
            <Button variant="ghost" className="h-8 text-gray-300">
              En <ChevronIcon className="ml-1 h-4 w-4" />
            </Button>
            <div className="relative w-[300px] flex items-center">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter a keyword..."
                className="pl-10 h-10 rounded-full bg-[#1A1625] border border-transparent focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </nav>


      <main className="container mx-auto p-8 px-4 py-4">
        <div className="grid p-8 lg:grid-cols-[1fr_400px] gap-12">
          <div>
            {loading ? (
              <div className="space-y-8 animate-pulse">
                <div className="h-[400px] bg-[#1A1625] rounded-2xl" />
                <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-[200px] bg-[#1E293B] rounded-xl"
                    />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-800 p-4 rounded-xl">
                <p className="text-red-400 text-center">{error}</p>
              </div>
            ) : (
              <>
                {/* Best of the Week */}
                <div className="mb-12">
                  <Badge className="bg-[#2c2a3a] text-purple-500 mb-4 uppercase tracking-wider font-medium">
                    BEST OF THE WEEK
                  </Badge>
                  {news[0] && (
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Badge
                            variant="outline"
                            className="border-purple-500/30 bg-purple-500/5 text-purple-500"
                          >
                            Blockchain News
                          </Badge>
                          <span>12 hours ago</span>
                        </div>
                        <h1 className="text-3xl font-bold leading-tight">
                          {news[0].title}
                        </h1>
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className="border-gray-700 text-gray-400"
                          >
                            #Ethereum
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-gray-700 text-gray-400"
                          >
                            #Analytics
                          </Badge>
                        </div>
                        <div className="flex items-center gap-0 group">
                          <Button
                            variant="outline"
                            className="border-purple-500 bg-black rounded-full text-white hover:bg-purple-500/10"
                          >
                            Read article
                          </Button>
                          <a href="">
                            <ArrowRightIcon className="ml-0 h-10 w-10 text-purple-500 border border-purple-500 rounded-full bg-black hover:bg-purple-500/10" />
                          </a>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/20 to-[#8B5CF6]/20 rounded-3xl" />
                        <div className="relative w-full h-[300px] rounded-3xl overflow-hidden">
                          <Image
                            src={news[0].urlToImage || DEFAULT_FALLBACK_IMAGE}
                            alt={news[0].title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Latest Articles Grid */}
                {/* <section className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-4xl font-normal font-sans">Latest News</h2>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {news.slice(0, 9).map((article, index) => (
                      <Link
                        key={index}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        <Card className="bg-[#0A0B0F]/60 backdrop-blur-xl border-white/10 rounded-xl hover:rounded-2xl hover:border-[#8B5CF6]/50 transition-all duration-300">
                          <div className="relative h-48 rounded-t-xl overflow-hidden">
                            <Image
                              src={article.urlToImage || DEFAULT_FALLBACK_IMAGE}
                              alt={article.title}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#231d30] via-transparent opacity-50" />
                            <Badge className="absolute top-4 left-4 bg-[#8B5CF6]/90 hover:bg-[#7C3AED] text-white">
                              {article.source.name}
                            </Badge>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-md leading-tight group-hover:text-purple-500 transition-colors line-clamp-2 mb-3">
                              {article.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 border-2 border-purple-500/30">
                                  <Image
                                    src={
                                      article.source.icon ||
                                      'https://cdn-icons-png.flaticon.com/512/4588/4588164.png'
                                    }
                                    alt="Author"
                                    width={24}
                                    height={24}
                                  />
                                </Avatar>
                                <span className="font-small">{article.source.name}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-2 opacity-60">
                                <span>12 hours ago</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  <div className="flex justify-center gap-4 mt-6">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg disabled:bg-gray-400"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage * 9 >= totalArticles}
                      className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg disabled:bg-gray-400"
                    >
                      Next
                    </button>
                  </div>
                </section> */}
                {/* YouTube Videos */}
                <section className="mb-12 flex flex-col">
                  <div className="flex mb-4">
                    <h2 className="text-4xl w-full font-normal font-sans flex items-center justify-between">
                      YouTube Videos
                    </h2>
                    <div className="flex gap-2 mb-4 items-end justify-end">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!prevPageToken}
                        onClick={() =>
                          prevPageToken &&
                          fetchYouTubeVideos(searchTerm || "cryptocurrency", prevPageToken)
                        }
                        className="h-8 w-8 rounded-full border-gray-800"
                      >
                        <ArrowRightIcon className="rotate-180" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!nextPageToken}
                        onClick={() =>
                          nextPageToken &&
                          fetchYouTubeVideos(searchTerm || "cryptocurrency", nextPageToken)
                        }
                        className="h-8 w-8 rounded-full border-gray-800"
                      >
                        <ArrowRightIcon />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                    {youtubeVideos.slice(0, 9).map((video) => (
                      <div
                        key={video.id.videoId}
                        className="bg-[#0A0B0F]/60 backdrop-blur-xl border-white/10 rounded-xl hover:rounded-2xl hover:border-[#8B5CF6]/50  border hover:rounded-2xl hover:border-blue-500/50 rounded-xl transition-all duration-300"
                      >
                        <div className="relative rounded-2xl hover:rounded-2xl hover:border-purple-500">
                          <img
                            src={video.snippet.thumbnails.medium.url}
                            alt={video.snippet.title}
                            className="w-full h-48 rounded-t-2xl object-cover"
                          />
                          <div className="p-4 space-y-2">
                            <h3 className="text-md font-medium line-clamp-2">
                              {video.snippet.title}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {video.snippet.channelTitle}
                            </p>
                            <a
                              href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              Watch on YouTube
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Reddit Section */}
                <section className="mb-12 flex flex-col ">
                  <div className="flex mb-4">
                    <h2 className="text-4xl w-full font-normal font-sans flex items-center justify-between">
                      Reddit Highlights
                    </h2>
                    <div className="flex gap-2 mb-4 items-end justify-end">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!prevRedditPageToken}
                        onClick={handlePrevRedditPage}
                        className="h-8 w-8 rounded-full border-gray-800"
                      >
                        <ArrowRightIcon className="rotate-180" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!nextRedditPageToken}
                        onClick={handleNextRedditPage}
                        className="h-8 w-8 rounded-full border-gray-800"
                      >
                        <ArrowRightIcon />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                    {redditNews.slice(0, 9).map((article, index) => (
                      <div
                        key={index}
                        className="bg-[#0A0B0F]/60 backdrop-blur-xl border-white/10 rounded-xl hover:rounded-2xl hover:border-[#8B5CF6]/50 border hover:rounded-2xl hover:border-purple-500/50 rounded-xl transition-all duration-300"
                      >
                        <div className="relative  rounded-2xl hover:rounded-2xl hover:border-purple-500">
                          <div className="w-full h-48 relative">
                            <Image
                              src={article.urlToImage && article.urlToImage.startsWith('http') ? article.urlToImage : DEFAULT_FALLBACK_IMAGE}
                              alt={article.title}
                              fill
                              className="rounded-t-2xl object-cover"
                            />
                          </div>
                          <div className="p-4 space-y-2">
                            <h3 className="text-md font-medium line-clamp-2">{article.title}</h3>
                            <p className="text-sm text-gray-400">Source: {article.source.name}</p>
                            <p className="text-sm text-gray-400">
                              12 hours ago
                            </p>
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline inline-block mt-2"
                            >
                              Read on Reddit
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* RSS News Section */}
                <section className="mb-12 flex flex-col">
                  <div className="flex mb-4">
                    <h2 className="text-4xl w-full font-normal font-sans flex items-center justify-between">
                      Crypto News Feeds
                    </h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                    {rssNews.slice(0, 9).map((article, index) => (
                      <Link
                        key={index}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        <Card className="bg-[#0A0B0F]/60 backdrop-blur-xl border-white/10 rounded-xl hover:rounded-2xl hover:border-[#8B5CF6]/50  hover:rounded-2xl hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 transform hover:-translate-y-1">
                          <div className="relative h-48 rounded-t-xl overflow-hidden">
                            <Image
                              src={article.urlToImage || DEFAULT_FALLBACK_IMAGE}
                              alt={article.title}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#231d30] via-transparent opacity-50" />
                            <Badge className="absolute top-4 left-4 bg-purple-500/90 hover:bg-purple-600">
                              {article.source.name}
                            </Badge>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-md leading-tight group-hover:text-purple-500 transition-colors line-clamp-2 mb-3">
                              {article.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 border-2 border-purple-500/30">
                                  <Image
                                    src={article.source.icon || DEFAULT_FALLBACK_IMAGE}
                                    alt="Source"
                                    width={24}
                                    height={24}
                                  />
                                </Avatar>
                                <span className="font-small">
                                  {article.source.name}
                                </span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-2 opacity-60">
                                <span className="">
                                  12 hours ago
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
                {/* GNews Section */}
                <section className="mb-12 flex flex-col">
  <div className="flex mb-4">
    <h2 className="text-4xl w-full font-normal font-sans flex items-center justify-between">
      GNews Cryptocurrency
    </h2>
  </div>
  {gNewsLoading ? (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  ) : gNewsError ? (
    <div className="text-red-500 text-center">{gNewsError}</div>
  ) : (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
      {gNews
        .slice(
          (gNewsCurrentPage - 1) * gNewsItemsPerPage,
          gNewsCurrentPage * gNewsItemsPerPage
        )
        .map((article, index) => (
          <Link
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="bg-[#0A0B0F]/60 backdrop-blur-xl border-white/10 rounded-xl hover:rounded-2xl hover:border-[#8B5CF6]/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 transform hover:-translate-y-1">
              <div className="relative h-48 rounded-t-xl overflow-hidden">
                <Image
                  src={article.urlToImage || DEFAULT_FALLBACK_IMAGE}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#231d30] via-transparent opacity-50" />
                <Badge className="absolute top-4 left-4 bg-purple-500/90 hover:bg-purple-600">
                  {article.source.name}
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-md leading-tight group-hover:text-purple-500 transition-colors line-clamp-2 mb-3">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                  {article.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border-2 border-purple-500/30">
                      <Image
                        src={article.source.icon || DEFAULT_FALLBACK_IMAGE}
                        alt="Source"
                        width={24}
                        height={24}
                      />
                    </Avatar>
                    <span className="font-small">{article.source.name}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-2 opacity-60">
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
    </div>
  )}
  <div className="flex justify-center gap-4 mt-6">
    <button
      onClick={() => handleGNewsPageChange(gNewsCurrentPage - 1)}
      disabled={gNewsCurrentPage === 1}
      className="px-4 py-2 bg-purple-500 text-white rounded-lg disabled:bg-gray-400"
    >
      Previous
    </button>
    <button
      onClick={() => handleGNewsPageChange(gNewsCurrentPage + 1)}
      disabled={gNewsCurrentPage * gNewsItemsPerPage >= gNews.length}
      className="px-4 py-2 bg-purple-500 text-white rounded-lg disabled:bg-gray-400"
    >
      Next
    </button>
  </div>
</section>


                {/* Twitter Section */}
                {/* <section className="mb-12 flex flex-col">
                  <div className="flex mb-4">
                    <h2 className="text-xl w-full font-bold flex items-center justify-between">
                      Twitter Highlights
                    </h2>
                    <div className="flex gap-2 mb-4 items-end justify-end">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!prevTwitterPageToken}
                        onClick={handlePrevTwitterPage}
                        className="h-8 w-8 rounded-full border-gray-800"
                      >
                        <ArrowRightIcon className="rotate-180" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={!nextTwitterPageToken}
                        onClick={handleNextTwitterPage}
                        className="h-8 w-8 rounded-full border-gray-800"
                      >
                        <ArrowRightIcon />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                    {twitterPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-[#231d30] border hover:rounded-2xl hover:border-purple-500/50 rounded-xl transition-all duration-300"
                      >
                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8 border-2 border-purple-500/30">
                              <Image
                                src={post.user.profile_image_url}
                                alt={post.user.name}
                                width={32}
                                height={32}
                              />
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">{post.user.name}</p>
                              <p className="text-xs text-gray-400">@{post.user.screen_name}</p>
                            </div>
                          </div>
                          <p className="text-sm">{post.text}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(post.created_at).toLocaleString()}
                          </p>
                          <a
                            href={`https://twitter.com/${post.user.screen_name}/status/${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline inline-block mt-2 text-sm"
                          >
                            View on Twitter
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section> */}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-[#8B5CF6] rounded-[50px]" />
              <h2 className="text-4xl font-normal font-sans">Recommended</h2>
            </div>
            <div className="space-y-6">
              {news.slice(4, 5).map((article, index) => (
                <Link
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <Card className="flex gap-5 flex-col bg-[#0A0B0F]/60 backdrop-blur-xl border-white/10 rounded-xl hover:rounded-[50px] hover:border-[#8B5CF6]/50 rounded-[50px] hover:bg-[#2A2438] transition-all duration-300 hover:shadow-xl hover:shadow-[#8B5CF6]/10 transform hover:-translate-y-1">
                    <div className="relative flex w-full h-[300px]">
                      {/* Image */}
                      <Image
                        src={article.urlToImage || DEFAULT_FALLBACK_IMAGE}
                        alt={article.title}
                        fill
                        className="rounded-[50px] object-cover"
                      />

                      {/* Text Overlay */}
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#231d30]/80 via-transparent to-transparent p-4">
                        <Badge className="absolute bottom-64 left-4 bg-purple-500/90 hover:bg-purple-600">
                          {article.source.name}
                        </Badge>
                        <h3 className="font-regular text-white text-sm leading-snug group-hover:text-purple-500 transition-colors line-clamp-2 mb-2">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-2 opacity-60 text-grey-400 font-sm">
                          <span className="text-sm">12 hours ago</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}

              {news.slice(5, 48).map((article, index) => (
                <Link
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <Card className="flex gap-5 bg-[#0A0B0F]/60 backdrop-blur-xl border-white/10 rounded-xl hover:rounded-2xl hover:border-[#8B5CF6]/50  transition-all duration-300">
                    <div className="relative w-[100px] h-[100px]">
                      <Image
                        src={article.urlToImage || DEFAULT_FALLBACK_IMAGE}
                        alt={article.title}
                        fill
                        className="rounded-xl object-cover"
                      />
                    </div>
                    <div className="flex-1 p-2">
                      <h3 className="font-semibold text-sm leading-snug group-hover:text-purple-500 transition-colors line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <Badge
                          variant="outline"
                          className="text-purple-500 border-purple-500/30 bg-purple-500/5"
                        >
                          {article.source.name}
                        </Badge>
                        <div className="flex items-center gap-2 opacity-60">
                          <span>12 hours ago</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="ml-8 mr-8" >
          <Newsletter />
          <Footer onTagClick={function (tag: string): void {
            throw new Error("Function not implemented.");
          }} />
        </div>
      </main>

    </div>
  );
}

