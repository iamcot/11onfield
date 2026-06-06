"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import TopUserCard from "@/components/layout/TopUserCard";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { competitionService, CompetitionNews } from "@/services/competition.service";

export default function NewsDetailPage() {
  const params = useParams();
  const competitionId = parseInt(params.id as string);
  const newsId = parseInt(params.newsId as string);

  const [news, setNews] = useState<CompetitionNews | null>(null);
  const [recentNews, setRecentNews] = useState<CompetitionNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const allNews = await competitionService.getNews(competitionId);
        const article = allNews.find((n) => n.id === newsId) ?? null;
        setNews(article);
        setRecentNews(allNews.filter((n) => n.id !== newsId).slice(0, 15));
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [competitionId, newsId]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const SubNav = () => (
    <div className="bg-white border-b sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8 overflow-x-auto">
          <Link href={`/competitions/${competitionId}`} className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Trang chủ</Link>
          <Link href={`/competitions/${competitionId}/news`} className="py-4 px-2 border-b-2 border-green-700 text-green-700 font-medium whitespace-nowrap">Tin tức</Link>
          <Link href={`/competitions/${competitionId}/leaderboard`} className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Bảng xếp hạng</Link>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <TopBar />
        <TopUserCard />
        <SubNav />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700" />
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <TopBar />
        <TopUserCard />
        <SubNav />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Không tìm thấy tin tức</p>
            <Link href={`/competitions/${competitionId}/news`} className="inline-block mt-4 text-green-700 hover:underline">
              Quay lại danh sách tin tức
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20 md:pb-0">
      <TopBar />
      <TopUserCard />
      <SubNav />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main article */}
          <div className="flex-1 min-w-0">
            <Link href={`/competitions/${competitionId}/news`} className="inline-flex items-center text-green-700 hover:underline mb-4 text-sm">
              ← Quay lại danh sách tin tức
            </Link>

            <article className="bg-white rounded-lg shadow overflow-hidden">
              {news.thumbnail && (
                <div className="relative w-full aspect-video">
                  <Image src={news.thumbnail} alt={news.title} fill className="object-cover" />
                </div>
              )}
              <div className="p-6 md:p-8">
                <h1 className="text-2xl md:text-4xl font-bold mb-4">{news.title}</h1>
                <div className="flex items-center text-gray-500 text-sm mb-6 pb-6 border-b flex-wrap gap-2">
                  {news.authorName && <span>Bởi {news.authorName}</span>}
                  <span>{formatDate(news.publishedAt)}</span>
                </div>
                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: news.content }} />
              </div>
            </article>
          </div>

          {/* Sidebar — recent news */}
          <div className="hidden md:block w-[280px] shrink-0">
            <div className="bg-white rounded-lg shadow p-4 sticky top-32">
              <h4 className="font-bold mb-3 pb-2 border-b">Tin tức gần đây</h4>
              <div className="space-y-3">
                {recentNews.map((article) => (
                  <Link key={article.id} href={`/competitions/${competitionId}/news/${article.id}`}
                        className="flex gap-3 hover:opacity-80 transition">
                    {article.thumbnail ? (
                      <div className="relative w-20 h-14 shrink-0 rounded overflow-hidden">
                        <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-14 shrink-0 rounded bg-gray-100" />
                    )}
                    <p className="text-sm line-clamp-3 font-medium">{article.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <LandingFooter />
      <MobileNav />
    </div>
  );
}
