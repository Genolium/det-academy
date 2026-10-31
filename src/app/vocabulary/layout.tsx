import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Словарь DET Academy — академические слова с IPA и примерами',
  description: 'Тренажёр словаря для Duolingo English Test: академические слова, IPA, коллокации, перевод и интервальные повторения.',
  alternates: { canonical: '/vocabulary' },
};
export default function VocabularyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
