import { useState } from 'react';
import InputTextbox from './sections/InputTextbox';
import InterestsSelector from './sections/InterestsSelector';
import SkillsSelector from './sections/SkillsSelector';
import Summary from './sections/Summary';
import './App.css';

export default function App() {
  // The list of questions to ask the user
  const QUESTIONS = [
    { id: 'whyuh', prompt: 'Why do you want to go into the UH System?' },
    { id: 'experiencesandinterests', prompt: 'What have you done so far that you\'ve enjoyed or learned from? Ex: clubs, community activities, school projects, classes, etc.' },
    { id: 'skills', prompt: 'What are your skills?' },
  ];


  // State that tracks current step and answers
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  // Basically checks if we're done
  const currentQuestion = QUESTIONS[step];
  const allQuestionsAnswered = step >= QUESTIONS.length; // Checks if the step is greater than or equal to total questions

  // Go through each question
  const handleAnswerSubmit = (answer: any) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);
    setStep(step + 1);
  };


  // Handlers for editing from sidebar
  const handleEditInterests = () => {
    setStep(1);
  };

  const handleEditSkills = () => {
    setStep(2);
  };

  return (
    <div className="app-container">
      <Summary
        answers={answers}
        onEditInterests={handleEditInterests}
        onEditSkills={handleEditSkills}
      />
      <div className="main-content">
        <h1 className="title">RAINBOW ROAD</h1>

        {(() => {
          // Decide which component to render
          if (allQuestionsAnswered) {
            return <p>All done! Your path is being generated...</p>;
          }

          if (currentQuestion.id === 'experiencesandinterests') {
            return (
              <InterestsSelector
                previousAnswers={answers}
                onSubmit={handleAnswerSubmit}
              />
            );
          }

          if (currentQuestion.id === 'skills') {
            return (
              <SkillsSelector
                previousAnswers={answers}
                onSubmit={handleAnswerSubmit}
              />
            );
          }

          // Default case for other questions
          return (
            <InputTextbox
              question={currentQuestion.prompt}
              onSubmit={handleAnswerSubmit}
            />
          );
        })()}
      </div>
    </div>
  );
}