import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Пробный тест DET — DET Academy',
  robots: { index: false, follow: true },
};
export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
