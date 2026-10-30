"use client";

export const dynamic = "force-dynamic";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** The news list lives in the "Tin tức" tab of the competition page now. */
export default function CompetitionNewsRedirect() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/competitions/${params.id}?tab=news`);
  }, [params.id, router]);
  return null;
}
