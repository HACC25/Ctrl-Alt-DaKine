// @ts-nocheck
import { useState, useRef } from 'react';
import InputTextbox from './sections/InputTextbox';
import InterestsSelector from './sections/InterestsSelector';
import SkillsSelector from './sections/SkillsSelector';
import Summary from './sections/Summary';
// Import logo image from assets (the file named `logo` exists in src/assets)
import logo from './assets/logo.png';
import './App.css';

export default function App() {
  // Simple list of sections (kept flat so user can scroll through them)
  const SECTIONS = [
    { id: 'whyuh', prompt: 'Why do you want to go into the UH System?' },
    { id: 'experiencesandinterests', prompt: "What have you done so far that you've enjoyed or learned from? Ex: clubs, community activities, school projects, classes, etc." },
    { id: 'skills', prompt: 'What are your skills?' },
  ];

  // App holds the single source of truth for answers
  const [answers, setAnswers] = useState({});

  // Summary toggle (open/closed)
  const [showSummary, setShowSummary] = useState(false);

  // AI COMMENT: Track the scrollable main area so we can manually scroll between sections
  const mainContentRef = useRef(null);

  // Refs for each section so we can scroll to them
  const titleRef = useRef(null);
  const whyRef = useRef(null);
  const expRef = useRef(null);
  const skillsRef = useRef(null);
  const pathRef = useRef(null);
  const refs = {
    title: titleRef,
    whyuh: whyRef,
    experiencesandinterests: expRef,
    skills: skillsRef,
    path: pathRef,
  };

  // AI COMMENT: very simple, readable scroll helper using element IDs
  // This uses the browser's built-in scrollIntoView which will scroll the
  // nearest scrollable ancestor (our .main-content). It's easy to read
  // and simple to maintain for beginners.
  const scrollInsideMain = (id) => {
    const el = document.getElementById(id);
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Update answers and scroll to next section (if any)
  const handleAnswerSubmit = (id, value) => {
    const newAnswers = { ...answers, [id]: value };
    setAnswers(newAnswers);

    const order = ['whyuh', 'experiencesandinterests', 'skills', 'path'];
    const idx = order.indexOf(id);
    if (idx >= 0 && idx < order.length - 1) {
      const nextId = order[idx + 1];
      // AI COMMENT: small delay to ensure any DOM updates finish, then scroll
      setTimeout(() => scrollInsideMain(nextId), 50);
    }
  };

  const scrollToSection = (id) => {
    scrollInsideMain(id);
  };

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
      <div style={{ width: showSummary ? 320 : 0, transition: 'width 200ms ease' }}>
        {showSummary && (
          <Summary
            answers={answers}
            onEditInterests={() => scrollToSection('experiencesandinterests')}
            onEditSkills={() => scrollToSection('skills')}
            onGenerate={() => scrollToSection('path')}
          />
        )}
      </div>

      <div className="main-content" style={{ overflowY: 'auto' }} ref={mainContentRef}>
        <div style={{ position: 'fixed', left: showSummary ? 340 : 20, top: 20, zIndex: 30 }}>
          <button onClick={() => setShowSummary(!showSummary)} className="edit-button">
            {showSummary ? '←' : '→'}
          </button>
        </div>

        <div className="main-inner">
          <section id="title" ref={titleRef} className="section section-title">
            <div className="title-card">
                {/* Image logo used as the title. Keeps an h1 for semantics but visually hide it. */}
                <h1 className="title sr-only">RAINBOW ROAD</h1>
                <img src={logo} alt="RAINBOW ROAD logo" className="title-logo" />
              <button onClick={() => scrollToSection('whyuh')} className="start-button">Get Started</button>
            </div>
          </section>

          <div className="section-gap" aria-hidden="true" />

          <section id="whyuh" ref={whyRef} className="section section-form">
            <InputTextbox
              question={SECTIONS[0].prompt}
              onSubmit={(v) => handleAnswerSubmit(SECTIONS[0].id, v)}
            />
          </section>

          <div className="section-gap" aria-hidden="true" />

          <section id="experiencesandinterests" ref={expRef} className="section section-form">
            <InterestsSelector
              previousAnswers={answers}
              onSubmit={(v) => handleAnswerSubmit(SECTIONS[1].id, v)}
            />
          </section>

          <div className="section-gap" aria-hidden="true" />

          <section id="skills" ref={skillsRef} className="section section-form">
            <SkillsSelector
              previousAnswers={answers}
              onSubmit={(v) => handleAnswerSubmit(SECTIONS[2].id, v)}
            />
          </section>

          <div className="section-gap" aria-hidden="true" />

          <section id="path" ref={pathRef} className="section section-path">
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
