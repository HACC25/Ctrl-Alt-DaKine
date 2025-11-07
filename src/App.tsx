// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import InputTextbox from './sections/InputTextbox';
import InterestsSelector from './sections/InterestsSelector';
import SkillsSelector from './sections/SkillsSelector';
import Summary from './sections/Summary';
// Import logo image from assets (the file named `logo` exists in src/assets)
import logo from './assets/logo.png';
import './App.css';

export default function App() {
  // AI COMMENT: Store all user answers in one place
  const [answers, setAnswers] = useState({});

  // AI COMMENT: Track whether sidebar is open or closed
  const [showSummary, setShowSummary] = useState(false);

  // Function that scrolls to a section by its id
  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // AI COMMENT: When user submits an answer, save it and go to next section
  function saveAnswerAndGoNext(sectionId, answer) {
    // Save the answer
    const updatedAnswers = { ...answers, [sectionId]: answer };
    setAnswers(updatedAnswers);

    // Figure out which section comes next
    const sectionOrder = ['whyuh', 'experiencesandinterests', 'skills', 'path'];
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

  // AI COMMENT: Centralized send location (App should be the single sender).
  // Place your network/send logic here (for example, a function that POSTs
  // the final payload to `/api/generate-path`). Keep children components
  // free of network calls. Example payload shape:
  // {
  //   answers: { whyuh, experiencesandinterests, skills },
  //   meta: { ts: Date.now(), client: 'web' }
  // }

  return (
    <div className="app-container">
      {/* Summary panel (can be toggled) */}
      <div style={{ width: showSummary ? 'clamp(0px, 75vw, 450px)' : '0%', transition: 'width 200ms ease', backgroundColor: '#A3BC84', overflow: 'hidden' }}>
        <Summary
          answers={answers}
          onEditInterests={() => scrollToSection('experiencesandinterests')}
          onEditSkills={() => scrollToSection('skills')}
          onGenerate={() => scrollToSection('path')}
          isVisible={showSummary}
        />
      </div>

      <div className="main-content" style={{ overflowY: 'auto' }}>
        <div style={{ position: 'fixed', left: showSummary ? 'calc(min(75vw, 450px) + 20px)' : '20px', top: 20, zIndex: 30 }}>
          <button onClick={() => setShowSummary(!showSummary)} className="edit-button">
            {showSummary ? '←' : '→'}
          </button>
        </div>

        <div className="main-inner">
          <section id="title" className="section section-title">
            <div className="title-card">
              <h1 className="title sr-only">RAINBOW ROAD</h1>
              <img src={logo} alt="RAINBOW ROAD logo" className="title-logo" />
              <button onClick={() => scrollToSection('whyuh')} className="start-button">Get Started</button>
            </div>
          </section>

          <section id="whyuh" className="section section-form">
            <InputTextbox
              question="Why do you want to go into the UH System?"
              onSubmit={(answer) => saveAnswerAndGoNext('whyuh', answer)}
            />
          </section>

          <section id="experiencesandinterests" className="section section-form">
            <InterestsSelector
              previousAnswers={answers}
              onSubmit={(answer) => saveAnswerAndGoNext('experiencesandinterests', answer)}
            />
          </section>

          <section id="skills" className="section section-form">
            <SkillsSelector
              previousAnswers={answers}
              onSubmit={(answer) => saveAnswerAndGoNext('skills', answer)}
            />
          </section>

          <section id="path" className="section section-path">
            <div>
              <h2>Your Path</h2>
              <p>Path content here...</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
