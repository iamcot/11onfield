"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { competitionService, CompetitionDetail } from "@/services/competition.service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/I18nProvider";
import "@/components/pp/pp.css";

/** Sends visitors to the open competition (same rule as the login page); without one, says so without naming a season. */
export default function CompetitionsPage() {
  const t = useT();
  const router = useRouter();
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    competitionService.getCurrentCompetition().then((data) => {
      setCompetition(data);
      setLoading(false);
      if (data) router.replace(`/competitions/${data.id}`);
    });
  }, [router]);

  if (loading || competition) {
    return (
      <div className="pp min-h-screen">
        <div className="pp-spin" style={{ marginTop: "40vh" }} />
      </div>
    );
  }

  return (
    <div className="pp min-h-screen">
      <div className="pp-empty" style={{ paddingTop: "30vh" }}>
        <h1 className="pp-disp" style={{ fontSize: 44, margin: 0, color: "#fff" }}>11 On Field</h1>
        <p style={{ margin: 0 }}>{t("Chương trình chưa mở. Hãy quay lại sớm nhé!")}</p>
        <Link href="/" className="pp-btn pp-btn-lime of-cut" style={{ marginTop: 16 }}>
          {t("Về trang chủ")}
        </Link>
      </div>
    </div>
  );
}
