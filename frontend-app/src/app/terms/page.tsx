import LegalPage from '@/components/shell/LegalPage';
import docs from '@/content/legal/terms';

export default function TermsPage() {
  return <LegalPage docs={docs} updated="07/06/2026" current="/terms" />;
}
