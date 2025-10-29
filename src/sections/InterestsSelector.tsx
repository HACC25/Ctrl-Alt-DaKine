// AI COMMENT: Beginner-friendly JS version
import { useState, useMemo } from 'react';
import './InterestsSelector.css';

export default function InterestsSelector({ previousAnswers, onSubmit }) {
    const previousList = previousAnswers.experiencesandinterests
        || previousAnswers.interests
        || [];

    const [selectedInterests, setSelectedInterests] = useState(previousList);
    const [customInterest, setCustomInterest] = useState('');

    // Suggested interests based on user's goal (REPLACE WITH OWN CALL TO AI LATER)
    const suggestedInterests = useMemo(() => {
        const goal = previousAnswers.goal ? previousAnswers.goal.toLowerCase() : '';

        const interestsPool = [
            'Web Development', 'Data Science', 'Machine Learning', 'Mobile Apps', 'Game Development',
            'Cybersecurity', 'Cloud Computing', 'AI Research', 'Software Engineering', 'UI/UX Design'
        ];

        const matched = interestsPool.filter((interest) => {
            const keyword = interest.toLowerCase().split(' ')[0];
            if (goal.includes(keyword)) return true;
            if (goal.includes('web') && interest === 'Web Development') return true;
            if (goal.includes('data') && interest === 'Data Science') return true;
            if (goal.includes('ai') && interest === 'Machine Learning') return true;
            return false;
        });

        return ['Placeholder Interest', ...matched].slice(0, 8);
    }, [previousAnswers]);

    // Toggle selected interest
    const toggleInterest = (interest) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter((i) => i !== interest));
        } else {
            setSelectedInterests([...selectedInterests, interest]);
        }
    };

    // Add custom interest from input
    const addCustomInterest = () => {
        const trimmed = customInterest.trim();
        if (!trimmed || selectedInterests.includes(trimmed)) return;

        setSelectedInterests([...selectedInterests, trimmed]);
        setCustomInterest('');
    };

    // Press Enter to add custom interest
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addCustomInterest();
        }
    };

    // Submit selected interests
    const handleSubmit = () => {
        if (selectedInterests.length > 0) {
            onSubmit(selectedInterests);
        }
    };

    return (
        <div className="interests-selector">
            <h2>Select your interests</h2>
            <p>Tap any suggested interests or add your own below.</p>

            <div className="pill-grid">
                {suggestedInterests.map((interest) => (
                    <button
                        key={interest}
                        type="button"
                        className={`pill ${selectedInterests.includes(interest) ? 'pill-selected' : ''}`}
                        onClick={() => toggleInterest(interest)}
                    >
                        {interest}
                    </button>
                ))}
            </div>

            <div className="custom-interest">
                <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Add a custom interest..."
                    onKeyDown={handleKeyDown}
                />
                <button onClick={addCustomInterest} disabled={!customInterest.trim()}>
                    Add
                </button>
            </div>

            <div className="selected-pills" aria-live="polite">
                {selectedInterests.length === 0 && <p>No interests selected yet.</p>}
                {selectedInterests.map((interest) => (
                    <button
                        key={interest}
                        type="button"
                        className="pill pill-selected"
                        onClick={() => toggleInterest(interest)}
                    >
                        {interest} <span className="pill-remove">×</span>
                    </button>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={selectedInterests.length === 0}
                className="submit-button"
            >
                Continue
            </button>
        </div>
    );
}
