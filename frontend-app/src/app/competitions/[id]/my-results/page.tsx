"use client";

export const dynamic = 'force-dynamic';

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import TopUserCard from "@/components/layout/TopUserCard";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import LandingFooter from "@/components/landing/LandingFooter";
import {
  competitionService,
  StageResult,
  CompetitionDetail,
} from "@/services/competition.service";

export default function MyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const competitionId = parseInt(resolvedParams.id);
  const router = useRouter();

  const [competition, setCompetition] = useState<CompetitionDetail | null>(
    null
  );
  const [results, setResults] = useState<StageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const competitionData =
          await competitionService.getCompetitionById(competitionId);
        setCompetition(competitionData);

        // Check if user is registered
        const registrationStatus = await competitionService.checkRegistration(
          competitionId
        );
        setIsRegistered(registrationStatus.isRegistered);

        if (!registrationStatus.isRegistered) {
          setLoading(false);
          return;
        }

        // Fetch user's results
        const resultsData = await competitionService.getMyResults(
          competitionId
        );
        setResults(resultsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        // If unauthorized (401), user is not logged in
        if ((error as any).response?.status === 401) {
          router.push(`/login?redirect=/competitions/${competitionId}/my-results`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [competitionId, router]);

  const getStageTypeBadge = (stageTitle: string) => {
    if (stageTitle.includes("Vòng tuyển trạch")) {
      return (
        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          Vòng tuyển trạch
        </span>
      );
    }
    if (stageTitle.includes("Tập")) {
      return (
        <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
          Đào tạo (Nội bộ)
        </span>
      );
    }
    if (stageTitle.includes("Chung kết")) {
      return (
        <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
          Chung kết
        </span>
      );
    }
    return null;
  };

  const formatDate = (stageNumber: number) => {
    // This is a simple helper - ideally you'd fetch stage dates from the API
    return `Vòng ${stageNumber}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <TopBar />
      <TopUserCard />
      {/* Sub-navigation */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            <Link
              href={`/competitions/${competitionId}`}
              className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              Trang chủ
            </Link>
            <Link
              href={`/competitions/${competitionId}/news`}
              className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              Tin tức
            </Link>
            <Link
              href={`/competitions/${competitionId}/leaderboard`}
              className="py-4 px-2 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap"
            >
              Bảng xếp hạng
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Kết quả của tôi</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          </div>
        ) : !isRegistered ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">
              Bạn chưa đăng ký tham gia cuộc thi này
            </p>
            <Link
              href={`/competitions/${competitionId}`}
              className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition"
            >
              Quay lại trang chủ
            </Link>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">
              Chưa có kết quả nào được công bố cho bạn
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-white text-xl font-bold">
                        {result.stageTitle}
                      </h2>
                      <p className="text-green-100 text-sm">
                        {formatDate(result.stageNumber)}
                      </p>
                    </div>
                    {getStageTypeBadge(result.stageTitle)}
                  </div>
                </div>

                <div className="p-6">
                  {/* Score and Rank */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600 text-sm mb-1">Điểm số</p>
                      <p className="text-3xl font-bold text-green-700">
                        {result.score ? result.score.toFixed(2) : "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-600 text-sm mb-1">Xếp hạng</p>
                      <p className="text-3xl font-bold text-green-700">
                        {result.rankPosition ? `#${result.rankPosition}` : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Performance Notes */}
                  {result.performanceNotes && (
                    <div className="mb-6">
                      <h3 className="text-gray-800 font-semibold mb-2">
                        Nhận xét
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {result.performanceNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Video */}
                  {result.videoUrl && (
                    <div>
                      <h3 className="text-gray-800 font-semibold mb-2">
                        Video thi đấu
                      </h3>
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe
                          src={result.videoUrl}
                          className="w-full h-full"
                          allowFullScreen
                          title={`Video ${result.stageTitle}`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Public indicator */}
                  {!result.isPublic && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm">
                        ℹ️ Kết quả này chỉ dành cho bạn và ban tổ chức (không hiển thị công khai)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <LandingFooter />
      <MobileNav />
    </div>
  );
}
