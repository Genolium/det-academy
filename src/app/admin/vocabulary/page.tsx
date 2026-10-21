'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, VocabularyEntry } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

const STATUSES = ['draft', 'reviewed', 'published', 'archived'] as const;

export default function AdminVocabularyPage() {
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [entries, setEntries] = useState<VocabularyEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    setLoading(true);
    api
      .getAdminVocabulary()
      .then((response) => setEntries(response.entries || []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.role]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return entries;
    return entries.filter(
      (entry) =>
        entry.word.toLowerCase().includes(normalized) ||
        (entry.meaningRu || '').toLowerCase().includes(normalized)
    );
  }, [entries, query]);

  const updateStatus = async (entry: VocabularyEntry, status: string) => {
    setUpdating(entry.id);
    setError(null);
    try {
      await api.updateVocabularyStatus(entry.id, status);
      setEntries((current) =>
        current.map((item) => (item.id === entry.id ? { ...item, status } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить статус');
    } finally {
      setUpdating(null);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="rounded-3xl border border-neutral-800 bg-[#0E1012] p-10 text-center text-white">
          <h1 className="text-xl font-black">Доступ только для администратора</h1>
          <Link href="/" className="mt-4 inline-block text-xs text-[#D2F544] underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070809] text-white py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D2F544]">
              Publishing workflow
            </p>
            <h1 className="text-3xl font-black tracking-tight">Словарь: публикация</h1>
            <p className="mt-2 text-xs text-neutral-400 max-w-2xl">
              Draft → reviewed → published → archived. Публичный API отдаёт только статус
              <code className="mx-1 text-[#D2F544]">published</code>.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-2xl border border-neutral-700 px-4 py-2 text-xs font-bold text-neutral-300 hover:text-white"
          >
            ← В админку
          </Link>
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-[#0E1012] p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по слову или переводу..."
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm outline-none focus:border-[#D2F544]"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200">
            {error}
          </div>
        )}
        {loading && <p className="text-sm text-neutral-400">Загрузка...</p>}

        <div className="space-y-2">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-neutral-800 bg-[#0E1012] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-black text-white">{entry.word}</span>
                  <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
                    {entry.level}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                      entry.status === 'published'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : entry.status === 'archived'
                        ? 'bg-neutral-800 text-neutral-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-400 truncate">{entry.meaningRu}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    disabled={updating === entry.id || entry.status === status}
                    onClick={() => void updateStatus(entry, status)}
                    className={`rounded-xl px-3 py-1.5 text-[10px] font-bold transition-colors ${
                      entry.status === status
                        ? 'bg-[#D2F544] text-[#0C2418]'
                        : 'border border-neutral-700 text-neutral-300 hover:border-neutral-500'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
