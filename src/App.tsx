// @ts-nocheck
import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import InputTextbox from './sections/InputTextbox';
import InterestsSelector from './sections/InterestsSelector';
import SkillsSelector from './sections/SkillsSelector';
import Summary from './sections/Summary';
import MapSection from './sections/MapSection';
import SignIn from './components/SignIn';
import Chatbot from './components/Chatbot';
import ChatSidebar from './sections/ChatSidebar';
import { buildApiUrl } from './config';
const HERO_LOGO = '/assets/uh-pathfinder-logo.png';
import './App.css';

const UHManoa = lazy(() => import('./components/UHManoa'));
const UHWestOahu = lazy(() => import('./components/UHWestOahu'));
const UHHilo = lazy(() => import('./components/UHHilo'));
const UHMaui = lazy(() => import('./components/UHMaui'));
// const WindwardCC = lazy(() => import('./components/WindwardCC'));
// const LeewardCC = lazy(() => import('./components/LeewardCC'));
// const KauaiCC = lazy(() => import('./components/KauaiCC'));
// const KapiolaniCC = lazy(() => import('./components/KapiolaniCC'));
// const HonoluluCC = lazy(() => import('./components/HonoluluCC'));

const campusRegistry = [
  { tokens: ['manoa'], component: UHManoa },
  { tokens: ['westoahu', 'kapolei'], component: UHWestOahu },
  { tokens: ['hilo'], component: UHHilo },
  { tokens: ['maui'], component: UHMaui },
  // { tokens: ['windward'], component: WindwardCC },
  // { tokens: ['leeward'], component: LeewardCC },
  // { tokens: ['kauai', 'kauaicc'], component: KauaiCC },
  // { tokens: ['kapiolani'], component: KapiolaniCC },
  // { tokens: ['honolulu'], component: HonoluluCC },
];

function normalizeCampusKey(value) {
  if (!value) return '';
  return value
    .toString()
    .normalize('NFD')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '')
    .toLowerCase();
}

function resolveCampusMatch(value) {
  const normalized = normalizeCampusKey(value);
  if (!normalized) return null;
  for (const entry of campusRegistry) {
    if (entry.tokens.some((token) => normalized.includes(token))) {
      return { component: entry.component, matchedKey: entry.tokens[0] };
    }
  }
  return null;
}

