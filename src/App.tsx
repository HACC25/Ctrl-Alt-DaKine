import { useMemo, useState } from 'react';
import './App.css';

// Minimal types to express the flow (adjust as you build real types)
type QuestionId = 'goal' | 'interests' | 'skills' | 'constraints';
type Question = { id: QuestionId; prompt: string };

type Answers = Partial<Record<QuestionId, string | string[]>>;

type Course = {
  id: string;
  name: string;
  credits?: number;
  typical_semester?: number;
  difficulty?: number;
};

type GeneratedPath = { courses: Course[] };

// Placeholder child-components so this file compiles before you create real ones
function InputTextboxPlaceholder(props: {
  question: string;
  onSubmit: (answer: string) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); props.onSubmit(value); }} style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <input
          aria-label="question-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={props.question}
          style={{ padding: '10px 12px', width: 520, fontSize: 16 }}
        />
        <button type="submit" disabled={!value.trim()}>Next</button>
      </div>
    </form>
  );
}

function PathwaySectionPlaceholder(props: {
  path: GeneratedPath;
  onNodeClick: (course: Course) => void;
}) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2>Pathway (placeholder)</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {props.path.courses.map((c) => (
          <button key={c.id} onClick={() => props.onNodeClick(c)} style={{ textAlign: 'left', padding: 10, borderRadius: 8 }}>
            <strong>{c.id} — {c.name}</strong>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {c.credits ?? '?'} credits • sem {c.typical_semester ?? '?'} • diff {c.difficulty ?? '?'}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function PathwayPopupPlaceholder(props: {
  course: Course;
  onClose: () => void;
  onAsk: (message: string) => void;
}) {
  const [msg, setMsg] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0b1220', color: '#e6eef8', padding: 16, borderRadius: 12, width: 480 }}>
        <h3>{props.course.id} — {props.course.name}</h3>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Ask a question about this course..."
            style={{ flex: 1, padding: '8px 10px' }}
          />
          <button onClick={() => { if (msg.trim()) { props.onAsk(msg); setMsg(''); } }}>Send</button>
          <button onClick={props.onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function InfoSectionPlaceholder(props: { path: GeneratedPath }) {
  const totalCredits = props.path.courses.reduce((sum, c) => sum + (c.credits ?? 0), 0);
  return (
    <section style={{ marginTop: 24 }}>
      <h3>Info (placeholder)</h3>
      <p>Total credits: {totalCredits}</p>
    </section>
  );
}

export default function App() {
  // Questions asked up-front (Phase 1)
  const QUESTIONS: Question[] = useMemo(
    () => [
      { id: 'goal', prompt: "What's your current career goal?" },
      { id: 'interests', prompt: 'List your career interests' },
      { id: 'skills', prompt: 'What are your skills? (comma-separated)' },
      { id: 'constraints', prompt: 'Any constraints? (time, schedule, prerequisites)' },
    ], []
  );

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [path, setPath] = useState<GeneratedPath | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);

  const allQuestionsAnswered = step >= QUESTIONS.length;

  function handleAnswerSubmit(answer: string) {
    const q = QUESTIONS[step];
    const next: Answers = { ...answers, [q.id]: answer };
    setAnswers(next);

    const nextStep = step + 1;
    if (nextStep < QUESTIONS.length) {
      setStep(nextStep);
    } else {
      // Phase 2: generate path (placeholder – call your backend here)
      void generatePath(next);
    }
  }

  async function generatePath(_collected: Answers) {
    setLoading(true);
    try {
      // TODO: replace with real API call: POST /api/generate-path with `collected`
      // const res = await fetch('/api/generate-path', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(collected) });
      // const data: GeneratedPath = await res.json();

      // Placeholder data so UI can render
      const data: GeneratedPath = {
        courses: [
          { id: 'CS101', name: 'Intro to Computer Science', credits: 3, typical_semester: 1, difficulty: 2 },
          { id: 'CS201', name: 'Data Structures', credits: 3, typical_semester: 2, difficulty: 3 },
          { id: 'CS301', name: 'Algorithms', credits: 3, typical_semester: 3, difficulty: 4 },
        ],
      };
      setPath(data);
    } finally {
      setLoading(false);
    }
  }

  function handleNodeClick(course: Course) {
    setSelectedCourse(course);
  }

  function handleAskInPopup(message: string) {
    // TODO: call /api/ask-question with { courseId: selectedCourse?.id, message }
    // For now, no-op.
    console.debug('ask-question', { courseId: selectedCourse?.id, message });
  }

  return (
    <div className="app-container">
      <div>
        <h1 className="title">RAINBOW ROAD</h1>

        {/* Phase 1: Asking Questions */}
        {!allQuestionsAnswered && (
          <InputTextboxPlaceholder
            question={QUESTIONS[step].prompt}
            onSubmit={handleAnswerSubmit}
          />
        )}

        {/* Phase 2: Generating Path (appears below the input) */}
        {loading && <p style={{ marginTop: 16 }}>Generating path…</p>}
        {path && (
          <>
            <PathwaySectionPlaceholder path={path} onNodeClick={handleNodeClick} />
            <InfoSectionPlaceholder path={path} />
          </>
        )}

        {/* Phase 3: Interaction (popup on course click) */}
        {selectedCourse && (
          <PathwayPopupPlaceholder
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
            onAsk={handleAskInPopup}
          />
        )}
      </div>
    </div>
  );
}