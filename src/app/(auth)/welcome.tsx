import { WelcomeScreen } from '@/features/auth/screens/welcome-screen';
import { LanguageSection } from '@/features/language/components/language-section';

/** The way in, with the language switch under it — it belongs to its own feature. */
export default function WelcomeRoute() {
  return <WelcomeScreen footer={<LanguageSection compact />} />;
}
