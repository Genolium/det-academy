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
  };
  hero: {
    badge: string;
    titlePart1: string;
    titlePill: string;
    titlePart2: string;
    subtitle: string;
    ctaPrimary: string;
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
      freeMock: 'Пройти тест',
    },
    hero: {
      badge: `ПОДГОТОВКА К ЭКЗАМЕНУ ${YEAR}`,
      titlePart1: 'СДАЙ DUOLINGO',
      titlePill: 'НА 120+',
      titlePart2: 'С УМНЫМ ТРЕНАЖЕРОМ',
      subtitle: 'Интерактивная адаптивная платформа DET Academy: симулятор экзамена, тренажер скоропечатания DET, разбор стратегий и прогнозирование официального балла.',
      ctaPrimary: 'Начать тест бесплатно',
      ctaSecondary: 'Изучить теорию',
      statsUsers: '14,200+ студентов',
      statsPassRate: '96% сдали на 115+',
      statsScore: '125 средний балл',
    },
    bento: {
      sectionBadge: 'DET Academy Features',
      sectionTitle: 'Инструменты подготовки',
      sectionSubtitle: 'Все компоненты для достижения официального балла 120–145 собраны в единый бесшовный интерфейс.',
      adaptiveCatTitle: 'Адаптивный тест',
      adaptiveCatDesc: 'Алгоритм динамически регулирует сложность заданий в реальном времени под ваш уровень от B1 до C2.',
      typingTitle: 'Тренажер скоропечатания DET',
      typingDesc: 'Тренажер слепой печати со специализированным словарем академических эссе и диктантов.',
      theoryTitle: 'Полная база знаний и стратегий',
      theoryDesc: '12 интерактивных уроков, шаблоны эссе OREO, разбор ловушек и формулы описания фото.',
      certificateTitle: 'Верифицируемый сертификат',
      certificateDesc: 'Генерация официального электронного подтверждения с QR-кодом и детализацией сабскоров при балле 105+.',
      liveFeedback: 'Точный тайминг DET',
      instantCert: 'Анализ за 2 секунды',
      taskTypesMvp: '9 типов заданий в MVP',
      vocabCount: '200+ академических слов',
      certCondition: 'Условие выдачи:',
      certReq: '100% теории + Тест ≥ 105',
    },
    comparison: {
      title: 'ПОЧЕМУ ИМЕННО DET?',
      subtitle: 'Duolingo English Test быстрее, доступнее и признается более 5 000 университетов по всему миру (Yale, Columbia, NYU, MIT).',
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
      detDuration: 'Около 60 минут',
      ieltsDuration: '3–4 часа',
      results: 'Срок результатов',
      detResults: '48 часов',
      ieltsResults: '3–14 дней',
      recognition: 'Признание в мире',
      detRecognition: '5,000+ вузов (Лига Плюща, MIT)',
      ieltsRecognition: '11,000+ учреждений',
      sending: 'Отправка в вузы',
      detSending: 'Бесплатно в любое число вузов',
      ieltsSending: 'Платно за каждый отчет (от $20)',
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
      tryFull: 'Пройти полный симулятор теста',
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
      text: 'Мы используем cookie для персонализации тренировок и сохранения прогресса адаптивного тестирования.',
      accept: 'Принять и продолжить',
    },
    footer: {
      tagline: 'Первая специализированная адаптивная EdTech-платформа подготовки к экзамену Duolingo English Test.',
      rules: `Строгое соответствие регламентам Duolingo ${YEAR}`,
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
      guardSubtitle: 'Для сохранения персонального прогресса, расчета прогнозируемого балла 10–160 по шкале DET и формирования сертификата войдите или создайте аккаунт.',
      guardSyncTitle: 'Синхронизация',
      guardSyncDesc: 'Сохранение прогресса уроков и ответов в облаке',
      guardCatTitle: 'CAT-алгоритм',
      guardCatDesc: 'Расчет балла 10–160 с точностью Duolingo',
      guardCertTitle: 'Сертификат',
      guardCertDesc: 'Публичный сертификат с верификацией для вузов',
      guardActionBtn: 'Войти или Зарегистрироваться',
    },
    institutions: {
      badge: 'Worldwide University Acceptance',
      countTag: '• 12 000+ институтов по всему миру',
      title: 'Вузы, принимающие DET',
      subtitle: 'Исследуйте ведущие университеты мира, принимающие сертификаты Duolingo English Test. Фильтруйте по минимальному баллу, странам и категориям Лиги Плюща.',
      statsWorld: '12,000+',
      statsWorldLabel: 'Вузов по миру',
      statsIvy: '100%',
      statsIvyLabel: 'Вузов Лиги Плюща',
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
      score125: 'От 125 баллов (Ivy League / MIT)',
      score130: 'От 130 баллов (NYU / Top Tier)',
      subscoreFilterLabel: 'Фильтр по субскорам:',
      subscoreAny: 'Без ограничений по субскорам',
      subscoreWriting120: 'Writing (Production) ≥ 120 (Канада U15, UBC)',
      subscoreLiteracy120: 'Literacy (чтение/письмо) ≥ 120 (MIT, Harvard)',
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
      ctaDesc: 'Пройдите симулятор адаптивного тестирования CAT Engine на DET Academy. Наш алгоритм рассчитает прогнозируемый балл по официальной 160-балльной шкале за 45 минут.',
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
      detPack: 'DET Academic Pack (200+)',
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
      engineBadge: 'Duolingo English Test CAT Engine',
      scoringTag: '• Оценка 10–160',
      title: 'Симулятор экзамена DET',
      subtitle: 'Полноценный адаптивный тест с 9 активными механиками, серверными таймерами и детальным расчетом сабскоров.',
      sessionBadge: 'Сессия тестирования',
      sessionTitle: 'Параметры сессии',
      nameLabel: 'Имя и фамилия (латиницей):',
      namePlaceholder: 'e.g. John Doe',
      nameHint: 'Будет указано в вашем электронном сертификате.',
      rulesTitle: 'Правила экзамена:',
      rule1: '• Запрещено пользоваться черновиками и ручками.',
      rule2: '• Не отводите взгляд от экрана.',
      rule3: '• Реклама во время сессии полностью скрыта.',
      startBtn: 'Начать тестирование',
      compositionTitle: 'Состав экзаменационного теста',
      mvpStatusLabel: 'Статус в MVP',
      statusActive: 'Активно',
      statusComingSoon: 'Coming Soon (Микрофон)',
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
      badge: 'Official Simulation Score',
      candidateLabel: 'Кандидат:',
      title: 'Итоги тестирования DET',
      overallLabel: 'Прогнозируемый итоговый балл (Overall Score)',
      scaleNote: `Шкала Duolingo English Test (10–160, шаг 5) • Диапазон: `,
      highScoreNote: 'Отличный уровень (C1 Advanced) — подходит для Yale, MIT, Columbia',
      midScoreNote: 'Хороший уровень (B2 Upper-Intermediate) — подходит для большинства ВУЗов',
      lowScoreNote: 'Рекомендуется подтянуть лексику и повторить уроки теории',
      subscoresLabel: 'Официальные сабскоры (DET Subscores):',
      literacySub: 'Чтение и письмо',
      comprehensionSub: 'Чтение и аудирование',
      productionSub: 'Письмо и речь',
      conversationSub: 'Диалог и диктант',
      certCardTitle: 'Верифицируемый сертификат DET Academy',
      certReadyNotice: 'Поздравляем! Вы закрыли 100% теории и набрали ≥ 105 баллов. Сертификат готов.',
      certPendingNotice: 'Для выдачи сертификата необходимо закрыть 100% теории в базе знаний и набрать ≥ 105 баллов.',
      openVerifyBtn: 'Открыть верификацию',
      retakeBtn: 'Пройти тест заново',
      homeBtn: 'Вернуться на главную',
    },
    certificate: {
      officialBadge: 'Official DET Academy Simulation Certificate',
      verifiedTag: 'Verified',
      certIdLabel: 'Certificate ID:',
      issueDateLabel: 'Дата выдачи:',
      printPdfBtn: 'Печать / PDF',
      awardedTo: 'This certificate is proudly awarded to',
      awardReason: `for successfully completing the full curriculum of DET Academy and demonstrating high proficiency on the adaptive test simulation according to ${YEAR} examination standards.`,
      verifiedScoreLabel: 'Verified Overall DET Score',
      scaleExplanation: 'Scale 10–160 (increments of 5). Score prediction conforms to empirical Duolingo English Test distributions.',
      boardTitle: 'DET Academy Examination Board',
      boardSubtitle: 'Accredited Automated Evaluation Engine',
      qrLabel: 'QR VERIFY',
      authenticatedRecord: '✓ Authenticated Record',
      verifyingTitle: 'Верификация сертификата...',
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
      freeMock: 'Take Test',
    },
    hero: {
      badge: `EXAM PREPARATION ${YEAR}`,
      titlePart1: 'ACE DUOLINGO',
      titlePill: 'SCORE 120+',
      titlePart2: 'WITH SMART SIMULATION',
      subtitle: 'Interactive adaptive EdTech platform: exam simulator, DET typing trainer, trap analysis, and accurate score forecasting.',
      ctaPrimary: 'Start Free Mock Test',
      ctaSecondary: 'Study Theory',
      statsUsers: '14,200+ students',
      statsPassRate: '96% scored 115+',
      statsScore: '125 average score',
    },
    bento: {
      sectionBadge: 'DET Academy Features',
      sectionTitle: 'Preparation Tools',
      sectionSubtitle: 'Every tool you need to secure an official 120–145 score engineered in a seamless interface.',
      adaptiveCatTitle: 'Adaptive Test',
      adaptiveCatDesc: 'Dynamic multistage difficulty scaling from B1 up to C2 based on your real-time responses.',
      typingTitle: 'DET Typing Trainer',
      typingDesc: 'High-speed touch typing trainer powered by the actual DET academic vocabulary bank.',
      theoryTitle: 'Comprehensive Knowledge Base',
      theoryDesc: '12 detailed guides, OREO essay templates, trap breakdowns, and image description formulas.',
      certificateTitle: 'Verifiable Certificate',
      certificateDesc: 'Automated verified credential with QR verification and subscore breakdown upon scoring 105+.',
      liveFeedback: 'Strict DET Timers',
      instantCert: 'Instant score prediction',
      taskTypesMvp: '9 Active Mechanics in MVP',
      vocabCount: '200+ Academic Words',
      certCondition: 'Issuance Criteria:',
      certReq: '100% Theory + Test ≥ 105',
    },
    comparison: {
      title: 'WHY CHOOSE DUOLINGO ENGLISH TEST?',
      subtitle: 'DET is 4x cheaper, faster, and accepted by 5,000+ top universities worldwide including Yale, Columbia, NYU, MIT.',
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
      detDuration: '~60 minutes',
      ieltsDuration: '3–4 hours',
      results: 'Score Release',
      detResults: 'Within 48 hours',
      ieltsResults: '3–14 business days',
      recognition: 'Global Acceptance',
      detRecognition: '5,000+ institutions (Ivy League, MIT)',
      ieltsRecognition: '11,000+ institutions',
      sending: 'University Reporting',
      detSending: 'Unlimited free reports to all universities',
      ieltsSending: 'Paid fees per recipient (~$20+)',
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
      tryFull: 'Start Full DET Simulator',
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
      text: 'We use cookies to personalize test sessions and preserve your adaptive testing progress.',
      accept: 'Accept & Continue',
    },
    footer: {
      tagline: 'Leading independent adaptive EdTech platform for Duolingo English Test preparation.',
      rules: `Strict compliance with ${YEAR} Duolingo protocols`,
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
      guardSubtitle: 'To save your personal progress, compute estimated scores on the 10–160 DET scale, and generate verifiable certificates, please sign in or create an account.',
      guardSyncTitle: 'Cloud Sync',
      guardSyncDesc: 'Preserve lesson progress and quiz submissions in the cloud',
      guardCatTitle: 'CAT Engine',
      guardCatDesc: 'Computer adaptive scoring benchmarked to official standards',
      guardCertTitle: 'Certificate',
      guardCertDesc: 'Public verifiable credential with unique QR code for universities',
      guardActionBtn: 'Sign In or Register',
    },
    institutions: {
      badge: 'Worldwide University Acceptance',
      countTag: '• 12,000+ Global Institutions',
      title: 'Universities Accepting DET',
      subtitle: 'Discover world-leading universities accepting Duolingo English Test certificates. Filter by minimum cutoff scores, countries, and Ivy League status.',
      statsWorld: '12,000+',
      statsWorldLabel: 'Global Institutions',
      statsIvy: '100%',
      statsIvyLabel: 'Ivy League Universities',
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
      score125: 'From 125 points (Ivy League / MIT)',
      score130: 'From 130 points (NYU / Top Tier)',
      subscoreFilterLabel: 'Subscore Requirements:',
      subscoreAny: 'No Subscore Restrictions',
      subscoreWriting120: 'Writing (Production) ≥ 120 (Canada U15, UBC)',
      subscoreLiteracy120: 'Literacy (Reading/Writing) ≥ 120 (MIT, Harvard)',
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
      ctaDesc: 'Take our CAT Engine simulation test on DET Academy. Our computer adaptive algorithm calculates your estimated score on the official 160-point scale in 45 minutes.',
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
      detPack: 'DET Academic Pack (200+)',
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
      engineBadge: 'Duolingo English Test CAT Engine',
      scoringTag: '• Scale 10–160',
      title: 'DET Exam Simulator',
      subtitle: 'Complete adaptive exam experience with 9 active mechanics, server-grade timers, and granular subscore evaluation.',
      sessionBadge: 'Testing Session',
      sessionTitle: 'Session Configuration',
      nameLabel: 'Full Candidate Name (Latin characters):',
      namePlaceholder: 'e.g. John Doe',
      nameHint: 'Will appear exactly as typed on your official certificate.',
      rulesTitle: 'Exam Guidelines:',
      rule1: '• Scratch paper and pens are strictly prohibited.',
      rule2: '• Keep eyes focused on the monitor at all times.',
      rule3: '• All advertisements are suppressed during the test.',
      startBtn: 'Begin Simulation',
      compositionTitle: 'Exam Test Structure',
      mvpStatusLabel: 'MVP Status',
      statusActive: 'Active',
      statusComingSoon: 'Coming Soon (Microphone)',
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
      badge: 'Official Simulation Score',
      candidateLabel: 'Candidate:',
      title: 'DET Test Results',
      overallLabel: 'Estimated Overall DET Score',
      scaleNote: `Duolingo English Test Scale (10–160, step 5) • Range: `,
      highScoreNote: 'Outstanding (C1 Advanced) — competitive for Yale, MIT, Columbia',
      midScoreNote: 'Good (B2 Upper-Intermediate) — qualifies for most global universities',
      lowScoreNote: 'Further vocabulary and strategy review recommended',
      subscoresLabel: 'Official DET Subscores:',
      literacySub: 'Reading & Writing',
      comprehensionSub: 'Reading & Listening',
      productionSub: 'Writing & Speaking',
      conversationSub: 'Listening & Speaking',
      certCardTitle: 'Verifiable DET Academy Certificate',
      certReadyNotice: 'Congratulations! You completed 100% of the theory curriculum and achieved ≥ 105 points. Your certificate is ready.',
      certPendingNotice: 'To unlock your certificate, complete 100% of the theory curriculum and achieve a test score ≥ 105.',
      openVerifyBtn: 'View Certificate',
      retakeBtn: 'Retake Test',
      homeBtn: 'Back to Home',
    },
    certificate: {
      officialBadge: 'Official DET Academy Simulation Certificate',
      verifiedTag: 'Verified',
      certIdLabel: 'Certificate ID:',
      issueDateLabel: 'Date Issued:',
      printPdfBtn: 'Print / Save PDF',
      awardedTo: 'This certificate is proudly awarded to',
      awardReason: `for successfully completing the full curriculum of DET Academy and demonstrating high proficiency on the adaptive test simulation according to ${YEAR} examination standards.`,
      verifiedScoreLabel: 'Verified Overall DET Score',
      scaleExplanation: 'Scale 10–160 (increments of 5). Score prediction conforms to empirical Duolingo English Test distributions.',
      boardTitle: 'DET Academy Examination Board',
      boardSubtitle: 'Accredited Automated Evaluation Engine',
      qrLabel: 'QR VERIFY',
      authenticatedRecord: '✓ Authenticated Record',
      verifyingTitle: 'Verifying certificate authenticity...',
    },
  },
};
