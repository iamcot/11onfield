import LegalPage from '@/components/shell/LegalPage';
import docs from '@/content/legal/privacy';

export default function PrivacyPage() {
  return <LegalPage docs={docs} updated="09/06/2026" current="/privacy" />;
}
