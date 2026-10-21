import { NextResponse } from 'next/server';
import institutions from '@/data/duolingoInstitutions.json';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json(institutions, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
