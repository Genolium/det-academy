'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { api, AdminStats, User, BackendTestSession, AdBannerData, BackendQuestion, Institution } from '@/lib/api';
import { PillBadge } from '@/components/ui/PillBadge';
import {
  Users,
  Award,
  Layers,
  MousePointerClick,
  Sparkles,
  Shield,
  Trash2,
  UserCheck,
  Search,
  Plus,
  RefreshCw,
  Clock,
  Building2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Sliders,
  CheckCircle,
  XCircle,
  Lock,
  Mail,
  LogOut,
  ArrowRight,
  Loader2,
  Zap,
} from 'lucide-react';

type Tab = 'overview' | 'users' | 'sessions' | 'banners' | 'questions' | 'institutions';

export const AdminDashboard: React.FC = () => {
  const { user, login, logout, checkAuth, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Quick Admin Login states (when accessing /admin unauthenticated)
  const [adminEmail, setAdminEmail] = useState('admin@det-academy.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<BackendTestSession[]>([]);
  const [banners, setBanners] = useState<AdBannerData[]>([]);
  const [questions, setQuestions] = useState<BackendQuestion[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Check auth on initial mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // New Banner Form Modal
  const [showNewBannerModal, setShowNewBannerModal] = useState(false);
  const [newBannerPlacement, setNewBannerPlacement] = useState<'HEADER' | 'FOOTER'>('HEADER');
  const [newBannerAlt, setNewBannerAlt] = useState('');
  const [newBannerUrl, setNewBannerUrl] = useState('');

  // New Question Form Modal
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false);
  const [newQType, setNewQType] = useState('READ_SELECT');
  const [newQDiff, setNewQDiff] = useState('B2');
  const [newQWord, setNewQWord] = useState('');
  const [newQIsReal, setNewQIsReal] = useState(true);

  // Load stats and active tab data only if user is admin
  const loadData = async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    try {
      const statsData = await api.getAdminStats();
      setStats(statsData);

      if (activeTab === 'users' || activeTab === 'overview') {
        const uRes = await api.getAdminUsers({ search: userSearch, role: userRoleFilter });
        setUsers(Array.isArray(uRes?.users) ? uRes.users : []);
      }
      if (activeTab === 'sessions') {
        const sRes = await api.getAdminSessions();
        setSessions(Array.isArray(sRes?.sessions) ? sRes.sessions : []);
      }
      if (activeTab === 'banners') {
        const bRes = await api.getAdminBanners();
        setBanners(Array.isArray(bRes?.banners) ? bRes.banners : []);
      }
      if (activeTab === 'questions') {
        const qRes = await api.getAdminQuestions();
        setQuestions(Array.isArray(qRes?.questions) ? qRes.questions : []);
      }
      if (activeTab === 'institutions') {
        const instRes = await api.getInstitutions();
        setInstitutions(Array.isArray(instRes?.institutions) ? instRes.institutions : []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user, activeTab, userSearch, userRoleFilter]);

  const handleAdminLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const emailToUse = customEmail || adminEmail;
    const passToUse = customPass || adminPassword;
    if (!emailToUse || !passToUse) {
      setLoginError('Введите email и пароль администратора');
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      const ok = await login(emailToUse, passToUse);
      if (!ok) {
        setLoginError('Неверный email или пароль');
      } else {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.role !== 'admin') {
          setLoginError(`Учётная запись ${currentUser?.email} имеет роль "${currentUser?.role}", а не "admin".`);
        }
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Ошибка при входе');
    } finally {
      setLoginLoading(false);
    }
  };

  // Actions
  const handleRoleChange = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'student' : 'admin';
    try {
      await api.updateUserRole(userId, nextRole);
      setActionMessage(`Роль пользователя успешно изменена на: ${nextRole}`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err) {
      alert('Ошибка изменения роли: ' + err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    try {
      await api.deleteUser(userId);
      setActionMessage('Пользователь удален');
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err) {
      alert('Ошибка удаления: ' + err);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBanner({
        placement: newBannerPlacement,
        altText: newBannerAlt,
        targetUrl: newBannerUrl,
        isActive: true,
      });
      setShowNewBannerModal(false);
      setNewBannerAlt('');
      setNewBannerUrl('');
      setActionMessage('Рекламный баннер успешно создан');
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err) {
      alert('Ошибка создания баннера: ' + err);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Удалить баннер?')) return;
    try {
      await api.deleteBanner(bannerId);
      setActionMessage('Баннер удален');
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err) {
      alert('Ошибка: ' + err);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createQuestion({
        type: newQType,
        difficultyBand: newQDiff,
        contentPayload: { word: newQWord },
        correctAnswers: { isReal: newQIsReal },
        timeLimitSec: 5,
        isActive: true,
      });
      setShowNewQuestionModal(false);
      setNewQWord('');
      setActionMessage('Вопрос успешно добавлен в банк');
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err) {
      alert('Ошибка добавления вопроса: ' + err);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Удалить вопрос?')) return;
    try {
      await api.deleteQuestion(qId);
      setActionMessage('Вопрос удален из банка');
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (err) {
      alert('Ошибка: ' + err);
    }
  };

  // Loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-neutral-400 text-xs">
          <Loader2 className="w-8 h-8 text-[#D2F544] animate-spin" />
          <span>Проверка прав доступа к CRM...</span>
        </div>
      </div>
    );
  }

  // If user is not admin, show login form or access restricted screen
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#D2F544]/10 border border-[#D2F544]/30 flex items-center justify-center mx-auto text-[#D2F544]">
              <Shield className="w-8 h-8" />
            </div>

            <div>
              <PillBadge variant="dark" prefixHash className="mx-auto text-[#D2F544] border-neutral-800">
                Admin CRM Panel
              </PillBadge>
              <h2 className="text-2xl font-black uppercase text-white tracking-tight mt-2">
                Вход в Панель Управления
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Доступ к CRM, банку вопросов и баннерной сети открыт для администраторов DET Academy.
              </p>
            </div>
          </div>

          {user && user.role !== 'admin' && (
            <div className="p-3.5 bg-amber-950/60 border border-amber-800/80 rounded-2xl text-amber-300 text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️ Текущий аккаунт не имеет прав администратора</span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Вы авторизованы как <strong>{user.name}</strong> ({user.email}) с ролью <code>{user.role}</code>. Войдите под учётной записью администратора.
              </p>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:underline cursor-pointer pt-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Выйти из этого аккаунта</span>
              </button>
            </div>
          )}

          {loginError && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-2xl text-red-300 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => handleAdminLogin(e)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Email администратора
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@det-academy.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D2F544] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D2F544] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#D2F544] hover:bg-[#c4f22c] text-[#0C2418] py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Проверка...</span>
                </>
              ) : (
                <>
                  <span>Войти в Панель CRM</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>



          <div className="pt-1 text-center">
            <Link
              href="/"
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 ambient-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0E1012] border border-neutral-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PillBadge variant="lime" prefixHash>
                DET Academy CRM & Admin
              </PillBadge>
              <span className="text-xs text-neutral-400">Операционный центр</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
              Панель управления
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:18055'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm"
              title="Открыть панель Headless CMS Directus"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Headless CMS (Directus)</span>
            </a>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-[#D2F544]">
              <span className="w-2 h-2 rounded-full bg-[#D2F544] animate-pulse" />
              <span>Администратор: {user.name}</span>
            </div>
            <button
              onClick={loadData}
              className="p-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Обновить данные"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action toast */}
        {actionMessage && (
          <div className="p-4 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-2xl animate-in fade-in flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {actionMessage}
          </div>
        )}

        {/* CRM Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-3xl border border-neutral-200 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#0E1012] text-[#D2F544] shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Дашборд & Аналитика</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#0E1012] text-[#D2F544] shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Студенты (CRM)</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sessions'
                ? 'bg-[#0E1012] text-[#D2F544] shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Сессии тестов</span>
          </button>

          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-[#0E1012] text-[#D2F544] shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <MousePointerClick className="w-4 h-4" />
            <span>Баннеры рекламы</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-[#0E1012] text-[#D2F544] shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Банк заданий</span>
          </button>

          <button
            onClick={() => setActiveTab('institutions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'institutions'
                ? 'bg-[#0E1012] text-[#D2F544] shadow-sm'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Каталог вузов</span>
          </button>
        </div>

        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-xs font-bold uppercase">Студентов</span>
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-[#0E1012]">{stats.totalUsers}</div>
                <span className="text-[11px] text-neutral-400">Зарегистрировано в системе</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-xs font-bold uppercase">Пройдено тестов</span>
                  <TrendingUp className="w-4 h-4 text-[#D2F544] bg-[#0E1012] p-0.5 rounded-md" />
                </div>
                <div className="text-3xl font-black text-[#0E1012]">{stats.completedSessions}</div>
                <span className="text-[11px] text-neutral-400">Всего попыток: {stats.totalSessions}</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-xs font-bold uppercase">Средний балл DET</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-black text-emerald-700">
                  {stats.averageScore ? stats.averageScore.toFixed(0) : '125'}
                </div>
                <span className="text-[11px] text-neutral-400">Диапазон: 10 – 160</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-xs font-bold uppercase">Сертификатов</span>
                  <Award className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-3xl font-black text-[#0E1012]">{stats.totalCertificates}</div>
                <span className="text-[11px] text-neutral-400">Выдано и верифицировано</span>
              </div>
            </div>

            {/* Score Distribution & Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Score Distribution */}
              <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
                <h3 className="text-lg font-black uppercase text-[#0E1012] flex items-center justify-between">
                  <span>Распределение баллов тестирования</span>
                  <PillBadge variant="mint" prefixHash>
                    CAT Scale
                  </PillBadge>
                </h3>
                <p className="text-xs text-neutral-500">
                  Статистика результатов студентов по ступеням сложности CEFR:
                </p>

                <div className="space-y-3 pt-2">
                  {Object.entries(stats.scoreDistribution || {}).map(([band, count]) => {
                    const total = stats.completedSessions || 1;
                    const percent = Math.round((count / total) * 100);
                    return (
                      <div key={band} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-neutral-700">
                          <span>{band}</span>
                          <span className="font-mono text-neutral-500">{count} студентов ({percent}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0E1012]"
                            style={{ width: `${Math.max(percent, count > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent registrations */}
              <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase text-[#0E1012]">
                    Новые студенты
                  </h3>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    Все студенты <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-neutral-100">
                  {stats.recentRegistrations?.slice(0, 5).map((u) => (
                    <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-[#D2F544] flex items-center justify-center font-bold">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#0E1012]">{u.name}</div>
                          <div className="text-neutral-400">{u.email}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Directus Headless CMS Integration Status Block */}
            <div className="bg-[#111315] border border-neutral-800 p-6 sm:p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono uppercase font-bold text-emerald-400">Headless CMS: Directus v11 Active</span>
                </div>
                <h4 className="text-xl font-bold uppercase tracking-tight text-white">
                  Управление контентом через Headless CMS
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Теоретические гайды, банк заданий, медиа-файлы и рекламные баннеры управляются в режиме реального времени через панель Directus. Все изменения синхронизируются с фронтендом и CAT-движком через REST/GraphQL API.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <a
                  href={process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:18055'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  Открыть Directus CMS
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users CRM */}
        {activeTab === 'users' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black uppercase text-[#0E1012]">
                  Управление студентами (CRM)
                </h3>
                <p className="text-xs text-neutral-500">
                  Список всех зарегистрированных пользователей, их роли и права доступа.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Поиск по имени/email..."
                    className="bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-neutral-800 outline-none w-52"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-medium text-neutral-800 outline-none"
                >
                  <option value="">Все роли</option>
                  <option value="student">Студенты</option>
                  <option value="admin">Администраторы</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-2">Студент</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Роль</th>
                    <th className="py-3 px-2">Дата регистрации</th>
                    <th className="py-3 px-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(users || []).map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-2 font-bold text-[#0E1012] flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-neutral-900 text-[#D2F544] flex items-center justify-center text-xs font-black">
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 px-2 text-neutral-600 font-mono">{u.email}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-neutral-400">
                        {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-3 px-2 text-right space-x-2">
                        <button
                          onClick={() => handleRoleChange(u.id, u.role)}
                          className="px-2.5 py-1 rounded-lg border border-neutral-300 hover:border-black text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          {u.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Test Sessions */}
        {activeTab === 'sessions' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-black uppercase text-[#0E1012]">
                Журнал прохождений тестирования
              </h3>
              <p className="text-xs text-neutral-500">
                Результаты реальных сессий тестирования с детализацией по всем 4 сабскорам.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-2">Кандидат</th>
                    <th className="py-3 px-2">Статус</th>
                    <th className="py-3 px-2">Сложность</th>
                    <th className="py-3 px-2">Итоговый балл</th>
                    <th className="py-3 px-2">Сабскоры (L / C / P / Conv)</th>
                    <th className="py-3 px-2">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(sessions || []).map((sess) => (
                    <tr key={sess.id} className="hover:bg-neutral-50/80">
                      <td className="py-3 px-2 font-bold text-[#0E1012]">{sess.candidateName}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sess.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sess.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono font-bold">{sess.difficultyLevel}</td>
                      <td className="py-3 px-2 font-black font-mono text-sm text-emerald-700">
                        {sess.overallScore ?? '—'}
                      </td>
                      <td className="py-3 px-2 text-neutral-600 font-mono text-[11px]">
                        {sess.literacyScore ?? '—'} / {sess.comprehensionScore ?? '—'} / {sess.productionScore ?? '—'} / {sess.conversationScore ?? '—'}
                      </td>
                      <td className="py-3 px-2 text-neutral-400">
                        {new Date(sess.createdAt).toLocaleString('ru-RU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Ad Banners */}
        {activeTab === 'banners' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase text-[#0E1012]">
                  Баннерная реклама (Ad Engine)
                </h3>
                <p className="text-xs text-neutral-500">
                  Управление рекламными позициями HEADER и FOOTER, отслеживание показов и кликов.
                </p>
              </div>

              <button
                onClick={() => setShowNewBannerModal(true)}
                className="bg-[#0E1012] hover:bg-neutral-800 text-[#D2F544] px-4 py-2 rounded-2xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добавить баннер
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(banners || []).map((b) => {
                const ctr = b.impressions && b.impressions > 0 ? (((b.clicks || 0) / b.impressions) * 100).toFixed(1) : '0.0';
                return (
                  <div key={b.id} className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 text-white">
                        {b.placement}
                      </span>
                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        className="text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Удалить баннер"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-sm font-bold text-[#0E1012]">{b.altText}</div>
                    <div className="text-xs text-neutral-400 font-mono truncate">{b.targetUrl}</div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-200 text-xs">
                      <span className="text-neutral-500">Показов: <strong>{b.impressions || 0}</strong></span>
                      <span className="text-neutral-500">Кликов: <strong>{b.clicks || 0}</strong></span>
                      <span className="text-emerald-700 font-bold">CTR: {ctr}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: Question Bank */}
        {activeTab === 'questions' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase text-[#0E1012]">
                  Банк вопросов CAT
                </h3>
                <p className="text-xs text-neutral-500">
                  Все вопросы для адаптивного тестирования по уровням сложности (A2, B1, B2, C1).
                </p>
              </div>

              <button
                onClick={() => setShowNewQuestionModal(true)}
                className="bg-[#0E1012] hover:bg-neutral-800 text-[#D2F544] px-4 py-2 rounded-2xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добавить вопрос
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(questions || []).map((q) => (
                <div key={q.id} className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {q.type}
                    </span>
                    <span className="font-mono text-xs font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-md">
                      {q.difficultyBand}
                    </span>
                  </div>

                  <div className="font-mono text-xs bg-white p-3 rounded-xl border border-neutral-200 overflow-x-auto">
                    {JSON.stringify(q.contentPayload)}
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-neutral-400">Лимит: {q.timeLimitSec}с</span>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-neutral-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Institutions */}
        {activeTab === 'institutions' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase text-[#0E1012]">
                  Каталог университетов
                </h3>
                <p className="text-xs text-neutral-500">
                  Всего вузов в базе: {(institutions || []).length}. Отображаются на интерактивной карте.
                </p>
              </div>

              <Link
                href="/institutions"
                className="bg-[#0E1012] text-[#D2F544] px-4 py-2 rounded-2xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                Открыть публичную карту ↗
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(institutions || []).slice(0, 18).map((inst) => (
                <div key={inst.id} className="p-4 rounded-2xl border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {inst.category}
                    </span>
                    <span className="font-mono font-bold text-xs bg-[#0E1012] text-[#D2F544] px-2 py-0.5 rounded-md">
                      {inst.minScore}+
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0E1012]">{inst.name}</h4>
                  <div className="text-xs text-neutral-500">📍 {inst.city}, {inst.country}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Banner Modal */}
        {showNewBannerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full border border-neutral-200 shadow-2xl space-y-4">
              <h3 className="text-lg font-black uppercase text-[#0E1012]">
                Создать рекламный баннер
              </h3>

              <form onSubmit={handleCreateBanner} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Позиция:</label>
                  <select
                    value={newBannerPlacement}
                    onChange={(e) => setNewBannerPlacement(e.target.value as 'HEADER' | 'FOOTER')}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-medium"
                  >
                    <option value="HEADER">HEADER (верхняя плашка)</option>
                    <option value="FOOTER">FOOTER (блок перед футером)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Текст / Слоган баннера:</label>
                  <input
                    type="text"
                    required
                    value={newBannerAlt}
                    onChange={(e) => setNewBannerAlt(e.target.value)}
                    placeholder="e.g. Скидка 20% на подготовку"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Целевой URL:</label>
                  <input
                    type="url"
                    required
                    value={newBannerUrl}
                    onChange={(e) => setNewBannerUrl(e.target.value)}
                    placeholder="https://example.com/promo"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewBannerModal(false)}
                    className="px-4 py-2 rounded-xl text-neutral-500 font-bold hover:bg-neutral-100"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0E1012] text-[#D2F544] font-bold"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* New Question Modal */}
        {showNewQuestionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full border border-neutral-200 shadow-2xl space-y-4">
              <h3 className="text-lg font-black uppercase text-[#0E1012]">
                Добавить вопрос в банк CAT
              </h3>

              <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Тип задания:</label>
                  <select
                    value={newQType}
                    onChange={(e) => setNewQType(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-medium"
                  >
                    <option value="READ_SELECT">Read and Select (Слово)</option>
                    <option value="FILL_BLANKS">Fill in the Blanks (Пропуски)</option>
                    <option value="C_TEST">C-Test (Текст с пропусками)</option>
                    <option value="LISTEN_TYPE">Listen and Type (Диктант)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Сложность CEFR:</label>
                  <select
                    value={newQDiff}
                    onChange={(e) => setNewQDiff(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-medium"
                  >
                    <option value="A2">A2 (Начальный)</option>
                    <option value="B1">B1 (Средний)</option>
                    <option value="B2">B2 (Выше среднего)</option>
                    <option value="C1">C1 (Продвинутый)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Слово / Предложение:</label>
                  <input
                    type="text"
                    required
                    value={newQWord}
                    onChange={(e) => setNewQWord(e.target.value)}
                    placeholder="e.g. formidable"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Правильный ответ:</label>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={newQIsReal}
                        onChange={() => setNewQIsReal(true)}
                      />
                      <span>Реальное слово (True)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!newQIsReal}
                        onChange={() => setNewQIsReal(false)}
                      />
                      <span>Псевдослово (False)</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewQuestionModal(false)}
                    className="px-4 py-2 rounded-xl text-neutral-500 font-bold hover:bg-neutral-100"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0E1012] text-[#D2F544] font-bold"
                  >
                    Сохранить вопрос
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
