// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import InputTextbox from './sections/InputTextbox';
import InterestsSelector from './sections/InterestsSelector';
import SkillsSelector from './sections/SkillsSelector';
import Summary from './sections/Summary';
import MapSection from './sections/MapSection';
import SignIn from './components/SignIn';
import UHManoa from './components/UHManoa';
import Chatbot from './components/Chatbot';
import logo from './assets/logo.png';
import './App.css';

export default function App() {
  // Track whether user is logged in (starts false, shows SignIn overlay)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Store all user answers in one place
  const [answers, setAnswers] = useState({});

  // Store map insights (majors and campuses recommendations)
  const [insights, setInsights] = useState(null);

  // Track whether sidebar is open or closed
  const [showSummary, setShowSummary] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [generatedPath, setGeneratedPath] = useState(null);

  // Function that scrolls to a section by its id
  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // When user submits an answer, save it and go to next section
  function saveAnswerAndGoNext(sectionId, answer) {
    // Save the answer
    const updatedAnswers = { ...answers, [sectionId]: answer };
    setAnswers(updatedAnswers);

    // Figure out which section comes next
    const sectionOrder = ['whyuh', 'experiencesandinterests', 'skills', 'map', 'uh-splash'];
    const currentIndex = sectionOrder.indexOf(sectionId);
    const isNotLastSection = currentIndex >= 0 && currentIndex < sectionOrder.length - 1;

    if (isNotLastSection) {
      const nextSectionId = sectionOrder[currentIndex + 1];
      // Small delay so the page updates before scrolling
      setTimeout(() => scrollToSection(nextSectionId), 50);
    }
  }

  // Parallax effect for mountain in Why UH section
  useEffect(() => {
    // Find the scrollable container and the whyuh section
    const scrollContainer = document.querySelector('.main-content');
    const whyuhSection = document.getElementById('whyuh');

    // If either doesn't exist, stop here
    if (!scrollContainer || !whyuhSection) return;

    // This function runs every time you scroll
    function handleScroll() {
      // Get how far you've scrolled down (in pixels)
      const howFarScrolled = scrollContainer.scrollTop;

      // Move mountain slower than scroll (multiply by 0.5 for half speed)
      const mountainMovement = howFarScrolled * 0.5;

      // Update the CSS variable that controls mountain position
      whyuhSection.style.setProperty('--mountain-offset', `${mountainMovement}px`);
    }

    // Start listening for scroll events
    scrollContainer.addEventListener('scroll', handleScroll);

    // Clean up when component closes
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
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

      <div className="main-content" style={{ overflowY: 'auto', position: 'relative' }}>
        <div
          style={{
            position: 'fixed',
            right: showSummary ? 'calc(min(75vw, 450px) + 22px)' : '20px',
            top: 20,
            zIndex: 50,
          }}
        >
          <Chatbot
            campusName={insights?.selectedCollegeName || insights?.selectedCollegeKey}
            majorName={answers?.uhMajorName}
            skills={answers?.skills}
            forceShow={hasStarted}
            answers={answers}
          />
        </div>
        <div
          style={{
            position: 'fixed',
            left: showSummary ? 'calc(min(75vw, 450px) + 20px)' : '20px',
            top: 20,
            zIndex: 30,
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
              <img src={logo} alt="RAINBOW ROAD logo" className="title-logo" />
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
          {insights?.selectedCollegeKey && (/manoa/i).test(insights.selectedCollegeKey) && (
            <UHManoa
              insights={insights}
              answers={answers}
              onSaveMajor={(majorKey, majorLabel) => {
                // Keep answers centralized: save the selected UH major under
                // 'uhMajor'. This is used by the Summary and kept across pages.
                setAnswers((prev) => ({ ...prev, uhMajorKey: majorKey, uhMajorName: majorLabel }));
              }}
              onGeneratePath={(path) => {
                setGeneratedPath(path);
                setTimeout(() => scrollToSection('path'), 150);
              }}
              generatedPath={generatedPath}
            />
          )}

          {/* Path section — displays the generated path when available */}
          {/* Path is rendered inside UHManoa (between personalize and next steps) */}
        </div>
      </div>
    </div>
  );
}