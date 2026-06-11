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
import {
  competitionService,
  CompetitionNews,
  CompetitionDetail,
} from "@/services/competition.service";

export default function NewsPage() {
  const params = useParams();
  const competitionId = parseInt(params.id as string);

  const [competition, setCompetition] = useState<CompetitionDetail | null>(
    null
  );
  const [news, setNews] = useState<CompetitionNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const competitionData =
          await competitionService.getCompetitionById(competitionId);
        setCompetition(competitionData);
      } catch (error) {
        console.error("Error fetching competition:", error);
      }
    };

    fetchData();
  }, [competitionId]);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const data = await competitionService.getNews(competitionId);
        setNews(data);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [competitionId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <TopBar />
      <TopUserCard />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tin tức</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Chưa có tin tức nào được công bố</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article) => (
              <Link
                key={article.id}
                href={`/competitions/${competitionId}/news/${article.id}`}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition group"
              >
                {article.thumbnail && (
                  <div className="relative w-full h-48">
                    <Image
                      src={article.thumbnail}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-green-700 transition line-clamp-2">
                    {article.title}
                  </h2>
                  <div className="text-gray-600 text-sm mb-3">
                    {article.authorName && (
                      <span className="mr-4">Bởi {article.authorName}</span>
                    )}
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                  {article.content && (
                    <p className="text-gray-700 line-clamp-3">
                      {article.shortContent || article.content.replace(/<[^>]*>/g, "")}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <LandingFooter />
      <MobileNav />
    </div>
  );
}
