import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import './SignIn.css';

interface SignInProps {
  onSignIn: () => void;
}

const languageOptions = [
  'English',
  'ʻŌlelo Hawaiʻi',
  'Spanish',
  'Tagalog',
  'Japanese',
  'Korean',
  'Chinese',
];

type StudentJourney = 'first-time' | 'transfer' | '';
type ColorVision = 'yes' | 'no' | '';
type ColorBlindType = 'deuteranopia' | 'protanopia' | 'tritanopia' | '';
type Stage = 'signin' | 'questionnaire' | 'transition';

interface QuestionnaireCopy {
  introduction: string;
  languagePrompt: string;
  studentPrompt: string;
  firstTimeLabel: string;
  transferLabel: string;
  colorPrompt: string;
  colorYes: string;
  colorNo: string;
  colorTypePrompt: string;
  deuteranopiaLabel: string;
  protanopiaLabel: string;
  tritanopiaLabel: string;
  submitLabel: string;
}

const translations: Record<string, QuestionnaireCopy> = {
  English: {
    introduction: 'Answer a few quick questions to tailor your UH pathway in the language you choose.',
    languagePrompt: 'Tell us which language feels most comfortable for you.',
    studentPrompt: 'Are you entering the UH system for the first time or transferring in?',
    firstTimeLabel: 'First time entering the UH system',
    transferLabel: 'Transferring from another campus',
    colorPrompt: 'Do you experience color blindness or see colors differently?',
    colorYes: 'Yes',
    colorNo: 'No',
    colorTypePrompt: 'Which type of color blindness do you experience?',
    deuteranopiaLabel: 'Deuteranopia (red-green, most common)',
    protanopiaLabel: 'Protanopia (red-green)',
    tritanopiaLabel: 'Tritanopia (blue-yellow)',
    submitLabel: 'Start my journey',
  },
  'ʻŌlelo Hawaiʻi': {
    introduction: 'Pane i nā nīnau pōkole i kou ʻōlelo punahele no ka ʻike kūpono.',
    languagePrompt: 'E koho i ka ʻōlelo āu e mākaukau ai i ka heluhelu ʻana.',
    studentPrompt: 'He haumāna mua ʻoe i ke kahua UH a i ʻole he hoʻokuʻu mai kekahi campus?',
    firstTimeLabel: 'Komo mua i ke kahua UH',
    transferLabel: 'Hoʻokuʻu mai i kekahi kula ʻē aʻe',
    colorPrompt: 'ʻIke ʻoe i nā waihoʻoluʻu like ʻole?',
    colorYes: 'ʻAe',
    colorNo: 'ʻAʻole',
    colorTypePrompt: 'He aha ka ʻano o kou ʻike waihoʻoluʻu?',
    deuteranopiaLabel: 'Deuteranopia (ʻulaʻula-ʻōmaʻomaʻo)',
    protanopiaLabel: 'Protanopia (ʻulaʻula-ʻōmaʻomaʻo)',
    tritanopiaLabel: 'Tritanopia (polū-melemele)',
    submitLabel: 'Hoʻomaka i ka huakaʻi',
  },
  Spanish: {
    introduction: 'Responde estas preguntas rápidas en el idioma que prefieras.',
    languagePrompt: 'Indícanos qué idioma te resulta más cómodo.',
    studentPrompt: '¿Es tu primera vez en el sistema UH o estás transfiriéndote?',
    firstTimeLabel: 'Primera vez en el sistema UH',
    transferLabel: 'Transferencia desde otro campus',
    colorPrompt: '¿Percibes los colores de forma diferente?',
    colorYes: 'Sí',
    colorNo: 'No',
    colorTypePrompt: '¿Qué tipo de daltonismo experimentas?',
    deuteranopiaLabel: 'Deuteranopatía (rojo-verde, más común)',
    protanopiaLabel: 'Protanopia (rojo-verde)',
    tritanopiaLabel: 'Tritanopia (azul-amarillo)',
    submitLabel: 'Comenzar mi camino',
  },
  Tagalog: {
    introduction: 'Sagutin ang ilang mabilis na tanong sa wikang pipiliin mo.',
    languagePrompt: 'Piliin ang wikang mas komportable kang basahin.',
    studentPrompt: 'Unang beses mo ba sa UH o lumilipat mula sa ibang campus?',
    firstTimeLabel: 'Unang pasok sa sistema ng UH',
    transferLabel: 'Lumilipat mula sa ibang campus',
    colorPrompt: 'Nakakakita ka ba ng mga kulay nang naiiba?',
    colorYes: 'Oo',
    colorNo: 'Hindi',
    colorTypePrompt: 'Anong uri ng kulay-bulag ang mayroon ka?',
    deuteranopiaLabel: 'Deuteranopia (pula-berde, pinaka-karaniwan)',
    protanopiaLabel: 'Protanopia (pula-berde)',
    tritanopiaLabel: 'Tritanopia (asul-dilaw)',
    submitLabel: 'Simulan ang paglalakbay ko',
  },
  Japanese: {
    introduction: '選んだ言語でいくつかの質問に答えてください。',
    languagePrompt: '最も読みやすい言語を選んでください。',
    studentPrompt: 'UHに初めて入学する学生ですか、それとも転校ですか？',
    firstTimeLabel: 'UHシステムへの初参加',
    transferLabel: '他のキャンパスからの編入',
    colorPrompt: '色覚に違いがありますか？',
    colorYes: 'はい',
    colorNo: 'いいえ',
    colorTypePrompt: 'どのタイプの色覚異常がありますか？',
    deuteranopiaLabel: '2型色覚（赤緑色盲、最も一般的）',
    protanopiaLabel: '1型色覚（赤緑色盲）',
    tritanopiaLabel: '3型色覚（青黄色盲）',
    submitLabel: '旅を始める',
  },
  Korean: {
    introduction: '선택한 언어로 빠른 질문에 대답해 주세요.',
    languagePrompt: '가장 편안한 언어를 선택하세요.',
    studentPrompt: 'UH 시스템에 처음 입학하나요, 아니면 캠퍼스 간 이동인가요?',
    firstTimeLabel: 'UH 시스템 첫 입학',
    transferLabel: '다른 캠퍼스에서 전학',
    colorPrompt: '색맹이나 색을 다르게 보시나요?',
    colorYes: '예',
    colorNo: '아니요',
    colorTypePrompt: '어떤 유형의 색맹입니까?',
    deuteranopiaLabel: '녹색맹 (적록색맹, 가장 흔함)',
    protanopiaLabel: '적색맹 (적록색맹)',
    tritanopiaLabel: '청색맹 (청황색맹)',
    submitLabel: '여정을 시작하기',
  },
  Chinese: {
    introduction: '请使用您选择的语言快速回答这些问题。',
    languagePrompt: '请选择您最熟悉的语言。',
    studentPrompt: '您是首次进入UH系统还是从其他校区转学？',
    firstTimeLabel: '首次进入UH系统',
    transferLabel: '从其他校区转学',
    colorPrompt: '您是否有色盲或颜色感知不同？',
    colorYes: '是',
    colorNo: '否',
    colorTypePrompt: '您患有哪种类型的色盲？',
    deuteranopiaLabel: '绿色盲（红绿色盲，最常见）',
    protanopiaLabel: '红色盲（红绿色盲）',
    tritanopiaLabel: '蓝色盲（蓝黄色盲）',
    submitLabel: '开始我的旅程',
  },
};

