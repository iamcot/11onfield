import { redirect } from 'next/navigation';

/** Manual scores moved into each round (vong/[n]/diem-cham-tay), Green Cards to the Top 30 tab. */
export default function OldFinalAssessmentPage({ params }: { params: { id: string } }) {
  redirect(`/quan-tri/giai-dau/${params.id}/vong`);
}
