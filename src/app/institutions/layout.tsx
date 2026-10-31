import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Вузы и DET — реестр Duolingo English Test',
  description: 'Реестр вузов, которые упоминают Duolingo English Test. Данные носят справочный характер и не являются официальными требованиями приёма.',
  alternates: {
    canonical: '/institutions',
    languages: {
      ru: '/institutions',
      en: '/institutions?lang=en',
      'x-default': '/institutions',
    },
  },
};
export default function InstitutionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
