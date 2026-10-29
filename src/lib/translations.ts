import { PRODUCT_FACTS } from './product-facts';

export type Locale = 'ru' | 'en';

/** Текущий год — подставляется автоматически вместо жёстко заданного диапазона. */
const YEAR = new Date().getFullYear();

export interface Translations {
  nav: {
    theory: string;
    practice: string;
    test: string;
    verify: string;
    institutions: string;
    admin: string;
    profile: string;
    logout: string;
    login: string;
    freeMock: string;
  };
  navbar: {
    theory: string;
    drills: string;
    practice: string;
    typing: string;
    verify: string;
    institutions: string;
    admin: string;
    profile: string;
    logout: string;
    login: string;
    freeMock: string;
    arena: string;
    dashboard: string;
    vocabulary: string;
  };
  hero: {
    badge: string;
    titlePart1: string;
    titlePill: string;
    titlePart2: string;
    subtitle: string;
    ctaPrimary: string;
    ctaLoggedIn: string;
    ctaSecondary: string;
    statsUsers: string;
    statsPassRate: string;
    statsScore: string;
  };
  bento: {
    sectionBadge: string;
    sectionTitle: string;
    sectionSubtitle: string;
    adaptiveCatTitle: string;
    adaptiveCatDesc: string;
    typingTitle: string;
    typingDesc: string;
    theoryTitle: string;
    theoryDesc: string;
    certificateTitle: string;
    certificateDesc: string;
    liveFeedback: string;
    instantCert: string;
    taskTypesMvp: string;
    vocabCount: string;
    certCondition: string;
    certReq: string;
  };
  comparison: {
    title: string;
    subtitle: string;
    mapButton: string;
    feature: string;
    det: string;
    ielts: string;
    price: string;
    detPrice: string;
    ieltsPrice: string;
    format: string;
    detFormat: string;
    ieltsFormat: string;
    duration: string;
    detDuration: string;
    ieltsDuration: string;
    results: string;
    detResults: string;
    ieltsResults: string;
    recognition: string;
    detRecognition: string;
    ieltsRecognition: string;
    sending: string;
    detSending: string;
    ieltsSending: string;
    footnote: string;
  };
  demo: {
    title: string;
    subtitle: string;
    startTitle: string;
    startDesc: string;
    secPerWord: string;
    demoWordsBadge: string;
    startBtn: string;
    wordProgress: string;
    realOrFake: string;
    realWord: string;
    fakeWord: string;
    score: string;
    completed: string;
    tryFull: string;
    retry: string;
    correctPrefix: string;
    errorPrefix: string;
    timeoutPrefix: string;
  };
  sparkPromo: {
    badge1: string;
    badge2: string;
    status: string;
    campaignStart: string;
    headlinePart1: string;
    headlinePart2: string;
    headlinePart3: string;
    description: string;
    promoCodeLabel: string;
    applyBtn: string;
  };
    cookie: {
      text: string;
      accept: string;
      decline: string;
      privacy: string;
      label: string;
    };
  footer: {
    tagline: string;
    rules: string;
    rights: string;
    disclaimer: string;
    description: string;
    navigation: string;
    legal: string;
    modulesTitle: string;
    theoryLink: string;
    typingLink: string;
    institutionsLink: string;
    testLink: string;
    verifyLink: string;
    crmLink: string;
    examTitle: string;
    scoreScaleLabel: string;
    scoreScaleVal: string;
    scoreStepLabel: string;
    scoreStepVal: string;
    passScoreLabel: string;
    passScoreVal: string;
  };
  adBanner: {
    partner: string;
    learnMore: string;
    headerDefaultText: string;
    footerDefaultText: string;
    footerSubtext: string;
    openEnrollment: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    loginTab: string;
    registerTab: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    loginBtn: string;
    registerBtn: string;
    loading: string;
    oauthDivider: string;
    oauthGoogle: string;
    oauthApple: string;
    oauthVk: string;
    oauthYandex: string;
    quickDemoHeading: string;
    demoStudentBtn: string;
    demoAdminBtn: string;
    guardTitle: string;
    guardSubtitle: string;
    guardSyncTitle: string;
    guardSyncDesc: string;
    guardCatTitle: string;
    guardCatDesc: string;
    guardCertTitle: string;
    guardCertDesc: string;
    guardActionBtn: string;
  };
  institutions: {
    badge: string;
    countTag: string;
    title: string;
    subtitle: string;
    statsWorld: string;
    statsWorldLabel: string;
    statsIvy: string;
    statsIvyLabel: string;
    statsAvg: string;
    statsAvgLabel: string;
    statsReports: string;
    statsReportsLabel: string;
    searchPlaceholder: string;
    allCountries: string;
    allCategories: string;
    categoriesLabel: string;
    scoreAny: string;
    score115: string;
    score120: string;
    score125: string;
    score130: string;
    subscoreFilterLabel: string;
    subscoreAny: string;
    subscoreWriting120: string;
    subscoreLiteracy120: string;
    subscoreAll115: string;
    subscoreConversation120: string;
    mapHeading: string;
    mapPinsNote: string;
    foundLabel: string;
    sidebarTitle: string;
    sidebarSubtitle: string;
    sidebarTakeTest: string;
    loadingCatalog: string;
    notFoundTitle: string;
    notFoundDesc: string;
    minScoreLabel: string;
    admissionsSite: string;
    acceptanceLabel: string;
    ctaBadge: string;
    ctaTitle: string;
    ctaDesc: string;
    ctaTestBtn: string;
    ctaTheoryBtn: string;
    mapLoading: string;
  };
  typing: {
    badge: string;
    tag: string;
    title: string;
    subtitle: string;
    modeTime: string;
    modeWords: string;
    detPack: string;
    stdPack: string;
    soundToggle: string;
    liveWpm: string;
    accuracyLabel: string;
    restartEsc: string;
    finishedBadge: string;
    finishedTitle: string;
    wpmLabel: string;
    accuracyStat: string;
    keystrokesLabel: string;
    personalBestLabel: string;
    recommendation: string;
    retryBtn: string;
  };
  theory: {
    curriculumBadge: string;
    lessonsCount: string;
    title: string;
    progressCardLabel: string;
    progressCardStatus: string;
    studiedBadge: string;
    inProgressBadge: string;
    lessonPrefix: string;
    timingLabel: string;
    openGuide: string;
    guardTitle: string;
    guardSubtitle: string;
    backToList: string;
    rulesTitle: string;
    strategyTitle: string;
    stepPrefix: string;
    formulaTitle: string;
    formulaRulesTitle: string;
    mentorIntroTitle: string;
    proTipsTitle: string;
    exampleTitle: string;
    exampleScenarioTitle: string;
    modelAnswerLabel: string;
    expertCommentLabel: string;
    pitfallsTitle: string;
    completedQuestion: string;
    completedNote: string;
    markDone: string;
    markUndone: string;
    prevLesson: string;
    nextLesson: string;
  };
  testLobby: {
    engineBadge: string;
    scoringTag: string;
    title: string;
    subtitle: string;
    sessionBadge: string;
    sessionTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    nameHint: string;
    rulesTitle: string;
    rule1: string;
    rule2: string;
    rule3: string;
    startBtn: string;
    compositionTitle: string;
    mvpStatusLabel: string;
    statusActive: string;
    statusComingSoon: string;
  };
  testSession: {
    stepLabel: string;
    proctoringWarning: string;
    candidateLabel: string;
    sentenceStep: string;
    nextBtn: string;
    wordStep: string;
    hotkeysHint: string;
    yesKey: string;
    noKey: string;
    playsRemaining: string;
    playingAudio: string;
    dictationHint: string;
    submitBtn: string;
    readingStep: string;
    readingQuestionHint: string;
    selectWordOption: string;
    highlightStatus: string;
    highlightSuccess: string;
    highlightInstruction: string;
    finishReadingBtn: string;
    nextReadingStepBtn: string;
    listeningPauseTimer: string;
    listeningSummaryTimer: string;
    scenarioLabel: string;
    chooseTurnHint: string;
    dialogueFinishedTitle: string;
    dialogueFinishedDesc: string;
    startSummaryNowBtn: string;
    summaryHeading: string;
    wordsCounter: string;
    submitSummaryBtn: string;
    writingPartStep: string;
    part1Reference: string;
    emptyTextNotice: string;
    typeResponseHint: string;
    writingWordCount: string;
    advanceToFollowUpBtn: string;
    finishWritingBtn: string;
    photoStep: string;
    photoInstruction: string;
    recommendedRange: string;
    finishPhotoTestBtn: string;
    nextPhotoBtn: string;
    writingSampleTheme: string;
    oreoHint: string;
    finishSampleBtn: string;
  };
  testResults: {
    badge: string;
    candidateLabel: string;
    title: string;
    overallLabel: string;
    scaleNote: string;
    highScoreNote: string;
    midScoreNote: string;
    lowScoreNote: string;
    subscoresLabel: string;
    literacySub: string;
    comprehensionSub: string;
    productionSub: string;
    conversationSub: string;
    certCardTitle: string;
    certReadyNotice: string;
    certPendingNotice: string;
    openVerifyBtn: string;
    retakeBtn: string;
    homeBtn: string;
  };
  certificate: {
    officialBadge: string;
    verifiedTag: string;
    certIdLabel: string;
    issueDateLabel: string;
    printPdfBtn: string;
    awardedTo: string;
    awardReason: string;
    verifiedScoreLabel: string;
    scaleExplanation: string;
    boardTitle: string;
    boardSubtitle: string;
    qrLabel: string;
    authenticatedRecord: string;
    verifyingTitle: string;
  };
  dashboard: {
    personalPlan: string;
    candidateFallback: string;
    examReadiness: string;
    noData: string;
    theoryLabel: string;
    mockLabel: string;
    typingLabel: string;
    todayTitle: string;
    daysLeft: string;
    budget: string;
    diagnosticCta: string;
    mockCta: string;
    typingCta: string;
    taskCompleted: string;
    openTask: string;
    leagueLoading: string;
    leagueEmpty: string;
    leagueError: string;
    badgePrep: string;
    badgeSecurity: string;
    goalLabel: string;
    remainingTitle: string;
    hoursLeft: string;
    theoryModules: string;
    remainingLessons: string;
    lessonsShort: string;
    controlTest: string;
    scoreMet: string;
    scoreNeeded: string;
    inProgress: string;
    reportsTitle: string;
    reportsHint: string;
    verifyById: string;
    lessons16: string;
    test105: string;
    nextStep: string;
    scoreRangeLabel: string;
    confidence: { low: string; medium: string; high: string };
    goToLesson: string;
    radarSubscores: string;
    radarSkills: string;
    fromLastSession: string;
    takeTestForScores: string;
    overallScore: string;
    awaitingTest: string;
    vocabTrainer: string;
    srsTitle: string;
    srsDesc: string;
    openVocab: string;
    curriculum: string;
    studiedOf: string;
    markDone: string;
    markUndone: string;
    minutesShort: string;
    openLesson: string;
    historyTitle: string;
    historyHint: string;
    newTest: string;
    emptyHistory: string;
    emptyHistoryHint: string;
    colDate: string;
    colScore: string;
    colStatus: string;
    recently: string;
    trainingLevel: string;
    minPerDay: string;
    renameProfile: string;
  };
  diagnostic: {
    title: string;
    subtitle: string;
    timeTitle: string;
    timeDesc: string;
    skillsTitle: string;
    skillsDesc: string;
    serverTitle: string;
    serverDesc: string;
    disclaimer: string;
    start: string;
    creating: string;
    createFailed: string;
  };
  practiceHub: {
    badge: string;
    title: string;
    subtitle: string;
    mockBanner: string;
    mockCta: string;
  };
}

