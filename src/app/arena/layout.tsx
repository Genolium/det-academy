import { notFound } from 'next/navigation';

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  // The arena is feature-flagged off while rating and anti-abuse are unfinished.
  // A paused screen still exposes league/duel concepts, so the route is hidden
  // entirely until the flag is enabled at build time.
  if (process.env.NEXT_PUBLIC_ARENA_ENABLED !== 'true') notFound();
  return children;
}
