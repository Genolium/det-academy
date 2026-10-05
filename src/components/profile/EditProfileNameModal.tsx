'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProgressStore } from '@/store/useProgressStore';
import { X, User, CheckCircle2, AlertCircle, Loader2, Award, Sparkles } from 'lucide-react';

interface EditProfileNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newName: string) => void;
}

export const EditProfileNameModal: React.FC<EditProfileNameModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, updateProfile } = useAuthStore();
  const { candidateName, setCandidateName } = useProgressStore();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user?.name || candidateName || '');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, user?.name, candidateName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Пожалуйста, введите ваше имя');
      return;
    }
    if (trimmed.length < 2) {
      setError('Имя должно содержать минимум 2 символа');
      return;
    }
    if (trimmed.length > 70) {
      setError('Имя слишком длинное (максимум 70 символов)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ok = await updateProfile({ name: trimmed });
      if (ok) {
        setCandidateName(trimmed);
        setSuccess(true);
        if (onSuccess) onSuccess(trimmed);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setError('Не удалось сохранить изменения. Попробуйте еще раз.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении имени');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D2F544]/15 border border-[#D2F544]/30 flex items-center justify-center text-[#D2F544] shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Переименовать профиль</h3>
            <p className="text-xs text-neutral-400">Личные данные и сертификаты</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-2xl text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-bold">Имя профиля успешно сохранено!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Имя и фамилия студента
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="например: Илья Васюнин или Ilya Vasyunin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D2F544] rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
              Укажите имя так, как хотите видеть его в Личном кабинете, турнирной таблице арены и на официальном сертификате сдачи DET.
            </p>
          </div>

          {/* Certificate Live Preview */}
          {name.trim() && (
            <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-3.5 flex items-center gap-3">
              <Award className="w-5 h-5 text-[#D2F544] shrink-0" />
              <div className="text-xs">
                <span className="text-neutral-400 block text-[10px] uppercase font-bold tracking-wider">
                  Отображение на сертификате:
                </span>
                <span className="text-white font-black text-sm">{name.trim()}</span>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#D2F544] hover:bg-[#c4f22c] text-[#0C2418] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Сохранено</span>
                </>
              ) : (
                <span>Сохранить</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
