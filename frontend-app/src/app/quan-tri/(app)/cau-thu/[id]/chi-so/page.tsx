'use client';

import { useParams } from 'next/navigation';
import { PlayerAttributes } from '@/components/admin/PlayerAttributes';
import { PageTitle } from '@/components/admin/ui';

export default function PlayerAttributesPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <PageTitle title="Chỉ số cầu thủ" back={{ href: `/quan-tri/cau-thu/${id}`, label: 'Hồ sơ cầu thủ' }} />
      <PlayerAttributes id={id} />
    </>
  );
}