export default function SignIn({ onSignIn }: SignInProps) {
  const [stage, setStage] = useState<Stage>('signin');
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [sunRising, setSunRising] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [loginHidden, setLoginHidden] = useState(false);
  const [languageIndex, setLanguageIndex] = useState(0);
  const [studentJourney, setStudentJourney] = useState<StudentJourney>('');
  const [colorVision, setColorVision] = useState<ColorVision>('');
  const [colorBlindType, setColorBlindType] = useState<ColorBlindType>('');

  const timersRef = useRef<number[]>([]);
  const preferredLanguage = useMemo(() => languageOptions[languageIndex], [languageIndex]);
  const copy = translations[preferredLanguage] ?? translations.English;
  const canSubmitQuestionnaire = studentJourney !== '' && colorVision !== '' && (colorVision === 'no' || colorBlindType !== '');

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  const resetQuestionnaire = () => {
    setLanguageIndex(0);
    setStudentJourney('');
    setColorVision('');
    setColorBlindType('');
  };

  const handleColorVisionChange = (value: ColorVision) => {
    setColorVision(value);
    if (value === 'no') {
      setColorBlindType('');
    }
  };

  // Get CSS filter based on colorblind type
  const getColorBlindFilter = (): string => {
    if (colorVision !== 'yes' || !colorBlindType) return 'none';
    
    switch (colorBlindType) {
      case 'deuteranopia':
        // Green-blind (most common): simulate missing M-cones
        return 'url(#deuteranopia-filter)';
      case 'protanopia':
        // Red-blind: simulate missing L-cones
        return 'url(#protanopia-filter)';
      case 'tritanopia':
        // Blue-blind: simulate missing S-cones
        return 'url(#tritanopia-filter)';
      default:
        return 'none';
    }
  };

  const handleSignIn = () => {
    if (username.toLowerCase() === 'nathan' && password === 'chong') {
      const loginFadeMs = 600;
      const curtainMs = 2000;
      const sunMs = 3000;
      const fadeMs = 3000;

      setIsAnimating(false);
      setSunRising(false);
      setIsFading(false);
      setLoginHidden(true);

      const t0 = window.setTimeout(() => setIsAnimating(true), loginFadeMs);
      const t1 = window.setTimeout(() => setSunRising(true), loginFadeMs + curtainMs);
      const t2 = window.setTimeout(() => setIsFading(true), loginFadeMs + curtainMs + sunMs);
      const t3 = window.setTimeout(() => {
        onSignIn();
        setStage('signin');
        setIsSignUp(false);
        setIsAnimating(false);
        setSunRising(false);
        setIsFading(false);
        setLoginHidden(false);
        setUsername('');
        setPassword('');
      }, loginFadeMs + curtainMs + sunMs + fadeMs);

      timersRef.current.push(t0, t1, t2, t3);
    } else {
      alert('Invalid credentials! Try username: nathan, password: chong');
      setLoginHidden(false);
    }
  };

  const handleSignUp = () => {
    setIsSignUp(true);
    setStage('questionnaire');
    setLoginHidden(true);
    resetQuestionnaire();
    setIsAnimating(false);
    setSunRising(false);
    setIsFading(false);
  };

  const handleQuestionnaireSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitQuestionnaire) return;
    const transitionMs = 2800;
    const fadeMs = 2600;
    setStage('transition');
    setIsAnimating(true);
    setSunRising(true);

    const transitionTimeout = window.setTimeout(() => {
      setIsFading(true);
      const fadeTimeout = window.setTimeout(() => {
        onSignIn();
        resetQuestionnaire();
        setStage('signin');
        setIsSignUp(false);
        setIsAnimating(false);
        setSunRising(false);
        setIsFading(false);
        setLoginHidden(false);
        setUsername('');
        setPassword('');
      }, fadeMs);
      timersRef.current.push(fadeTimeout);
    }, transitionMs);

    timersRef.current.push(transitionTimeout);
  };

  const toggleForm = () => {
    setIsSignUp((prev) => !prev);
    setStage('signin');
    setLoginHidden(false);
  };

  const showSignIn = stage === 'signin';
  const showQuestionnaire = stage === 'questionnaire' && isSignUp;
  const showTransition = stage === 'transition';

  return (
    <div className={`signin-overlay ${isFading ? 'fade-out' : ''}`}>
      {/* SVG filters for colorblind simulation */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Deuteranopia filter (green-blind) */}
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625 0.375 0   0 0
                                                   0.7   0.3   0   0 0
                                                   0     0.3   0.7 0 0
                                                   0     0     0   1 0"/>
          </filter>
          {/* Protanopia filter (red-blind) */}
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567 0.433 0     0 0
                                                   0.558 0.442 0     0 0
                                                   0     0.242 0.758 0 0
                                                   0     0     0     1 0"/>
          </filter>
          {/* Tritanopia filter (blue-blind) */}
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95  0.05  0     0 0
                                                   0     0.433 0.567 0 0
                                                   0     0.475 0.525 0 0
                                                   0     0     0     1 0"/>
          </filter>
        </defs>
      </svg>
      <div className="scene" style={{ filter: getColorBlindFilter() }}>
        <div className={`clouds ${isAnimating ? 'slide-up' : ''}`}>
          <div className="cloud" style={{ backgroundImage: `url(/assets/cloud.png)` }}></div>
          <div className="cloud" style={{ backgroundImage: `url(/assets/cloud.png)` }}></div>
          <div className="cloud" style={{ backgroundImage: `url(/assets/cloud.png)` }}></div>
          <div className="cloud" style={{ backgroundImage: `url(/assets/cloud.png)` }}></div>
        </div>

        <div className={`sun ${sunRising ? 'rise' : ''}`}></div>
        <div className={`fog ${sunRising ? 'show' : ''}`}></div>

        {showSignIn && (
          <div className={`login-container ${loginHidden ? 'login-hidden' : ''}`}>
            <img src="/assets/uh-pathfinder-logo.png" alt="UH Path Finder" className="logo" />
            {!isSignUp ? (
              <div className="auth-form">
                <h2>Sign In</h2>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleSignIn()}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleSignIn()}
                />
                <button type="button" onClick={handleSignIn}>
                  Sign In
                </button>
                <div className="toggle-text">
                  Don't have an account? <span onClick={toggleForm}>Sign Up</span>
                </div>
              </div>
            ) : (
              <div className="auth-form">
                <h2>Sign Up</h2>
                <input type="text" placeholder="Full Name" />
                <input type="email" placeholder="Email" />
                <input type="password" placeholder="Password" />
                <button type="button" onClick={handleSignUp}>
                  Continue to questions
                </button>
                <div className="toggle-text">
                  Already have an account? <span onClick={toggleForm}>Sign In</span>
                </div>
              </div>
            )}
          </div>
        )}

        {showTransition && <div className="transition-wave visible" aria-hidden="true"></div>}

        {showQuestionnaire && (
          <form className="questionnaire-card show" onSubmit={handleQuestionnaireSubmit}>
            <div className="questionnaire-header">
              <img src="/assets/uh-pathfinder-logo.png" alt="UH Path Finder" className="logo" />
              <div className="questionnaire-title-group">
                <p className="eyebrow">Welcome</p>
                <h1>Help us tailor your start</h1>
                <p className="intro-copy">Answer a few quick questions so we can guide you down the right UH pathway.</p>
                <div className="questionnaire-pill">Personalized guidance</div>
                <p className="translation-copy">{copy.introduction}</p>
              </div>
            </div>

            <div className="questionnaire-body">
              <div className="questionnaire-grid">
              <section className="question-block question-block--full">
              <div className="prompt-header">
                <p className="prompt-title">Which language do you prefer?</p>
                <span className="selection-pill">{preferredLanguage}</span>
              </div>
              <p className="translation-copy">{copy.languagePrompt}</p>
              <input
                type="range"
                min={0}
                max={languageOptions.length - 1}
                step={1}
                value={languageIndex}
                onChange={(event) => setLanguageIndex(Number(event.target.value))}
                aria-label="Preferred language"
                aria-valuetext={preferredLanguage}
                className="language-slider"
              />
              <div
                className="slider-labels"
                aria-hidden="true"
                style={{ '--language-count': languageOptions.length } as CSSProperties}
              >
                {languageOptions.map((label, index) => (
                  <span key={label} className={index === languageIndex ? 'active' : ''}>
                    {label}
                  </span>
                ))}
              </div>
              </section>

              <section className="question-block question-block--stack">
              <p className="prompt-title">Are you a transfer student?</p>
              <p className="translation-copy">{copy.studentPrompt}</p>
              <div className="option-grid">
                <label className={`select-card ${studentJourney === 'first-time' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="studentJourney"
                    value="first-time"
                    checked={studentJourney === 'first-time'}
                    onChange={() => setStudentJourney('first-time')}
                  />
                  <div className="option-content">
                    <span>First time entering the UH system</span>
                    <small>{copy.firstTimeLabel}</small>
                  </div>
                </label>
                <label className={`select-card ${studentJourney === 'transfer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="studentJourney"
                    value="transfer"
                    checked={studentJourney === 'transfer'}
                    onChange={() => setStudentJourney('transfer')}
                  />
                  <div className="option-content">
                    <span>Transferring from another campus</span>
                    <small>{copy.transferLabel}</small>
                  </div>
                </label>
              </div>
              </section>

              <section className="question-block question-block--stack">
              <p className="prompt-title">Do you experience color blindness?</p>
              <p className="translation-copy">{copy.colorPrompt}</p>
              <div className="option-grid compact">
                <label className={`select-card ${colorVision === 'yes' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="colorVision"
                    value="yes"
                    checked={colorVision === 'yes'}
                    onChange={() => handleColorVisionChange('yes')}
                  />
                  <div className="option-content">
                    <span>Yes</span>
                    <small>{copy.colorYes}</small>
                  </div>
                </label>
                <label className={`select-card ${colorVision === 'no' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="colorVision"
                    value="no"
                    checked={colorVision === 'no'}
                    onChange={() => handleColorVisionChange('no')}
                  />
                  <div className="option-content">
                    <span>No</span>
                    <small>{copy.colorNo}</small>
                  </div>
                </label>
              </div>
              </section>

              {colorVision === 'yes' && (
                <section className="question-block question-block--stack">
                  <p className="prompt-title">Which type of color blindness?</p>
                  <p className="translation-copy">{copy.colorTypePrompt}</p>
                  <div className="option-grid">
                    <label className={`select-card ${colorBlindType === 'deuteranopia' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="colorBlindType"
                        value="deuteranopia"
                        checked={colorBlindType === 'deuteranopia'}
                        onChange={() => setColorBlindType('deuteranopia')}
                      />
                      <div className="option-content">
                        <span>Deuteranopia</span>
                        <small>{copy.deuteranopiaLabel}</small>
                      </div>
                    </label>
                    <label className={`select-card ${colorBlindType === 'protanopia' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="colorBlindType"
                        value="protanopia"
                        checked={colorBlindType === 'protanopia'}
                        onChange={() => setColorBlindType('protanopia')}
                      />
                      <div className="option-content">
                        <span>Protanopia</span>
                        <small>{copy.protanopiaLabel}</small>
                      </div>
                    </label>
                    <label className={`select-card ${colorBlindType === 'tritanopia' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="colorBlindType"
                        value="tritanopia"
                        checked={colorBlindType === 'tritanopia'}
                        onChange={() => setColorBlindType('tritanopia')}
                      />
                      <div className="option-content">
                        <span>Tritanopia</span>
                        <small>{copy.tritanopiaLabel}</small>
                      </div>
                    </label>
                  </div>
                </section>
              )}
              </div>

              <div className="question-actions">
                <button type="submit" className="primary-button" disabled={!canSubmitQuestionnaire}>
                {copy.submitLabel}
              </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
