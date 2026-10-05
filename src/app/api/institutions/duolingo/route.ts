import { NextResponse } from 'next/server';
import institutionsData from '@/data/duolingoInstitutions.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('q') || '').trim().toLowerCase();
  const country = (searchParams.get('country') || '').trim();
  const programType = (searchParams.get('type') || '').trim().toUpperCase();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20', 10)));

  let filtered = institutionsData as Array<{
    id: string;
    accountId: string;
    name: string;
    country: string;
    state: string;
    websiteUrl: string;
    fulfillsRequirement: boolean;
    programTypes: string[];
    programsCount: number;
    programs: Array<{
      type: string;
      name: string;
      country: string;
      state: string;
      link: string;
      useCase: string;
      applicantIdTypes: string[];
    }>;
  }>;

  if (search) {
    filtered = filtered.filter(
      (inst) =>
        inst.name.toLowerCase().includes(search) ||
        (inst.state && inst.state.toLowerCase().includes(search)) ||
        (inst.country && inst.country.toLowerCase().includes(search))
    );
  }

  if (country && country !== 'All') {
    filtered = filtered.filter((inst) => inst.country.toLowerCase() === country.toLowerCase());
  }

  if (programType && programType !== 'ALL') {
    filtered = filtered.filter((inst) => inst.programTypes.includes(programType));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const items = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}
