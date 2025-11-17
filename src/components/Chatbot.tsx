// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import './Chatbot.css';
import { buildApiUrl } from '../config';

const DEFAULT_REACTIONS = [
  'Hello! I\'m Keala - ready to guide you through UH.',
  'Hi! I\'m Keala - let me know when to react.',
];

const SECTION_ORDER = ['whyuh', 'experiencesandinterests', 'skills', 'map', 'uh-splash'];
const SECTION_LABELS = {
  whyuh: 'Why UH intro',
  experiencesandinterests: 'Interests',
  skills: 'Skills',
  map: 'Map insights',
  'uh-splash': 'UH highlights',
};

function cleanReactionText(text) {
  if (!text) return '';
  return String(text).replace(/undefined/gi, '').replace(/\s+/g, ' ').trim();
}

export default function Chatbot({ campusName, majorName, skills, forceShow, answers }) {
  const [hasEnteredWhyUH, setHasEnteredWhyUH] = useState(false);
  const [reaction, setReaction] = useState(() => cleanReactionText(DEFAULT_REACTIONS[0]));
  const [isFetching, setIsFetching] = useState(false);
  const [typedReaction, setTypedReaction] = useState('');
  const skillsList = useMemo(() => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills.map((skill) => String(skill));
    if (typeof skills === 'object') {
      return Object.values(skills)
        .flatMap((value) => {
          if (!value) return [];
          if (Array.isArray(value)) return value.map((item) => String(item));
          return [String(value)];
        })
        .filter(Boolean);
    }
    return [String(skills)];
  }, [skills]);
  const latestSubmission = useMemo(() => {
    const entries = Object.entries(answers || {});
    if (!entries.length) return null;
    const [section, value] = entries[entries.length - 1];
    const normalizedValue = value ?? '';
    let textValue = '';
    if (typeof normalizedValue === 'string') {
      textValue = normalizedValue;
    } else if (typeof normalizedValue === 'number' || typeof normalizedValue === 'boolean') {
      textValue = String(normalizedValue);
    } else {
      try {
        textValue = JSON.stringify(normalizedValue);
      } catch {
        textValue = '';
      }
    }
    return { section, text: textValue || 'something new' };
  }, [answers]);

  const nextSection = useMemo(() => {
    const parsed = answers || {};
    for (const section of SECTION_ORDER) {
      if (!parsed[section]) return section;
    }
    return null;
  }, [answers]);

  // Reveal Nathan only after the WhyUH section is visible (Get Started was pressed)
  useEffect(() => {
    const whyuhSection = document.getElementById('whyuh');
    if (!whyuhSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredWhyUH(true);
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(whyuhSection);
    return () => observer.disconnect();
  }, []);

  // Fetch a short reaction whenever the answers change
  useEffect(() => {
    if (!hasEnteredWhyUH && !forceShow) return;
    if (!answers || Object.keys(answers).length === 0) return;
    if (!latestSubmission) return;
    const { section: latestSection, text: latestAnswer } = latestSubmission;
    const nextSectionLabel = nextSection ? SECTION_LABELS[nextSection] || nextSection : null;

    let didCancel = false;

    async function fetchReaction() {
      setIsFetching(true);
      try {
        const response = await fetch(buildApiUrl('/api/nathan-reaction'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campusName,
            majorName,
            skills: skillsList,
            answers,
            latestSection,
            latestAnswer,
            nextSection,
            nextSectionLabel,
          }),
        });
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        const text = cleanReactionText(data?.reaction || DEFAULT_REACTIONS[1]);
        if (!didCancel && text) setReaction(text);
      } catch (error) {
        console.warn('Nathan reaction failed', error);
        if (!didCancel) setReaction(cleanReactionText(DEFAULT_REACTIONS[1]));
      } finally {
        if (!didCancel) setIsFetching(false);
      }
    }

    fetchReaction();
    return () => {
      didCancel = true;
    };
  }, [answers, latestSubmission, skillsList, campusName, majorName, hasEnteredWhyUH, forceShow, nextSection]);

  const shouldShow = hasEnteredWhyUH || forceShow;

  useEffect(() => {
    if (!shouldShow || !reaction || isFetching) {
      setTypedReaction('');
      return undefined;
    }

    let cancelled = false;
    let timeoutId;
    setTypedReaction('');

    const typeNext = (index) => {
      if (cancelled) return;
      if (index >= reaction.length) return;
      setTypedReaction((prev) => prev + reaction[index]);
      timeoutId = setTimeout(() => typeNext(index + 1), 30);
    };

    typeNext(0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [reaction, isFetching, shouldShow]);

  useEffect(() => {
    if (!hasEnteredWhyUH && !forceShow) return undefined;

    const detail = {
      reaction,
      isFetching,
      campusName,
      majorName,
      skills: skillsList,
      answers,
      timestamp: Date.now(),
    };
    window.dispatchEvent(new CustomEvent('nathan:reaction', { detail }));

    const handleRequest = () => {
      window.dispatchEvent(new CustomEvent('nathan:context', { detail }));
    };
    window.addEventListener('nathan:request-context', handleRequest);
    return () => window.removeEventListener('nathan:request-context', handleRequest);
  }, [reaction, isFetching, campusName, majorName, skillsList, answers, hasEnteredWhyUH, forceShow]);

  if (!shouldShow) return null;

  return (
    <div className="nathan-pill-wrapper" aria-live="polite">
      <button className="pill-selected nathan-pill" type="button" title={reaction}>
        <span className="nathan-label">Keala</span>
        <span className="nathan-message">
          {isFetching ? 'Thinking…' : typedReaction || reaction}
        </span>
      </button>
    </div>
  );
}
