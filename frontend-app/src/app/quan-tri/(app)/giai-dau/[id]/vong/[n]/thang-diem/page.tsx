import { redirect } from 'next/navigation';

/** The scale editor now lives on the round setup screen. */
export default function OldScalePage({ params }: { params: { id: string; n: string } }) {
  redirect(`/quan-tri/giai-dau/${params.id}/vong/${params.n}`);
}
