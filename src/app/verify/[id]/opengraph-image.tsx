import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Сертификат DET Academy';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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

async function loadCertificate(id: string): Promise<CertificateRecord | null> {
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
}

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certificate = await loadCertificate(id);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#070809',
          color: '#F5F5F5',
          padding: '72px',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#D2F544',
              color: '#0C2418',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            D
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>DET Academy</span>
            <span style={{ fontSize: 18, color: '#8A8F98' }}>Публичная проверка сертификата</span>
          </div>
        </div>

        {certificate ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 24, color: '#D2F544', fontWeight: 700 }}>
              {certificate.isVerified ? 'СЕРТИФИКАТ ПОДТВЕРЖДЁН' : 'СЕРТИФИКАТ НЕ ПОДТВЕРЖДЁН'}
            </span>
            <span style={{ fontSize: 70, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05 }}>
              {certificate.candidateName}
            </span>
            <span style={{ fontSize: 28, color: '#B8BCC4' }}>
              Результат тренировочного экзамена: {certificate.overallScore}/160
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 64, fontWeight: 900, letterSpacing: -2 }}>
              Сертификат не найден
            </span>
            <span style={{ fontSize: 26, color: '#B8BCC4' }}>
              Проверьте номер или обратитесь в поддержку DET Academy.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: 20, color: '#6E737C' }}>
            Не является официальным сертификатом Duolingo English Test
          </span>
          <span style={{ fontSize: 22, color: '#D2F544', fontWeight: 700 }}>det-academy.ru</span>
        </div>
      </div>
    ),
    size
  );
}
