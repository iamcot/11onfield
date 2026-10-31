import { redirect } from "next/navigation";

/** The old score ranking is gone: the public list is the selected Top 30, a tab of the competition page. */
export default function LeaderboardRedirect({ params }: { params: { id: string } }) {
  redirect(`/competitions/${params.id}?tab=top30`);
}
