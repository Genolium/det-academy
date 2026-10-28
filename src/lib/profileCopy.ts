import type { Locale } from '@/lib/translations';

export const profileCopy: Record<Locale, {
  nameSaved: string; nameFailed: string; profileError: string; socialLinked: string;
  unlinkConfirm: (provider: string) => string; unlinked: (provider: string) => string; unlinkError: string;
  googleMissing: string; googleSdk: string; googleLinked: string; googleError: string;
  vkMissing: string; yandexMissing: string; appleOff: string;
  passwordShort: string; passwordMismatch: string; passwordUpdated: string; passwordError: string;
  authTitle: string; authText: string; home: string;
  dashboard: string; security: string; yourName: string; save: string; cancel: string; editName: string;
  studentDet: string; admin: string; student: string; created: string; rename: string; logout: string;
  studentProfile: string; certName: string; notSet: string; renameProfile: string;
  securityTitle: string; securityDesc: string; emailLogin: string; passwordSet: string; socialOnly: string;
  primaryEmail: string; changePassword: string; createPassword: string; currentPassword: string;
  newPassword: string; newPasswordHint: string; confirmPassword: string; savePassword: string;
  linked: string; notConnected: string; connected: string; inactive: string; unlink: string; link: string;
  progressTitle: string; progressDesc: string; openDashboard: string; theory: string; simulator: string;
  points: string; testsPassed: (count: number) => string; noTest: string; typing: string; wpm: string;
}> = {
  ru: {
    nameSaved: 'Имя успешно сохранено', nameFailed: 'Не удалось сохранить имя', profileError: 'Ошибка при обновлении профиля', socialLinked: 'Социальный аккаунт успешно привязан!',
    unlinkConfirm: (provider) => `Вы действительно хотите отвязать ${provider}?`, unlinked: (provider) => `${provider} успешно отвязан`, unlinkError: 'Ошибка при отвязке аккаунта',
    googleMissing: 'Google Client ID не настроен в .env', googleSdk: 'Не удалось загрузить Google Identity SDK', googleLinked: 'Google аккаунт успешно привязан!', googleError: 'Ошибка привязки Google',
    vkMissing: 'Для привязки VK ID укажите NEXT_PUBLIC_VK_CLIENT_ID в .env на сервере.', yandexMissing: 'Для привязки Яндекс ID укажите NEXT_PUBLIC_YANDEX_CLIENT_ID в .env на сервере.', appleOff: 'Авторизация через Apple ID временно отключена.',
    passwordShort: 'Новый пароль должен содержать не менее 6 символов', passwordMismatch: 'Пароли не совпадают', passwordUpdated: 'Пароль успешно обновлён!', passwordError: 'Ошибка при сохранении пароля',
    authTitle: 'Требуется авторизация', authText: 'Войдите в свой аккаунт, чтобы управлять настройками безопасности и привязанными соцсетями.', home: 'На главную',
    dashboard: 'Дашборд подготовки', security: 'Безопасность и профиль', yourName: 'Ваше имя', save: 'Сохранить', cancel: 'Отмена', editName: 'Редактировать имя',
    studentDet: 'Студент DET', admin: 'Администратор', student: 'Студент', created: 'Аккаунт создан', rename: 'Переименовать', logout: 'Выйти',
    studentProfile: 'Профиль студента', certName: 'Имя для сертификатов', notSet: 'Не указано', renameProfile: 'Переименовать профиль',
    securityTitle: 'Безопасность и способы входа', securityDesc: 'Управляйте паролем учётной записи и связывайте социальные профили для быстрого входа.', emailLogin: 'Вход по Email и паролю',
    passwordSet: 'Пароль установлен', socialOnly: 'Вход только через соцсети', primaryEmail: 'Основной Email', changePassword: 'Сменить пароль', createPassword: 'Создать пароль',
    currentPassword: 'Текущий пароль', newPassword: 'Новый пароль', newPasswordHint: 'Придумайте пароль (минимум 6 символов)', confirmPassword: 'Подтвердите новый пароль', savePassword: 'Сохранить пароль',
    linked: 'Привязано', notConnected: 'Не подключено', connected: 'Подключено', inactive: 'Не активно', unlink: 'Отвязать', link: 'Привязать',
    progressTitle: 'Учебный прогресс и результаты', progressDesc: 'Текущие показатели освоения программы Duolingo English Test на платформе.', openDashboard: 'Открыть полный дашборд',
    theory: 'Теория', simulator: 'Симулятор теста', points: 'баллов', testsPassed: (count) => `Пройдено тестов: ${count}`, noTest: 'Тест ещё не пройден', typing: 'Тренажёр печати', wpm: 'Рекомендуемый порог: 50+ WPM',
  },
  en: {
    nameSaved: 'Name saved', nameFailed: 'Could not save the name', profileError: 'Could not update the profile', socialLinked: 'Social account linked',
    unlinkConfirm: (provider) => `Disconnect ${provider}?`, unlinked: (provider) => `${provider} disconnected`, unlinkError: 'Could not disconnect the account',
    googleMissing: 'Google Client ID is not configured in .env', googleSdk: 'Could not load the Google Identity SDK', googleLinked: 'Google account linked', googleError: 'Could not link Google',
    vkMissing: 'Set NEXT_PUBLIC_VK_CLIENT_ID in .env to link VK ID.', yandexMissing: 'Set NEXT_PUBLIC_YANDEX_CLIENT_ID in .env to link Yandex ID.', appleOff: 'Apple ID sign-in is temporarily disabled.',
    passwordShort: 'The new password must be at least 6 characters', passwordMismatch: 'Passwords do not match', passwordUpdated: 'Password updated', passwordError: 'Could not save the password',
    authTitle: 'Sign-in required', authText: 'Sign in to manage security settings and linked social accounts.', home: 'Home',
    dashboard: 'Study dashboard', security: 'Security and profile', yourName: 'Your name', save: 'Save', cancel: 'Cancel', editName: 'Edit name',
    studentDet: 'DET student', admin: 'Administrator', student: 'Student', created: 'Account created', rename: 'Rename', logout: 'Sign out',
    studentProfile: 'Student profile', certName: 'Name on certificates', notSet: 'Not set', renameProfile: 'Rename profile',
    securityTitle: 'Security and sign-in methods', securityDesc: 'Manage the account password and link social profiles for faster sign-in.', emailLogin: 'Email and password',
    passwordSet: 'Password set', socialOnly: 'Social sign-in only', primaryEmail: 'Primary email', changePassword: 'Change password', createPassword: 'Create password',
    currentPassword: 'Current password', newPassword: 'New password', newPasswordHint: 'Create a password (at least 6 characters)', confirmPassword: 'Confirm the new password', savePassword: 'Save password',
    linked: 'Linked', notConnected: 'Not connected', connected: 'Connected', inactive: 'Inactive', unlink: 'Disconnect', link: 'Connect',
    progressTitle: 'Progress and results', progressDesc: 'Current progress through the Duolingo English Test programme on this platform.', openDashboard: 'Open the full dashboard',
    theory: 'Theory', simulator: 'Test simulator', points: 'points', testsPassed: (count) => `Tests completed: ${count}`, noTest: 'No test completed yet', typing: 'Typing trainer', wpm: 'Recommended threshold: 50+ WPM',
  },
};