export const translations: Record<Locale, Translations> = {
  ru: {
    nav: {
      theory: 'Теория и гайды',
      practice: 'Тренажер скоропечатания',
      test: 'Симулятор CAT',
      verify: 'Проверка сертификата',
      institutions: 'Вузы с DET',
      admin: 'CRM Админка',
      profile: 'Кабинет',
      logout: 'Выйти',
      login: 'Войти',
      freeMock: 'Пройти тест',
    },
    navbar: {
      theory: 'Теория',
      drills: 'Тренажеры',
      typing: 'Скоропечатание',
      practice: 'Симулятор теста',
      verify: 'Сертификат',
      institutions: 'Вузы с DET',
      admin: 'Админка',
      profile: 'Кабинет',
      logout: 'Выйти',
      login: 'Войти',
      freeMock: 'Пробный тест',
      arena: 'Арена 1v1',
      dashboard: 'Кабинет',
      vocabulary: 'Словарь',
    },
    hero: {
      badge: `ПОДГОТОВКА К ЭКЗАМЕНУ ${YEAR}`,
      titlePart1: 'СДАЙ DUOLINGO',
      titlePill: '[НА 120+]',
      titlePart2: 'С УМНЫМ ТРЕНАЖЕРОМ',
      subtitle: 'Интерактивная адаптивная платформа DET Academy: симулятор экзамена, тренажер скоропечатания DET, разбор стратегий и тренировочную оценку и диапазон.',
      ctaPrimary: 'Начать тест бесплатно',
      ctaLoggedIn: 'Продолжить обучение',
      ctaSecondary: 'Изучить теорию',
      statsUsers: '',
      statsPassRate: '',
      statsScore: '',
    },
    bento: {
      sectionBadge: 'DET Academy Features',
      sectionTitle: 'Инструменты подготовки',
      sectionSubtitle: `Диагностика, план на сегодня, практика ${PRODUCT_FACTS.activeTaskTypes} типов заданий и тренировочный отчёт — без обещания официального балла.`,
      adaptiveCatTitle: 'Пробный тест',
      adaptiveCatDesc: 'Сервер выдаёт задания и считает тренировочную оценку по шкале 10–160. Сложность меняется по этапам; это модель DET Academy, а не алгоритм Duolingo.',
      typingTitle: 'Тренажер скоропечатания DET',
      typingDesc: 'Тренажер слепой печати со специализированным словарем академических эссе и диктантов.',
      theoryTitle: 'База знаний и стратегий',
      theoryDesc: '16 уроков: структура экзамена, шаблоны эссе OREO, типичные ловушки и формулы описания фото.',
      certificateTitle: 'Тренировочный отчёт',
      certificateDesc: 'Отчёт DET Academy с QR-проверкой и сабскорами. Это не официальный сертификат Duolingo.',
      liveFeedback: 'Серверные таймеры',
      instantCert: 'Анализ за 2 секунды',
      taskTypesMvp: `${PRODUCT_FACTS.activeTaskTypes} типов заданий`,
      vocabCount: '506 академических слов',
      certCondition: 'Условие выдачи:',
      certReq: '100% теории + Тест ≥ 105',
    },
    comparison: {
      title: 'Почему выбирают DET',
      subtitle: 'Duolingo English Test сдаётся онлайн примерно за час. Официальный реестр вузов, принимающих DET, содержит 4 087 записей — проверяйте актуальные требования на сайте университета.',
      mapButton: 'Карта вузов с DET',
      feature: 'Критерий',
      det: 'Duolingo English Test',
      ielts: 'IELTS / TOEFL',
      price: 'Стоимость',
      detPrice: '~$59 USD',
      ieltsPrice: '~$250–320 USD',
      format: 'Формат сдачи',
      detFormat: 'Онлайн из дома 24/7',
      ieltsFormat: 'Офлайн в тест-центре по записи',
      duration: 'Длительность',
      detDuration: 'Около 1 часа',
      ieltsDuration: '3–4 часа',
      results: 'Срок результатов',
      detResults: '48 часов',
      ieltsResults: '3–14 дней',
      recognition: 'Признание в мире',
      detRecognition: '4 087 вузов в официальном реестре DET',
      ieltsRecognition: 'Шире признание, зависит от программы',
      sending: 'Отправка в вузы',
      detSending: 'Бесплатно в любое число вузов',
      ieltsSending: 'Платно за каждый отчет (от $20)',
      footnote: 'Цена, срок результатов и требования вузов меняются. Ориентир на дату проверки — уточняйте на englishtest.duolingo.com.',
    },
    demo: {
      title: 'Мини-тренажер: Read and Select',
      subtitle: 'Определите реальное английское слово за 5 секунд.',
      startTitle: 'Протестируйте формат заданий с реального экзамена',
      startDesc: 'На экране появятся слова. Ваша задача — за 5 секунд определить, существует ли такое слово в английском языке или это псевдослово.',
      secPerWord: '5.0 сек / слово',
      demoWordsBadge: '3 демонстрационных слова',
      startBtn: 'Начать тренировку',
      wordProgress: 'Слово',
      realOrFake: 'Реальное или выдуманное?',
      realWord: 'Реальное слово',
      fakeWord: 'Псевдослово',
      score: 'Ваш результат',
      completed: 'Демо-блок завершен!',
      tryFull: 'Пройти диагностику',
      retry: 'Пройти демо еще раз',
      correctPrefix: 'Верно!',
      errorPrefix: 'Ошибка!',
      timeoutPrefix: 'Время истекло!',
    },
    sparkPromo: {
      badge1: 'так_называемый_SPARK',
      badge2: 'Full_Grant_$20k',
      status: 'Набор на обучение открыт',
      campaignStart: 'Старт заявочной кампании: Октябрь 2026',
      headlinePart1: 'Выиграй грант $20,000',
      headlinePart2: 'на учёбу в США по обмену',
      headlinePart3: 'на следующее лето',
      description: 'Практический проект от финалиста программы SPARK 2026. Разборы победных заявок, шаблоны документов, персональная 45-минутная симуляция интервью в Zoom и закрытые инсайды отбора.',
      promoCodeLabel: 'Промокод',
      applyBtn: 'Подробнее',
    },
    cookie: {
      text: 'Необходимые cookie: вход и прогресс. Аналитика — только после согласия.',
      accept: 'Принять',
      decline: 'Только необходимое',
      privacy: 'Подробнее',
      label: 'Cookie',
    },
    footer: {
      tagline: 'Независимая платформа подготовки к Duolingo English Test: диагностика, план и тренировочные тесты.',
      rules: `Формат заданий ориентирован на публичную структуру DET ${YEAR}`,
      rights: 'Все права защищены.',
      disclaimer: 'DET Academy является независимым образовательным сервисом и не аффилирована с Duolingo, Inc.',
      description: 'Независимая EdTech платформа адаптивной подготовки к экзамену Duolingo English Test. Не аффилирована с Duolingo Inc.',
      navigation: 'Навигация',
      legal: 'Информация',
      modulesTitle: 'Модули платформы',
      theoryLink: 'Теория и гайд DET',
      typingLink: 'Тренажер скоропечатания DET',
      institutionsLink: 'Карта вузов с DET',
      testLink: 'Симулятор теста',
      verifyLink: 'Проверка сертификата',
      crmLink: 'CRM-панель',
      examTitle: 'Экзамен DET',
      scoreScaleLabel: 'Шкала баллов:',
      scoreScaleVal: '10 – 160',
      scoreStepLabel: 'Шаг оценки:',
      scoreStepVal: '5 баллов',
      passScoreLabel: 'Проходной вузов:',
      passScoreVal: '115 – 130',
    },
    adBanner: {
      partner: 'Партнер',
      learnMore: 'Подробнее',
      headerDefaultText: 'Выиграй грант $20,000 на учёбу в США по обмену на следующее лето. Промокод DET_ACADEMY',
      footerDefaultText: 'Академическое менторство DET 130+',
      footerSubtext: 'Индивидуальный разбор Speaking и Writing с носителями языка и экспертами DET.',
      openEnrollment: 'Набор открыт',
    },
    auth: {
      loginTitle: 'Вход в аккаунт',
      registerTitle: 'Регистрация',
      loginTab: 'Войти',
      registerTab: 'Создать аккаунт',
      nameLabel: 'Ваше имя (на латинице для сертификата)',
      namePlaceholder: 'например, Alexey Smirnov',
      emailLabel: 'Email',
      emailPlaceholder: 'student@example.com',
      passwordLabel: 'Пароль',
      loginBtn: 'Войти в аккаунт',
      registerBtn: 'Зарегистрироваться',
      loading: 'Загрузка...',
      oauthDivider: 'или войти через',
      oauthGoogle: 'Войти через Google',
      oauthApple: 'Войти через Apple',
      oauthVk: 'Войти через VK ID',
      oauthYandex: 'Войти через Яндекс ID',
      quickDemoHeading: 'Быстрый вход для тестирования:',
      demoStudentBtn: 'Студент Alex Rivera (100% теории + Тест 125)',
      demoAdminBtn: 'Администратор (CRM-панель + Управление)',
      guardTitle: 'Доступ только после регистрации',
      guardSubtitle: 'Чтобы сохранить прогресс, пройти диагностику и получить тренировочный отчёт DET Academy, войдите или создайте аккаунт.',
      guardSyncTitle: 'Синхронизация',
      guardSyncDesc: 'Прогресс уроков и попыток хранится на сервере',
      guardCatTitle: 'Пробный тест',
      guardCatDesc: 'Тренировочная оценка 10–160 считает сервер',
      guardCertTitle: 'Отчёт',
      guardCertDesc: 'Тренировочный отчёт платформы, не официальный DET',
      guardActionBtn: 'Войти или Зарегистрироваться',
    },
    institutions: {
      badge: 'Worldwide University Acceptance',
      countTag: '• 4 087 вузов в официальном реестре DET',
      title: 'Вузы, принимающие DET',
      subtitle: 'Каталог вузов из официального реестра DET. Пороги баллов, если показаны, — ориентир платформы: сверяйте их с приёмной комиссией.',
      statsWorld: '4 087',
      statsWorldLabel: 'Записей в реестре DET',
      statsIvy: 'Ориентир',
      statsIvyLabel: 'Пороги не подтверждены вузом',
      statsAvg: '115–125',
      statsAvgLabel: 'Средний проходной',
      statsReports: '0$',
      statsReportsLabel: 'Отправка отчетов',
      searchPlaceholder: 'Поиск по названию университета, городу или стране...',
      allCountries: 'Все страны',
      allCategories: 'Все категории',
      categoriesLabel: 'Категории:',
      scoreAny: 'Любой балл DET (105+)',
      score115: 'От 115 баллов',
      score120: 'От 120 баллов',
      score125: 'От 125 баллов',
      score130: 'От 130 баллов',
      subscoreFilterLabel: 'Фильтр по субскорам:',
      subscoreAny: 'Без ограничений по субскорам',
      subscoreWriting120: 'Writing (Production) ≥ 120',
      subscoreLiteracy120: 'Literacy (чтение/письмо) ≥ 120',
      subscoreAll115: 'Все субскоры ≥ 115 (Строгие требования)',
      subscoreConversation120: 'Conversation (устная речь) ≥ 120',
      mapHeading: 'Интерактивная карта вузов мира',
      mapPinsNote: 'Пины отображают минимальный балл DET',
      foundLabel: 'Найдено:',
      sidebarTitle: 'Список вузов',
      sidebarSubtitle: 'Кликните для центрирования карты',
      sidebarTakeTest: 'Сдать тест',
      loadingCatalog: 'Загрузка каталога университетов...',
      notFoundTitle: 'Университеты не найдены',
      notFoundDesc: 'Попробуйте изменить параметры поиска или снизить планку балла',
      minScoreLabel: 'Минимальный балл DET:',
      admissionsSite: 'Сайт вуза',
      acceptanceLabel: 'Прием:',
      ctaBadge: 'Check Your Admissions Score',
      ctaTitle: 'Хватит ли вашего балла для поступления?',
      ctaDesc: 'Пройдите диагностику DET Academy (~20 мин) или полный пробный тест (~1 час). Сервер посчитает тренировочную оценку по шкале 10–160.',
      ctaTestBtn: 'Пройти симулятор теста',
      ctaTheoryBtn: 'Изучить стратегию сдачи',
      mapLoading: 'Инициализация интерактивной карты университетов...',
    },
    typing: {
      badge: 'Blind Typing Emulation',
      tag: '• DET Typing Trainer',
      title: 'Тренажер скоропечатания DET',
      subtitle: 'Отработка навыка слепой печати без подглядывания на клавиатуру на базе академической лексики DET и экзаменационных эссе.',
      modeTime: 'Время',
      modeWords: 'Слова',
      detPack: 'DET Academic Pack (506)',
      stdPack: 'English Core 100',
      soundToggle: 'Переключить звук механических клавиш',
      liveWpm: 'Live:',
      accuracyLabel: 'Точность:',
      restartEsc: 'Перезапустить (Esc)',
      finishedBadge: 'Тест скорости завершен',
      finishedTitle: 'Результаты печати',
      wpmLabel: 'Слов в минуту (WPM)',
      accuracyStat: 'Точность (Accuracy)',
      keystrokesLabel: 'Нажатий клавиш',
      personalBestLabel: 'Личный рекорд',
      recommendation: 'Для DET эссе рекомендуется темп не менее 45–60 WPM при точности 95%+.',
      retryBtn: 'Повторить попытку',
    },
    theory: {
      curriculumBadge: `DET Curriculum ${YEAR}`,
      lessonsCount: '16 фундаментальных модулей',
      title: 'База знаний и стратегий DET',
      progressCardLabel: 'Прогресс теории для сертификата:',
      progressCardStatus: 'завершено • Нужно 100% + тест ≥105',
      studiedBadge: 'Изучено',
      inProgressBadge: 'В процессе',
      lessonPrefix: 'Урок',
      timingLabel: 'Тайминг:',
      openGuide: 'Открыть гайд',
      guardTitle: 'База знаний и стратегий DET',
      guardSubtitle: 'Фундаментальный академический курс с подробным разбором всех 16 модулей экзамена, CAT-алгоритма, 4 сабскоров, шаблонов OREO и ловушек доступен только после регистрации.',
      backToList: 'Назад к списку тем',
      rulesTitle: 'Регламент и ограничения',
      strategyTitle: 'Порядок действий',
      stepPrefix: 'Этап',
      formulaTitle: 'Рабочий шаблон ответа',
      formulaRulesTitle: 'Ключевая памятка и регламент',
      mentorIntroTitle: 'Контекст',
      proTipsTitle: 'Практические рекомендации',
      exampleTitle: 'Разбор задания',
      exampleScenarioTitle: 'Разбор ситуации',
      modelAnswerLabel: 'Пример решения:',
      expertCommentLabel: 'Разбор логики:',
      pitfallsTitle: 'Частые ошибки',
      completedQuestion: 'Завершили изучение материала?',
      completedNote: 'Отметка фиксирует ваш прогресс в профиле и приближает выдачу сертификата.',
      markDone: 'Отметить как пройденный',
      markUndone: 'Изучено (снять отметку)',
      prevLesson: 'Предыдущий урок',
      nextLesson: 'Следующий урок',
    },
    testLobby: {
      engineBadge: 'DET Academy Mock',
      scoringTag: '• Тренировочная оценка 10–160',
      title: 'Пробный тест DET',
      subtitle: `Полный пробный тест: ${PRODUCT_FACTS.activeTaskTypes} типов заданий, серверные таймеры и тренировочные сабскоры. Это оценка DET Academy, не официальный результат Duolingo.`,
      sessionBadge: 'Сессия тестирования',
      sessionTitle: 'Параметры сессии',
      nameLabel: 'Имя и фамилия (латиницей):',
      namePlaceholder: 'e.g. John Doe',
      nameHint: 'Будет указано в тренировочном отчёте DET Academy.',
      rulesTitle: 'Правила экзамена:',
      rule1: '• Запрещено пользоваться черновиками и ручками.',
      rule2: '• Не отводите взгляд от экрана.',
      rule3: '• Реклама во время сессии полностью скрыта.',
      startBtn: 'Начать тестирование',
      compositionTitle: 'Состав экзаменационного теста',
      mvpStatusLabel: 'Статус в MVP',
      statusActive: 'Активно',
      statusComingSoon: 'В работе',
    },
    testSession: {
      stepLabel: 'Шаг',
      proctoringWarning: 'Proctoring Active: Look directly at the screen. Notes prohibited.',
      candidateLabel: 'Candidate:',
      sentenceStep: 'Предложение',
      nextBtn: 'Далее (Next)',
      wordStep: 'Слово',
      hotkeysHint: 'Горячие клавиши:',
      yesKey: 'Да',
      noKey: 'Нет',
      playsRemaining: 'Воспроизвести',
      playingAudio: 'Играет...',
      dictationHint: 'Внимание: диктант учитывает регистр первой буквы и финальную точку.',
      submitBtn: 'Готово (Submit)',
      readingStep: 'Этап',
      readingQuestionHint: 'Нажмите на целевой фрагмент в тексте слева:',
      selectWordOption: '[ Выберите слово ]',
      highlightStatus: 'Статус выделения:',
      highlightSuccess: 'Фрагмент успешно выделен ✓',
      highlightInstruction: 'Кликните по фрагменту слева',
      finishReadingBtn: 'Завершить чтение',
      nextReadingStepBtn: 'Следующий этап',
      listeningPauseTimer: 'Пауза до скрипта:',
      listeningSummaryTimer: 'Таймер резюме:',
      scenarioLabel: 'Сценарий:',
      chooseTurnHint: 'Выберите ответную реплику (ход',
      dialogueFinishedTitle: 'Диалог завершен. Скрипт беседы:',
      dialogueFinishedDesc: 'У вас есть 15 секунд на просмотр скрипта. После этого откроется 75-секундный таймер на написание Summary. Заметки запрещены!',
      startSummaryNowBtn: 'Перейти к написанию резюме сразу',
      summaryHeading: 'Напишите Summary (75 сек)',
      wordsCounter: 'Слов:',
      submitSummaryBtn: 'Завершить и продолжить',
      writingPartStep: 'Часть',
      part1Reference: 'Ваш ответ на Часть 1 (доступен только для чтения):',
      emptyTextNotice: '(Текст не был введен)',
      typeResponseHint: 'Введите ваш развернутый ответ на английском языке:',
      writingWordCount: 'Слов:',
      advanceToFollowUpBtn: 'Перейти к Части 2 (Follow-up)',
      finishWritingBtn: 'Завершить Interactive Writing',
      photoStep: 'Фотография',
      photoInstruction: 'Поле описания (1+ предложений):',
      recommendedRange: '(рекомендуется 35-50)',
      finishPhotoTestBtn: 'Завершить блок фото',
      nextPhotoBtn: 'Следующее фото',
      writingSampleTheme: 'Academic Topic (от 100+ слов)',
      oreoHint: 'Используйте схему OREO (Opinion - Reason - Example - Outcome):',
      finishSampleBtn: 'Завершить тест и рассчитать балл',
    },
    testResults: {
      badge: 'Training Simulation Estimate',
      candidateLabel: 'Кандидат:',
      title: 'Итоги тестирования DET',
      overallLabel: 'Тренировочная оценка (Overall Estimate)',
      scaleNote: `Тренировочная шкала DET Academy (10–160, шаг 5) • Диапазон: `,
      highScoreNote: 'Сильный тренировочный результат. Сверьте требования конкретной программы — мы не подтверждаем пороги вузов.',
      midScoreNote: 'Хороший уровень (B2 Upper-Intermediate) — подходит для большинства ВУЗов',
      lowScoreNote: 'Рекомендуется подтянуть лексику и повторить уроки теории',
      subscoresLabel: 'Тренировочные сабскоры (DET-style subscores):',
      literacySub: 'Чтение и письмо',
      comprehensionSub: 'Чтение и аудирование',
      productionSub: 'Письмо и речь',
      conversationSub: 'Диалог и диктант',
      certCardTitle: 'Отчёт DET Academy в реестре платформы',
      certReadyNotice: 'Поздравляем! Вы закрыли 100% теории и набрали ≥ 105 баллов. Сертификат готов.',
      certPendingNotice: 'Для выдачи сертификата необходимо закрыть 100% теории в базе знаний и набрать ≥ 105 баллов.',
      openVerifyBtn: 'Открыть верификацию',
      retakeBtn: 'Пройти тест заново',
      homeBtn: 'Вернуться на главную',
    },
    certificate: {
      officialBadge: 'DET Academy Training Report',
      verifiedTag: 'В реестре платформы',
      certIdLabel: 'ID отчёта:',
      issueDateLabel: 'Дата выдачи:',
      printPdfBtn: 'Печать / PDF',
      awardedTo: 'Тренировочный отчёт выдан',
      awardReason: `за прохождение учебной программы DET Academy и пробного теста. Это оценка платформы, а не официальный результат Duolingo English Test.`,
      verifiedScoreLabel: 'Тренировочная оценка Overall',
      scaleExplanation: 'Шкала DET Academy 10–160 (шаг 5). Это учебный ориентир, а не калиброванный официальный балл.',
      boardTitle: 'DET Academy',
      boardSubtitle: 'Независимая учебная платформа',
      qrLabel: 'QR',
      authenticatedRecord: 'Запись в реестре DET Academy',
      verifyingTitle: 'Верификация сертификата...',
    },
    dashboard: {
      personalPlan: 'План на сегодня',
      candidateFallback: 'Студент',
      examReadiness: 'Готовность к экзамену: ',
      noData: 'нет данных',
      theoryLabel: 'Теория (16 уроков)',
      mockLabel: 'Пробный тест',
      typingLabel: 'Печать',
      todayTitle: 'Задания на сегодня',
      daysLeft: 'дн. до экзамена',
      budget: 'Бюджет',
      diagnosticCta: 'Пройти диагностику (~20 мин)',
      mockCta: 'Полный пробный тест (~1 час)',
      typingCta: 'Тренировать печать',
      taskCompleted: 'Выполнено по учебному событию',
      openTask: 'Открыть задание',
      leagueLoading: 'Загружаем лигу недели…',
      leagueEmpty: 'Лига появится после первого учебного события.',
      leagueError: 'Не удалось загрузить лигу. Обновите страницу.',
      badgePrep: 'Дашборд подготовки',
      badgeSecurity: 'Безопасность и профиль',
      goalLabel: 'Цель:',
      remainingTitle: 'Сколько осталось',
      hoursLeft: 'ч. до финиша',
      theoryModules: 'Теоретические модули',
      remainingLessons: 'Осталось изучить',
      lessonsShort: 'ур.',
      controlTest: 'Контрольный тест',
      scoreMet: 'Порог пройден (≥105 баллов)',
      scoreNeeded: 'Требуется балл ≥ 105',
      inProgress: 'В процессе',
      reportsTitle: 'Отчёты DET Academy',
      reportsHint: 'Сертификат существует только после выдачи сервером. Локальные баллы и прогресс теории не создают документ.',
      verifyById: 'Проверить отчёт по ID',
      lessons16: '17 уроков',
      test105: 'Тест 105+',
      nextStep: 'Рекомендуемый следующий шаг',
      scoreRangeLabel: 'Тренировочный ориентир:',
      confidence: { low: 'низкая уверенность', medium: 'средняя уверенность', high: 'высокая уверенность' },
      goToLesson: 'Перейти к уроку',
      radarSubscores: 'Тренировочные сабскоры DET Academy',
      radarSkills: 'Четыре навыка (Reading, Listening, Writing, Speaking)',
      fromLastSession: 'Показатели по результатам последней сессии',
      takeTestForScores: 'Пройдите пробный тест, чтобы увидеть тренировочные сабскоры',
      overallScore: 'Итоговый балл',
      awaitingTest: 'Ожидает теста',
      vocabTrainer: 'Тренажер лексики',
      srsTitle: 'Академический словарь (SRS)',
      srsDesc: 'Карточки Academic Word List с озвучкой и коллокациями для Writing и Speaking.',
      openVocab: 'Открыть тренажер слов',
      curriculum: 'Программа обучения (16 модулей)',
      studiedOf: 'Изучено',
      markDone: 'Отметить как пройденный',
      markUndone: 'Отметить как не пройденный',
      minutesShort: 'мин',
      openLesson: 'Открыть урок',
      historyTitle: 'История пробных тестирований',
      historyHint: 'Завершённые сессии с тренировочными сабскорами.',
      newTest: 'Сдать новый тест',
      emptyHistory: 'Вы ещё не проходили пробный тест',
      emptyHistoryHint: 'Пробный тест DET Academy считает тренировочную оценку на сервере. Это не официальный алгоритм Duolingo.',
      colDate: 'Дата сессии',
      colScore: 'Итоговый балл',
      colStatus: 'Статус',
      recently: 'Недавно',
      trainingLevel: 'Тренировочный уровень',
      minPerDay: 'мин/день',
      renameProfile: 'Переименовать профиль',
    },
    diagnostic: {
      title: 'Диагностика четырёх навыков',
      subtitle: 'Короткая версия экзамена: Reading, Listening, Writing и Speaking. В конце — диапазон, полнота данных и точки роста.',
      timeTitle: '15–25 минут',
      timeDesc: 'Меньше заданий, чем полный пробный тест',
      skillsTitle: '4 навыка',
      skillsDesc: 'Неизмеренное остаётся неизмеренным',
      serverTitle: 'Серверный результат',
      serverDesc: 'Баллы считает сервер, не браузер',
      disclaimer: 'Диагностика — тренировочная оценка DET Academy, а не официальный результат Duolingo.',
      start: 'Начать диагностику',
      creating: 'Создаём диагностику...',
      createFailed: 'Сервер не создал диагностическую попытку',
    },
    practiceHub: {
      badge: 'Тренажёры DET',
      title: 'Свободная практика',
      subtitle: 'Отрабатывайте типы заданий DET с таймерами. Рекомендуемый путь — задания из кабинета: они влияют на план.',
      mockBanner: 'Когда будете готовы, пройдите полный пробный тест из лобби — не из заброшенной сессии.',
      mockCta: 'Открыть лобби пробного теста',
    },
  },
  en: {
    nav: {
      theory: 'Theory & Guides',
      practice: 'DET Typing Trainer',
      test: 'CAT Mock Simulator',
      verify: 'Verify Certificate',
      institutions: 'Universities',
      admin: 'Admin CRM',
      profile: 'Dashboard',
      logout: 'Logout',
      login: 'Sign In',
      freeMock: 'Take Test',
    },
    navbar: {
      theory: 'Theory',
      drills: 'Practice Hub',
      typing: 'Typing Trainer',
      practice: 'Mock Test',
      verify: 'Verify',
      institutions: 'Universities',
      admin: 'Admin',
      profile: 'Dashboard',
      logout: 'Logout',
      login: 'Sign In',
      freeMock: 'Mock test',
      arena: '1v1 Arena',
      dashboard: 'Dashboard',
      vocabulary: 'Vocabulary',
    },
    hero: {
      badge: `EXAM PREPARATION ${YEAR}`,
      titlePart1: 'PASS DUOLINGO',
      titlePill: '[120+]',
      titlePart2: 'WITH A SMART TRAINER',
      subtitle: 'An adaptive DET Academy platform: an exam simulator, a DET typing trainer, strategy breakdowns, and a practice score range.',
      ctaPrimary: 'Start the test free',
      ctaLoggedIn: 'Continue learning',
      ctaSecondary: 'Explore the theory',
      statsUsers: '',
      statsPassRate: '',
      statsScore: '',
    },
    bento: {
      sectionBadge: 'DET Academy Features',
      sectionTitle: 'Preparation Tools',
      sectionSubtitle: `Diagnostic, today’s plan, ${PRODUCT_FACTS.activeTaskTypes} question types, and a training report — without promising an official DET score.`,
      adaptiveCatTitle: 'Practice mock',
      adaptiveCatDesc: 'The server issues items and computes a training estimate on the 10–160 scale. Difficulty changes by stage; this is DET Academy’s model, not Duolingo’s algorithm.',
      typingTitle: 'DET Typing Trainer',
      typingDesc: 'High-speed touch typing trainer powered by the actual DET academic vocabulary bank.',
      theoryTitle: 'Knowledge base',
      theoryDesc: '16 lessons: exam structure, OREO essay templates, common traps, and photo description formulas.',
      certificateTitle: 'Training report',
      certificateDesc: 'A DET Academy report with QR verification and subscores. Not an official Duolingo certificate.',
      liveFeedback: 'Server timers',
      instantCert: 'Instant score prediction',
      taskTypesMvp: `${PRODUCT_FACTS.activeTaskTypes} question types`,
      vocabCount: '506 academic words',
      certCondition: 'Issuance Criteria:',
      certReq: '100% Theory + Test ≥ 105',
    },
    comparison: {
      title: 'Why students choose DET',
      subtitle: 'The Duolingo English Test is taken online in about an hour. The official DET registry lists 4,087 institutions — always confirm requirements with the university.',
      mapButton: 'DET University Map',
      feature: 'Metric',
      det: 'Duolingo English Test',
      ielts: 'IELTS / TOEFL',
      price: 'Price',
      detPrice: '~$59 USD',
      ieltsPrice: '~$250–320 USD',
      format: 'Test Delivery',
      detFormat: 'Online 24/7 from home',
      ieltsFormat: 'In-person test centers',
      duration: 'Duration',
      detDuration: 'About 1 hour',
      ieltsDuration: '3–4 hours',
      results: 'Score Release',
      detResults: 'Within 48 hours',
      ieltsResults: '3–14 business days',
      recognition: 'Global Acceptance',
      detRecognition: '4,087 institutions in the official DET registry',
      ieltsRecognition: 'Wider recognition; depends on the program',
      sending: 'University Reporting',
      detSending: 'Unlimited free reports to all universities',
      ieltsSending: 'Paid fees per recipient (~$20+)',
      footnote: 'Price, result SLA, and admission requirements change. Treat these figures as a snapshot and confirm on englishtest.duolingo.com.',
    },
    demo: {
      title: 'Mini-Trainer: Read and Select',
      subtitle: 'Identify real English words in 5 seconds.',
      startTitle: 'Test Real Exam Question Formats',
      startDesc: 'Words will flash on screen. Determine within 5 seconds whether the word actually exists in English or is a pseudo-word.',
      secPerWord: '5.0 sec / word',
      demoWordsBadge: '3 Demonstration Words',
      startBtn: 'Start Practice',
      wordProgress: 'Word',
      realOrFake: 'Real or Pseudo-word?',
      realWord: 'Real Word',
      fakeWord: 'Pseudo-word',
      score: 'Your Score',
      completed: 'Demo completed!',
      tryFull: 'Start diagnostic',
      retry: 'Take Demo Again',
      correctPrefix: 'Correct!',
      errorPrefix: 'Incorrect!',
      timeoutPrefix: 'Time expired!',
    },
    sparkPromo: {
      badge1: 'SPARK_Exchange_Program',
      badge2: 'Full_Grant_$20k',
      status: 'Admissions Open',
      campaignStart: 'Application launch: October 2026',
      headlinePart1: 'Win a $20,000 Grant',
      headlinePart2: 'for study in the USA on exchange',
      headlinePart3: 'for next summer',
      description: 'Hands-on mentorship from a SPARK 2026 finalist. Winning essays analysis, document templates, 45-minute 1-on-1 Zoom mock interview simulation, and insider selection strategies.',
      promoCodeLabel: 'Promo Code',
      applyBtn: 'Learn More',
    },
    cookie: {
      text: 'Essential cookies: sign-in and progress. Analytics only after consent.',
      accept: 'Accept',
      decline: 'Essential only',
      privacy: 'Details',
      label: 'Cookie consent',
    },
    footer: {
      tagline: 'Independent DET prep: diagnostic, daily plan, and training mocks.',
      rules: `Question types follow the published DET structure for ${YEAR}`,
      rights: 'All rights reserved.',
      disclaimer: 'DET Academy is an independent educational platform and is not affiliated with Duolingo, Inc.',
      description: 'Independent EdTech prep platform for the Duolingo English Test. Not officially affiliated with Duolingo Inc.',
      navigation: 'Navigation',
      legal: 'Legal',
      modulesTitle: 'Platform Modules',
      theoryLink: 'Theory & Guides',
      typingLink: 'DET Typing Trainer',
      institutionsLink: 'Universities with DET',
      testLink: 'Test Simulator',
      verifyLink: 'Verify Certificate',
      crmLink: 'Admin CRM',
      examTitle: 'DET Exam',
      scoreScaleLabel: 'Score Scale:',
      scoreScaleVal: '10 – 160',
      scoreStepLabel: 'Scale Step:',
      scoreStepVal: '5 points',
      passScoreLabel: 'Target Benchmark:',
      passScoreVal: '115 – 130',
    },
    adBanner: {
      partner: 'Partner',
      learnMore: 'Learn More',
      headerDefaultText: 'Win a $20,000 US exchange study grant for next summer. Promo code DET_ACADEMY',
      footerDefaultText: 'Academic DET Mentorship 130+',
      footerSubtext: 'Personal Speaking & Writing reviews with native English speakers and DET experts.',
      openEnrollment: 'Enrolling Now',
    },
    auth: {
      loginTitle: 'Sign In to Your Account',
      registerTitle: 'Create an Account',
      loginTab: 'Sign In',
      registerTab: 'Register',
      nameLabel: 'Your Full Name (in Latin letters for certificate)',
      namePlaceholder: 'e.g. John Doe',
      emailLabel: 'Email',
      emailPlaceholder: 'student@example.com',
      passwordLabel: 'Password',
      loginBtn: 'Sign In',
      registerBtn: 'Create Account',
      loading: 'Loading...',
      oauthDivider: 'or continue with',
      oauthGoogle: 'Sign in with Google',
      oauthApple: 'Sign in with Apple',
      oauthVk: 'Sign in with VK ID',
      oauthYandex: 'Sign in with Yandex ID',
      quickDemoHeading: 'Quick demo sign-in for testing:',
      demoStudentBtn: 'Student Alex Rivera (100% Theory + Score 125)',
      demoAdminBtn: 'Administrator (CRM Panel + Management)',
      guardTitle: 'Registration Required',
      guardSubtitle: 'Sign in to save progress, take the diagnostic, and receive a DET Academy training report.',
      guardSyncTitle: 'Cloud sync',
      guardSyncDesc: 'Lesson and attempt progress is stored on the server',
      guardCatTitle: 'Practice mock',
      guardCatDesc: 'The server computes a 10–160 training estimate',
      guardCertTitle: 'Report',
      guardCertDesc: 'A platform training report, not an official DET score',
      guardActionBtn: 'Sign In or Register',
    },
    institutions: {
      badge: 'Worldwide University Acceptance',
      countTag: '• 4,087 institutions in the official DET registry',
      title: 'Universities Accepting DET',
      subtitle: 'Catalogue from the official DET registry. Score thresholds, when shown, are platform estimates — confirm them with admissions.',
      statsWorld: '4,087',
      statsWorldLabel: 'DET registry entries',
      statsIvy: 'Unconfirmed',
      statsIvyLabel: 'Thresholds are not university-verified',
      statsAvg: '115–125',
      statsAvgLabel: 'Average Cutoff',
      statsReports: '$0',
      statsReportsLabel: 'Score Reporting',
      searchPlaceholder: 'Search by university name, city or country...',
      allCountries: 'All Countries',
      allCategories: 'All Categories',
      categoriesLabel: 'Categories:',
      scoreAny: 'Any DET Score (105+)',
      score115: 'From 115 points',
      score120: 'From 120 points',
      score125: 'From 125 points',
      score130: 'From 130 points',
      subscoreFilterLabel: 'Subscore Requirements:',
      subscoreAny: 'No Subscore Restrictions',
      subscoreWriting120: 'Writing (Production) ≥ 120',
      subscoreLiteracy120: 'Literacy (Reading/Writing) ≥ 120',
      subscoreAll115: 'All Subscores ≥ 115 (Strict Requirements)',
      subscoreConversation120: 'Conversation (Spoken/Listening) ≥ 120',
      mapHeading: 'Interactive Global Universities Map',
      mapPinsNote: 'Pins display minimum DET score requirements',
      foundLabel: 'Found:',
      sidebarTitle: 'Universities List',
      sidebarSubtitle: 'Click any university to center the map',
      sidebarTakeTest: 'Take Test',
      loadingCatalog: 'Loading university directory...',
      notFoundTitle: 'No Universities Found',
      notFoundDesc: 'Try adjusting your search criteria or lowering the score threshold.',
      minScoreLabel: 'Minimum DET Score:',
      admissionsSite: 'Admissions Website',
      acceptanceLabel: 'Acceptance:',
      ctaBadge: 'Check Your Admissions Score',
      ctaTitle: 'Is Your Score High Enough for Admission?',
      ctaDesc: 'Take the DET Academy diagnostic (~20 min) or a full mock (~1 hour). The server computes a training estimate on the 10–160 scale.',
      ctaTestBtn: 'Start Test Simulator',
      ctaTheoryBtn: 'Explore Test Strategies',
      mapLoading: 'Initializing interactive global university map...',
    },
    typing: {
      badge: 'Blind Typing Emulation',
      tag: '• DET Typing Trainer',
      title: 'DET Touch Typing Trainer',
      subtitle: 'Master fast touch typing without looking at the keyboard using authentic DET academic vocabulary and essay excerpts.',
      modeTime: 'Time',
      modeWords: 'Words',
      detPack: 'DET Academic Pack (506)',
      stdPack: 'English Core 100',
      soundToggle: 'Toggle mechanical keyboard clicks',
      liveWpm: 'Live:',
      accuracyLabel: 'Accuracy:',
      restartEsc: 'Restart (Esc)',
      finishedBadge: 'Speed Test Complete',
      finishedTitle: 'Typing Test Results',
      wpmLabel: 'Words Per Minute (WPM)',
      accuracyStat: 'Accuracy',
      keystrokesLabel: 'Total Keystrokes',
      personalBestLabel: 'Personal Best',
      recommendation: 'For DET timed essays, a sustained speed of at least 45–60 WPM at 95%+ accuracy is strongly recommended.',
      retryBtn: 'Try Again',
    },
    theory: {
      curriculumBadge: `DET Curriculum ${YEAR}`,
      lessonsCount: '16 Comprehensive Modules',
      title: 'DET Knowledge Base & Strategies',
      progressCardLabel: 'Curriculum Progress for Certificate:',
      progressCardStatus: 'completed • Requires 100% + Test ≥105',
      studiedBadge: 'Completed',
      inProgressBadge: 'In Progress',
      lessonPrefix: 'Lesson',
      timingLabel: 'Timing:',
      openGuide: 'Open Guide',
      guardTitle: 'DET Curriculum & Knowledge Base',
      guardSubtitle: 'The complete theoretical guide covering all 16 exam modules, CAT engine rules, 4 subscores, OREO templates, and pitfall analyses requires an account.',
      backToList: 'Back to curriculum overview',
      rulesTitle: 'Exam Rules & Requirements',
      strategyTitle: 'Recommended Procedure',
      stepPrefix: 'Phase',
      formulaTitle: 'Response Structure',
      formulaRulesTitle: 'Core Protocol & Summary',
      mentorIntroTitle: 'Context',
      proTipsTitle: 'Key Recommendations',
      exampleTitle: 'Task Walkthrough',
      exampleScenarioTitle: 'Scenario Walkthrough',
      modelAnswerLabel: 'Sample Response:',
      expertCommentLabel: 'Analysis:',
      pitfallsTitle: 'Common Errors',
      completedQuestion: 'Finished studying this module?',
      completedNote: 'Marking this lesson tracks progress in your profile and unlocks certificate eligibility.',
      markDone: 'Mark as Completed',
      markUndone: 'Completed (Mark Incomplete)',
      prevLesson: 'Previous Lesson',
      nextLesson: 'Next Lesson',
    },
    testLobby: {
      engineBadge: 'DET Academy Mock',
      scoringTag: '• Training estimate 10–160',
      title: 'DET practice mock',
      subtitle: `A full mock with ${PRODUCT_FACTS.activeTaskTypes} question types, server timers, and training subscores. This is a DET Academy estimate, not an official Duolingo result.`,
      sessionBadge: 'Testing Session',
      sessionTitle: 'Session Configuration',
      nameLabel: 'Full Candidate Name (Latin characters):',
      namePlaceholder: 'e.g. John Doe',
      nameHint: 'Will appear on your DET Academy training report.',
      rulesTitle: 'Exam Guidelines:',
      rule1: '• Scratch paper and pens are strictly prohibited.',
      rule2: '• Keep eyes focused on the monitor at all times.',
      rule3: '• All advertisements are suppressed during the test.',
      startBtn: 'Begin Simulation',
      compositionTitle: 'Exam Test Structure',
      mvpStatusLabel: 'MVP Status',
      statusActive: 'Active',
      statusComingSoon: 'In progress',
    },
    testSession: {
      stepLabel: 'Step',
      proctoringWarning: 'Proctoring Active: Look directly at the screen. Notes prohibited.',
      candidateLabel: 'Candidate:',
      sentenceStep: 'Sentence',
      nextBtn: 'Next',
      wordStep: 'Word',
      hotkeysHint: 'Hotkeys:',
      yesKey: 'Yes',
      noKey: 'No',
      playsRemaining: 'Play Audio',
      playingAudio: 'Playing...',
      dictationHint: 'Note: Dictation scores capitalization of the first letter and closing punctuation.',
      submitBtn: 'Submit',
      readingStep: 'Stage',
      readingQuestionHint: 'Click on the target excerpt in the passage on the left:',
      selectWordOption: '[ Select Word ]',
      highlightStatus: 'Highlight Status:',
      highlightSuccess: 'Excerpt successfully selected ✓',
      highlightInstruction: 'Click the relevant passage on the left',
      finishReadingBtn: 'Finish Reading Section',
      nextReadingStepBtn: 'Next Stage',
      listeningPauseTimer: 'Review Pause:',
      listeningSummaryTimer: 'Summary Timer:',
      scenarioLabel: 'Scenario:',
      chooseTurnHint: 'Select your dialogue response (Turn',
      dialogueFinishedTitle: 'Dialogue Complete. Conversation Transcript:',
      dialogueFinishedDesc: 'You have 15 seconds to review the transcript. After that, a 75-second timer opens for your Summary. No notes allowed!',
      startSummaryNowBtn: 'Start writing summary now',
      summaryHeading: 'Write Summary (75 sec)',
      wordsCounter: 'Words:',
      submitSummaryBtn: 'Submit & Continue',
      writingPartStep: 'Part',
      part1Reference: 'Your Part 1 response (read-only reference):',
      emptyTextNotice: '(No text entered)',
      typeResponseHint: 'Type your detailed response in English:',
      writingWordCount: 'Words:',
      advanceToFollowUpBtn: 'Proceed to Part 2 (Follow-up)',
      finishWritingBtn: 'Finish Interactive Writing',
      photoStep: 'Photo',
      photoInstruction: 'Description Field (1+ complete sentences):',
      recommendedRange: '(recommended 35-50 words)',
      finishPhotoTestBtn: 'Finish Photos Section',
      nextPhotoBtn: 'Next Photo',
      writingSampleTheme: 'Academic Topic (100+ words)',
      oreoHint: 'Structure your argument with OREO (Opinion - Reason - Example - Outcome):',
      finishSampleBtn: 'Finish Test & Compute Score',
    },
    testResults: {
      badge: 'Training Simulation Estimate',
      candidateLabel: 'Candidate:',
      title: 'DET Test Results',
      overallLabel: 'Training Overall Estimate',
      scaleNote: `DET Academy training scale (10–160, step 5) • Range: `,
      highScoreNote: 'A strong training result. Confirm the specific program’s requirements — we do not certify university cutoffs.',
      midScoreNote: 'Good (B2 Upper-Intermediate) — qualifies for most global universities',
      lowScoreNote: 'Further vocabulary and strategy review recommended',
      subscoresLabel: 'Training DET-style subscores:',
      literacySub: 'Reading & Writing',
      comprehensionSub: 'Reading & Listening',
      productionSub: 'Writing & Speaking',
      conversationSub: 'Listening & Speaking',
      certCardTitle: 'DET Academy report in the platform registry',
      certReadyNotice: 'Congratulations! You completed 100% of the theory curriculum and achieved ≥ 105 points. Your certificate is ready.',
      certPendingNotice: 'To unlock your certificate, complete 100% of the theory curriculum and achieve a test score ≥ 105.',
      openVerifyBtn: 'View Certificate',
      retakeBtn: 'Retake Test',
      homeBtn: 'Back to Home',
    },
    certificate: {
      officialBadge: 'DET Academy Training Report',
      verifiedTag: 'In platform registry',
      certIdLabel: 'Report ID:',
      issueDateLabel: 'Date Issued:',
      printPdfBtn: 'Print / Save PDF',
      awardedTo: 'Training report issued to',
      awardReason: `for completing the DET Academy curriculum and practice mock. This is a platform estimate, not an official Duolingo English Test score.`,
      verifiedScoreLabel: 'Training Overall estimate',
      scaleExplanation: 'DET Academy scale 10–160 (step 5). A study guide, not a calibrated official score.',
      boardTitle: 'DET Academy',
      boardSubtitle: 'Independent training platform',
      qrLabel: 'QR',
      authenticatedRecord: 'Record in the DET Academy registry',
      verifyingTitle: 'Verifying report...',
    },
    dashboard: {
      personalPlan: 'Today’s plan',
      candidateFallback: 'Student',
      examReadiness: 'Exam readiness: ',
      noData: 'no data',
      theoryLabel: 'Theory (16 lessons)',
      mockLabel: 'Practice mock',
      typingLabel: 'Typing',
      todayTitle: 'Tasks for today',
      daysLeft: 'days until the exam',
      budget: 'Budget',
      diagnosticCta: 'Take diagnostic (~20 min)',
      mockCta: 'Full mock (~1 hour)',
      typingCta: 'Practice typing',
      taskCompleted: 'Completed via a learning event',
      openTask: 'Open task',
      leagueLoading: 'Loading this week’s league…',
      leagueEmpty: 'The league appears after your first learning event.',
      leagueError: 'Could not load the league. Refresh the page.',
      badgePrep: 'Prep dashboard',
      badgeSecurity: 'Security and profile',
      goalLabel: 'Goal:',
      remainingTitle: 'What’s left',
      hoursLeft: 'h to finish',
      theoryModules: 'Theory modules',
      remainingLessons: 'Still to study',
      lessonsShort: 'lsn',
      controlTest: 'Checkpoint mock',
      scoreMet: 'Threshold met (≥105)',
      scoreNeeded: 'Need a score ≥ 105',
      inProgress: 'In progress',
      reportsTitle: 'DET Academy reports',
      reportsHint: 'A report exists only after the server issues it. Local scores and theory progress do not create a document.',
      verifyById: 'Verify a report by ID',
      lessons16: '17 lessons',
      test105: 'Test 105+',
      nextStep: 'Recommended next step',
      scoreRangeLabel: 'Training estimate:',
      confidence: { low: 'low confidence', medium: 'medium confidence', high: 'high confidence' },
      goToLesson: 'Open lesson',
      radarSubscores: 'DET Academy training subscores',
      radarSkills: 'Four skills (Reading, Listening, Writing, Speaking)',
      fromLastSession: 'From the latest completed session',
      takeTestForScores: 'Take a practice mock to see training subscores',
      overallScore: 'Overall estimate',
      awaitingTest: 'Waiting for a test',
      vocabTrainer: 'Vocabulary trainer',
      srsTitle: 'Academic vocabulary (SRS)',
      srsDesc: 'Academic Word List cards with audio and collocations for Writing and Speaking.',
      openVocab: 'Open word trainer',
      curriculum: 'Curriculum (16 modules)',
      studiedOf: 'Completed',
      markDone: 'Mark as completed',
      markUndone: 'Mark as not completed',
      minutesShort: 'min',
      openLesson: 'Open lesson',
      historyTitle: 'Mock history',
      historyHint: 'Completed sessions with training subscores.',
      newTest: 'Start a new mock',
      emptyHistory: 'You have not taken a practice mock yet',
      emptyHistoryHint: 'DET Academy scores the mock on the server. This is not Duolingo’s official algorithm.',
      colDate: 'Session date',
      colScore: 'Overall estimate',
      colStatus: 'Status',
      recently: 'Recently',
      trainingLevel: 'Training level',
      minPerDay: 'min/day',
      renameProfile: 'Rename profile',
    },
    diagnostic: {
      title: 'Four-skill diagnostic',
      subtitle: 'A shorter exam covering Reading, Listening, Writing and Speaking. You get a range, data completeness, and the next gaps to close.',
      timeTitle: '15–25 minutes',
      timeDesc: 'Fewer items than a full mock',
      skillsTitle: '4 skills',
      skillsDesc: 'Unmeasured stays unmeasured',
      serverTitle: 'Server result',
      serverDesc: 'The server scores — not the browser',
      disclaimer: 'The diagnostic is a DET Academy training estimate, not an official Duolingo score.',
      start: 'Start diagnostic',
      creating: 'Creating diagnostic…',
      createFailed: 'The server did not create a diagnostic attempt',
    },
    practiceHub: {
      badge: 'DET drills',
      title: 'Free practice',
      subtitle: 'Drill DET item types with timers. The recommended path is the dashboard queue — those activities update your plan.',
      mockBanner: 'When you are ready, start a full mock from the lobby — not from an abandoned session.',
      mockCta: 'Open mock lobby',
    },
  },
};
