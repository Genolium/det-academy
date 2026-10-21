import { NextResponse } from 'next/server';
import { buildInstitutionMapCatalog, getInstitutionMapStats } from '@/lib/institution-catalog';

export const dynamic = 'force-static';

export async function GET() {
  const catalog = buildInstitutionMapCatalog();
  return NextResponse.json(
    {
      institutions: catalog,
      stats: getInstitutionMapStats(catalog),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    }
  );
}