export default function App() {
  // Track whether user is logged in (starts false, shows SignIn overlay)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Store all user answers in one place
  const [answers, setAnswers] = useState({});

  // Store map insights (majors and campuses recommendations)
  const [insights, setInsights] = useState(null);

  // Track whether sidebar is open or closed
  const [showSummary, setShowSummary] = useState(false);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [generatedPath, setGeneratedPath] = useState(null);

  const campusIdentifiers = [insights?.selectedCollegeKey, insights?.selectedCollegeName].filter(Boolean);
  const campusMatch = campusIdentifiers.map((value) => resolveCampusMatch(value)).find(Boolean) || null;
  const CampusComponent = campusMatch?.component || null;
  const matchedCampusKey = campusMatch?.matchedKey || null;

  const scrollContainerRef = useRef(null);

  // Function that scrolls to a section by its id within the main scroll container
  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    const container = scrollContainerRef.current;
    if (!section) return;
    if (container) {
      const targetOffset = section.offsetTop - container.offsetTop;
      container.scrollTo({ top: targetOffset, behavior: 'smooth' });
    } else {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const handleMajorSave = (majorKey, majorLabel) => {
    setAnswers((prev) => ({ ...prev, uhMajorKey: majorKey, uhMajorName: majorLabel }));
  };

  const handlePathGenerated = (path) => {
    setGeneratedPath(path);
    setTimeout(() => scrollToSection('path'), 150);
  };

  // When user submits an answer, save it and go to next section
  function saveAnswerAndGoNext(sectionId, answer) {
    // Save the answer
    const updatedAnswers = { ...answers, [sectionId]: answer };
    setAnswers(updatedAnswers);

    // Figure out which section comes next
    const sectionOrder = ['whyuh', 'experiencesandinterests', 'skills', 'map', 'uh-start'];
    const currentIndex = sectionOrder.indexOf(sectionId);
    const isNotLastSection = currentIndex >= 0 && currentIndex < sectionOrder.length - 1;

    if (isNotLastSection) {
      const nextSectionId = sectionOrder[currentIndex + 1];
      // For the campus section (uh-start), we handle scrolling via a separate useEffect
      // that waits for the lazy-loaded component to mount.
      if (nextSectionId === 'uh-start') return;
      
      // Small delay so the page updates before scrolling
      setTimeout(() => scrollToSection(nextSectionId), 50);
    }
  }

  // Effect to scroll to uh-start when insights are ready and component is mounted
  useEffect(() => {
    if (insights && answers.map) {
      let intervalId;
      let timeoutId;

      // Delay to ensure DOM update and Suspense fallback rendering
      const startDelay = setTimeout(() => {
        const checkAndScroll = () => {
          const section = document.getElementById('uh-start');
          if (section) {
            scrollToSection('uh-start');
            return true;
          }
          return false;
        };

        // Poll for the element
        intervalId = setInterval(() => {
          if (checkAndScroll()) {
            clearInterval(intervalId);
          }
        }, 100);

        // Stop polling after 5 seconds to avoid infinite loop
        timeoutId = setTimeout(() => {
          clearInterval(intervalId);
        }, 5000);
      }, 150);

      return () => {
        clearTimeout(startDelay);
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    }
  }, [insights, answers.map]);

  // Parallax effect for mountain in Why UH section (requestAnimationFrame throttled)
  useEffect(() => {
    const scrollContainer = document.querySelector('.main-content');
    const whyuhSection = document.getElementById('whyuh');
    if (!scrollContainer || !whyuhSection) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const isActive = whyuhSection.classList.contains('section-active');
        if (isActive) {
          const howFarScrolled = scrollContainer.scrollTop;
          const mountainMovement = howFarScrolled * 0.5;
          whyuhSection.style.setProperty('--mountain-offset', `${mountainMovement}px`);
        } else {
          whyuhSection.style.setProperty('--mountain-offset', '0px');
        }
        ticking = false;
      });
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Pause off-screen section animations using IntersectionObserver
  useEffect(() => {
    const sections = document.querySelectorAll('.section');
    if (!sections.length) return;

    const scrollRoot = document.querySelector('.main-content');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-active');
          } else {
            entry.target.classList.remove('section-active');
          }
        });
      },
      {
        root: scrollRoot instanceof HTMLElement ? scrollRoot : null,
        rootMargin: '200px 0px',
        threshold: 0.1,
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // No custom scroll damping — default browser scrolling keeps transitions feeling natural

  useEffect(() => {
    if (matchedCampusKey) {
      setGeneratedPath(null);
    }
  }, [matchedCampusKey]);

  // Listen for chat:ask events to open sidebar and send message
  useEffect(() => {
    const handleAsk = (e) => {
      const question = e.detail?.question;
      if (question) {
        setShowChatSidebar(true);
        // Small delay to ensure sidebar is mounted/visible before sending
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('chat:send-message', { detail: { question } }));
        }, 100);
      }
    };
    window.addEventListener('chat:ask', handleAsk);
    return () => window.removeEventListener('chat:ask', handleAsk);
  }, []);

  return (
    <div className="app-container">
      {/* SignIn overlay - shows until user logs in with nathan/chong
          After login, shows cool sun rising transition then fades out */}
      {!isLoggedIn && <SignIn onSignIn={() => setIsLoggedIn(true)} />}

      <div
        style={{
          width: showSummary ? 'clamp(0px, 75vw, 450px)' : '0%',
          transition: 'width 200ms ease',
          backgroundColor: '#A3BC84',
          overflow: 'hidden',
        }}
      >
        <Summary
          answers={answers}
          insights={insights}
          onEditInterests={() => scrollToSection('experiencesandinterests')}
          onEditSkills={() => scrollToSection('skills')}
          onGenerate={() => scrollToSection('path')}
          isVisible={showSummary}
        />
      </div>

      <div className="main-content" ref={scrollContainerRef} style={{ overflowY: 'auto', position: 'relative' }}>
        <div
          style={{
            position: 'fixed',
            right: showChatSidebar
              ? 'calc(min(75vw, 450px) + 22px)'
              : '20px',
            top: 20,
            zIndex: 50,
            transition: 'right 200ms ease',
          }}
        >
          <Chatbot
            campusName={insights?.selectedCollegeName || insights?.selectedCollegeKey}
            majorName={answers?.uhMajorName}
            skills={answers?.skills}
            forceShow={hasStarted}
            answers={answers}
            onRobotClick={() => setShowChatSidebar(!showChatSidebar)}
          />
        </div>
        <div
          style={{
            position: 'fixed',
            left: showSummary ? 'calc(min(75vw, 450px) + 20px)' : '20px',
            top: 20,
            zIndex: 60,
          }}
        >
          <button onClick={() => setShowSummary(!showSummary)} className="edit-button">
            {showSummary ? '←' : '→'}
          </button>
        </div>

        <div className="main-inner">
          <section id="title" className="section section-title">
            <div className="title-card">
              <h1 className="title sr-only">RAINBOW ROAD</h1>
              <img src={HERO_LOGO} alt="RAINBOW ROAD logo" className="title-logo" loading="lazy" />
              <button
                onClick={() => {
                  setHasStarted(true);
                  scrollToSection('whyuh');
                }}
                className="start-button"
              >
                Get Started
              </button>
            </div>
          </section>

          <section id="whyuh" className="section section-form">
            <InputTextbox
              question="Why do you want to go into the UH System?"
              enableSpeechToText
              onSubmit={(answer) => saveAnswerAndGoNext('whyuh', answer)}
            />
          </section>

          <section id="experiencesandinterests" className="section section-form">
            {/* two simple bubble layers: slow (background) and fast (foreground)
                each layer contains multiple .bubble spans with per-bubble CSS vars
                controlling left, size, duration and delay so each bubble moves at a
                different speed. */}
            <div className="bubbles bubbles--slow" aria-hidden="true">
              <span className="bubble" style={{ '--left': '8%', '--size': '28px', '--duration': '20s', '--delay': '0s' }} />
              <span className="bubble" style={{ '--left': '22%', '--size': '18px', '--duration': '18s', '--delay': '2s' }} />
              <span className="bubble" style={{ '--left': '40%', '--size': '34px', '--duration': '24s', '--delay': '1s' }} />
              <span className="bubble" style={{ '--left': '60%', '--size': '22px', '--duration': '19s', '--delay': '3s' }} />
              <span className="bubble" style={{ '--left': '78%', '--size': '26px', '--duration': '21s', '--delay': '0.5s' }} />
            </div>
            <div className="bubbles bubbles--fast" aria-hidden="true">
              <span className="bubble" style={{ '--left': '12%', '--size': '20px', '--duration': '9s', '--delay': '0s' }} />
              <span className="bubble" style={{ '--left': '30%', '--size': '30px', '--duration': '11s', '--delay': '1s' }} />
              <span className="bubble" style={{ '--left': '48%', '--size': '16px', '--duration': '8s', '--delay': '0.5s' }} />
              <span className="bubble" style={{ '--left': '68%', '--size': '24px', '--duration': '10s', '--delay': '1.5s' }} />
              <span className="bubble" style={{ '--left': '86%', '--size': '14px', '--duration': '7s', '--delay': '0.2s' }} />
            </div>
            <InterestsSelector
              previousAnswers={answers}
              onSubmit={(answer) => saveAnswerAndGoNext('experiencesandinterests', answer)}
            />
          </section>

          <section id="skills" className="section section-form">
            <div className="bubbles bubbles--slow" aria-hidden="true">
              <span className="bubble" style={{ '--left': '8%', '--size': '28px', '--duration': '20s', '--delay': '0s' }} />
              <span className="bubble" style={{ '--left': '22%', '--size': '18px', '--duration': '18s', '--delay': '2s' }} />
              <span className="bubble" style={{ '--left': '40%', '--size': '34px', '--duration': '24s', '--delay': '1s' }} />
              <span className="bubble" style={{ '--left': '60%', '--size': '22px', '--duration': '19s', '--delay': '3s' }} />
              <span className="bubble" style={{ '--left': '78%', '--size': '26px', '--duration': '21s', '--delay': '0.5s' }} />
            </div>
            <div className="bubbles bubbles--fast" aria-hidden="true">
              <span className="bubble" style={{ '--left': '12%', '--size': '20px', '--duration': '9s', '--delay': '0s' }} />
              <span className="bubble" style={{ '--left': '30%', '--size': '30px', '--duration': '11s', '--delay': '1s' }} />
              <span className="bubble" style={{ '--left': '48%', '--size': '16px', '--duration': '8s', '--delay': '0.5s' }} />
              <span className="bubble" style={{ '--left': '68%', '--size': '24px', '--duration': '10s', '--delay': '1.5s' }} />
              <span className="bubble" style={{ '--left': '86%', '--size': '14px', '--duration': '7s', '--delay': '0.2s' }} />
            </div>
            <SkillsSelector
              previousAnswers={answers}
              onSubmit={(answer) => saveAnswerAndGoNext('skills', answer)}
            />
          </section>

          <section id="map" className="section section-map">
            <MapSection
              answers={answers}
              onSubmit={(mapInsights) => {
                setInsights(mapInsights);
                saveAnswerAndGoNext('map', mapInsights);
              }}
            />
          </section>

          {/* University info pages inserted after map
              Only render the UHManoa page when the map has a selected campus
              that corresponds to Manoa (we normalize the campus key and check
              if it includes 'manoa'). This keeps other campus pages from
              rendering until their components are added. */}
          {(insights && answers.map) && (
            <div style={{ minHeight: '100vh', width: '100%' }}>
              {CampusComponent ? (
                <Suspense key={matchedCampusKey} fallback={<div id="uh-start" className="section" style={{ height: '100vh' }}></div>}>
                  <CampusComponent
                    insights={insights}
                    answers={answers}
                    onSaveMajor={handleMajorSave}
                    onGeneratePath={handlePathGenerated}
                    generatedPath={generatedPath}
                  />
                </Suspense>
              ) : (
                <div id="uh-start" className="section" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <h2>Campus info coming soon...</h2>
                </div>
              )}
            </div>
          )}

          {/* Path section — displays the generated path when available */}
          {/* Path is rendered inside UHManoa (between personalize and next steps) */}
        </div>
      </div>

      <div
        style={{
          width: showChatSidebar ? 'clamp(0px, 75vw, 450px)' : '0%',
          transition: 'width 200ms ease',
          backgroundColor: '#A3BC84',
          overflow: 'hidden',
        }}
      >
        <ChatSidebar
          answers={answers}
          insights={insights}
          isVisible={showChatSidebar}
        />
      </div>
    </div>
  );
}