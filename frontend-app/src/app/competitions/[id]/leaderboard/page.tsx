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
  LeaderboardEntry,
  CompetitionDetail,
} from "@/services/competition.service";

const REGIONS = [
  { value: "", label: "Tổng" },
  { value: "HANOI_NORTH", label: "Hà Nội & Phía Bắc" },
  { value: "DANANG_CENTRAL", label: "Đà Nẵng & Miền Trung" },
  { value: "HCMC_SOUTH", label: "TP HCM & Miền Nam" },
];

export default function LeaderboardPage() {
  const params = useParams();
  const competitionId = parseInt(params.id as string);

  const [competition, setCompetition] = useState<CompetitionDetail | null>(
    null
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");
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
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await competitionService.getLeaderboard(
          competitionId,
          selectedRegion || undefined
        );
        setLeaderboard(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [competitionId, selectedRegion]);

  const getRegionLabel = (region: string) => {
    const found = REGIONS.find((r) => r.value === region);
    return found ? found.label : region;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <TopBar />
      <TopUserCard />
      {/* Sub-navigation */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-8 overflow-x-auto">
            <span className="py-4 px-2 font-bold text-gray-900 whitespace-nowrap shrink-0">
              {competition?.title}
            </span>
            <div className="w-px h-6 bg-gray-300 shrink-0" />
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
              className="py-4 px-2 border-b-2 border-green-700 text-green-700 font-medium whitespace-nowrap"
            >
              Bảng xếp hạng
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Bảng xếp hạng</h1>

        {/* Region Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <button
                key={region.value}
                onClick={() => setSelectedRegion(region.value)}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  selectedRegion === region.value
                    ? "bg-green-700 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {region.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">
              Chưa có kết quả nào được công bố
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cầu thủ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khu vực
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Điểm số
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.userId}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-3 py-4 text-center w-12">
                        <span className="text-sm font-semibold text-gray-700">{entry.rank}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/profile/${entry.userProfileId}?from=leaderboard`}
                          className="flex items-center hover:text-green-700"
                        >
                          <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                            {entry.avatar ? (
                              <Image
                                src={entry.avatar}
                                alt={entry.fullName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300" />
                            )}
                          </div>
                          <span className="font-medium">{entry.fullName}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.selectedRegion && (
                          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {getRegionLabel(entry.selectedRegion)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-700">
                          {entry.totalScore.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {leaderboard.map((entry) => (
                <div key={entry.userId} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-700">#{entry.rank}</span>
                    <span className="text-xl font-bold text-green-700">
                      {entry.totalScore.toFixed(2)}
                    </span>
                  </div>
                  <Link
                    href={`/profile/${entry.userProfileId}?from=leaderboard`}
                    className="flex items-center mb-2"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden mr-3">
                      {entry.avatar ? (
                        <Image
                          src={entry.avatar}
                          alt={entry.fullName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300" />
                      )}
                    </div>
                    <span className="font-medium">{entry.fullName}</span>
                  </Link>
                  {entry.selectedRegion && (
                    <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {getRegionLabel(entry.selectedRegion)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <LandingFooter />
      <MobileNav />
    </div>
  );
}
