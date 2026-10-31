import { redirect } from 'next/navigation';

/** Coach scores are entered on problems ("Điểm HLV"); Green Cards are on the Top 30 tab. */
export default function OldFinalAssessmentPage({ params }: { params: { id: string } }) {
  redirect(`/quan-tri/giai-dau/${params.id}/vong`);
}
