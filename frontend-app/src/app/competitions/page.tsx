"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { competitionService, CompetitionDetail } from "@/services/competition.service";
import Link from "next/link";

export default function CompetitionsPage() {
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    competitionService.getCurrentCompetition().then((data) => {
      setCompetition(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-gray-800">11 Người Ra Sân 2026</h1>
        <p className="text-gray-500 text-center">Chương trình chưa mở. Hãy quay lại sớm nhé!</p>
        <Link href="/" className="mt-4 px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition">
          Về trang chủ
        </Link>
      </div>
    );
  }

  // Redirect to competition detail
  window.location.replace(`/competitions/${competition.id}`);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
    </div>
  );
}
