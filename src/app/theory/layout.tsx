import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Теория DET — формат, стратегии и разбор заданий',
  description: 'Разбор всех типов заданий Duolingo English Test: формат, тайминг, критерии и стратегии выполнения.',
  alternates: { canonical: '/theory' },
};
export default function TheoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
