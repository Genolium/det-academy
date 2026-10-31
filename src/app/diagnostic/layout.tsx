import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Диагностика DET — DET Academy',
  robots: { index: false, follow: true },
};
export default function DiagnosticLayout({ children }: { children: React.ReactNode }) {
  return children;
}
