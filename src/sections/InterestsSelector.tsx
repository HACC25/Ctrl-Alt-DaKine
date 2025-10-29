// @ts-nocheck
// AI COMMENT: TypeScript checks are off so we can stick with plain JS style for now.
import { useState, useMemo } from 'react';
import './InterestsSelector.css';

export default function InterestsSelector({ previousAnswers, onSubmit }) {
    const previousList = Array.isArray(previousAnswers.experiencesandinterests)
        ? previousAnswers.experiencesandinterests
        : Array.isArray(previousAnswers.interests)
            ? previousAnswers.interests
            : [];

    const [selectedInterests, setSelectedInterests] = useState(previousList);
    const [customInterest, setCustomInterest] = useState('');

    // AI COMMENT: Placeholder interests based on goal REPLACE WITH OWN CODE LATER
    const suggestedInterests = useMemo(() => {
        const goal = typeof previousAnswers.goal === 'string' ? previousAnswers.goal.toLowerCase() : '';

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

    const toggleInterest = (interest) => {
        const alreadyPicked = selectedInterests.includes(interest);
        if (alreadyPicked) {
            setSelectedInterests(selectedInterests.filter((item) => item !== interest));
        } else {
            setSelectedInterests([...selectedInterests, interest]);
        }
    };

    const addCustomInterest = () => {
        const trimmed = customInterest.trim();
        if (!trimmed || selectedInterests.includes(trimmed)) {
            return;
        }

        setSelectedInterests([...selectedInterests, trimmed]);
        setCustomInterest('');
    };

    const handleKeyDown = (event) => {
        // AI COMMENT: Let Enter add the custom interest quickly.
        if (event.key === 'Enter') {
            event.preventDefault();
            addCustomInterest();
        }
    };

    const handleSubmit = () => {
        if (selectedInterests.length === 0) {
            return;
        }

        onSubmit(selectedInterests);
    };

    return (
        <div className="interests-selector">
            <h2>Select your interests</h2>
            <p>Tap any of the suggested interests below to add them to your list, or write in your own.</p>

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
                    onChange={(event) => setCustomInterest(event.target.value)}
                    placeholder="Add a custom interest..."
                    onKeyDown={handleKeyDown}
                />
                <button onClick={addCustomInterest} disabled={!customInterest.trim()}>
                    Add
                </button>
            </div>

            <div className="selected-pills" aria-live="polite">
                {selectedInterests.length === 0 && <p className="selected-placeholder">No interests selected yet.</p>}
                {selectedInterests.map((interest) => (
                    <button
                        key={interest}
                        type="button"
                        className="pill pill-selected"
                        onClick={() => toggleInterest(interest)}
                    >
                        {interest}
                        <span className="pill-remove">×</span>
                    </button>
                ))}
            </div>

            <button onClick={handleSubmit} disabled={selectedInterests.length === 0} className="submit-button">
                Continue
            </button>
        </div>
    );
}