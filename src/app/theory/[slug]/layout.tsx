import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { lessonsData } from '@/data/theoryContent';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lesson = lessonsData.find((item) => item.slug === slug);
  return {
    title: lesson ? `${lesson.titleRu} | DET Academy` : 'Урок DET | DET Academy',
    description: lesson?.mentorIntro?.slice(0, 160) || 'Разбор формата Duolingo English Test и стратегии выполнения заданий.',
    alternates: { canonical: `/theory/${slug}` },
  };
}

export default function LessonLayout({ children }: { children: ReactNode }) {
  return children;
}
