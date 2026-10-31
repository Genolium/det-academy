import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Политика данных — DET Academy',
  description: 'Как DET Academy хранит аккаунт, прогресс, ответы и аудио, и как работает согласие на обезличенную калибровку.',
  alternates: { canonical: '/privacy' },
};
export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
