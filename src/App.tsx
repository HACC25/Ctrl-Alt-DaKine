import { useMemo, useState } from 'react';
import InputTextbox from './sections/InputTextbox';
import PathwaySection from './sections/PathwaySection';
import PathwayPopup from './sections/PathwayPopup';
import InfoSection from './sections/InfoSection';

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

export default function App() {
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
      void generatePath(next);
    }
  }

  async function generatePath(_collected: Answers) {
    setLoading(true);
    try {
      // TODO: Call your backend API here
      // const res = await fetch('http://localhost:8000/api/generate-path', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(collected)
      // });
      // const data: GeneratedPath = await res.json();

      // Placeholder data
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
    // TODO: Call /api/ask-question
    console.debug('ask-question', { courseId: selectedCourse?.id, message });
  }

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <h1 className="title">RAINBOW ROAD</h1>

        {!allQuestionsAnswered && (
          <InputTextbox
            question={QUESTIONS[step].prompt}
            onSubmit={handleAnswerSubmit}
          />
        )}

        {loading && <p className="loading-text">Generating path…</p>}
        
        {path && (
          <>
            <PathwaySection path={path} onNodeClick={handleNodeClick} />
            <InfoSection path={path} />
          </>
        )}

        {selectedCourse && (
          <PathwayPopup
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
            onAsk={handleAskInPopup}
          />
        )}
      </div>
    </div>
  );
}