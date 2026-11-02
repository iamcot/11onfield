"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { competitionService } from "@/services/competition.service";
import { quizService } from "@/services/quiz.service";
import { competitionIdInPath, newsHrefOf, quizHrefOf } from "@/lib/nav";

/**
 * Links of the main menu that depend on the competition: news, and the quiz practice when it is visible to the caller
 * (switched on, or staff testing it). The competition is the current one, else the one in the address.
 */
export function useCompetitionNav() {
  const pathname = usePathname();
  const fromPath = competitionIdInPath(pathname);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [quizVisible, setQuizVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    competitionService.getCurrentCompetition().then((c) => alive && c && setCurrentId(c.id));
    quizService.status().then((s) => alive && setQuizVisible(!!s?.visible)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const id = currentId ?? fromPath;
  return {
    newsHref: id ? newsHrefOf(id) : "/competitions",
    quizHref: id && quizVisible ? quizHrefOf(id) : null,
  };
}
