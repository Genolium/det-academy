import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'CRM и Панель управления | DET Academy',
  description: 'Панель администрирования платформы DET Academy: управление пользователями, банк вопросов, сессии тестирования и баннерная реклама.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
