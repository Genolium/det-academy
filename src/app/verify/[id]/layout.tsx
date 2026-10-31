import type { Metadata } from 'next';
import { cache } from 'react';
import { absoluteUrl, SITE_NAME, SITE_URL } from '@/lib/seo/site';
import { JsonLd } from '@/components/seo/JsonLd';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL !== ''
    ? process.env.NEXT_PUBLIC_API_URL
    : 'http://localhost:18080';

interface CertificateRecord {
  id: string;
  candidateName: string;
  overallScore: number;
  issuedAt: string;
  isVerified: boolean;
}

type VerifyLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const getCertificate = cache(async (id: string): Promise<CertificateRecord | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/certificates/${encodeURIComponent(id)}`,
      { next: { revalidate: 300 } }
    );
    if (!response.ok) return null;
    return (await response.json()) as CertificateRecord;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: VerifyLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const certificate = await getCertificate(id);
  const canonical = `/verify/${encodeURIComponent(id)}`;

  if (!certificate) {
    return {
      title: 'Проверка сертификата — DET Academy',
      description:
        'Проверьте номер сертификата DET Academy. Недействительный номер не индексируется.',
      alternates: { canonical },
      robots: { index: false, follow: false },
    };
  }

  const title = `${certificate.candidateName} — сертификат DET Academy ${certificate.overallScore}/160`;
  const description = `Публичная проверка сертификата DET Academy ${certificate.id}: результат ${certificate.overallScore}/160, выдан ${new Date(
    certificate.issuedAt
  ).toLocaleDateString('ru-RU')}. Это результат тренировочного экзамена, а не официальный сертификат Duolingo.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical),
      siteName: SITE_NAME,
      type: 'profile',
      images: [
        {
          url: absoluteUrl(`${canonical}/opengraph-image`),
          width: 1200,
          height: 630,
          alt: `Сертификат DET Academy: ${certificate.candidateName}, ${certificate.overallScore}/160`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl(`${canonical}/opengraph-image`)],
    },
    robots: { index: certificate.isVerified, follow: true },
  };
}

export default async function VerifyLayout({ children, params }: VerifyLayoutProps) {
  const { id } = await params;
  const certificate = await getCertificate(id);

  const jsonLd = certificate
    ? {
        '@context': 'https://schema.org',
        '@type': 'EducationalOccupationalCredential',
        name: `DET Academy certificate ${certificate.id}`,
        description:
          'Результат тренировочного экзамена DET Academy. Не является официальным сертификатом Duolingo English Test.',
        url: absoluteUrl(`/verify/${encodeURIComponent(id)}`),
        dateCreated: certificate.issuedAt,
        credentialCategory: 'Language proficiency practice result',
        provider: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
        },
        ...(certificate.isVerified ? { identifier: certificate.id } : {}),
      }
    : null;

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd as Record<string, unknown>} /> : null}
      {children}
    </>
  );
}
