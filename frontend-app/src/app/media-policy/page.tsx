import LegalPage from '@/components/shell/LegalPage';
import docs from '@/content/legal/media-policy';

export default function MediaPolicyPage() {
  return <LegalPage docs={docs} updated="09/06/2026" current="/media-policy" />;
}
