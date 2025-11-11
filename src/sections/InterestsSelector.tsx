// @ts-nocheck
import { useState, useEffect } from 'react';
import './InterestsSelector.css';

export default function InterestsSelector({ previousAnswers, onSubmit }) {
    const previousList = previousAnswers.experiencesandinterests
        || previousAnswers.interests
        || [];

    const [selectedInterests, setSelectedInterests] = useState(previousList);
    const [customInterest, setCustomInterest] = useState('');

    // Use a simple static list for career interests (no generation).
    // The AI/backend will later provide generated skill suggestions only.
    const suggestedInterests = [
        'Technology',
        'Science',
        'Arts & Design',
        'Business & Entrepreneurship',
        'Health & Wellness',
        'Social Impact & Community',
        'Environment & Sustainability',
        'Sports & Recreation',
        'Music',
        'Film & Media',
        'Languages & Culture',
        'Mathematics & Logic',
        'Economics & Finance',
        'Education & Teaching',
        'Writing & Communication',
        'Research & Academia',
        'Gaming',
        'Travel & Geography',
        'Food & Cooking',
        'Fashion & Style'
    ];

    const [pop, setPop] = useState(false);

    // simple pop animation on mount for interest pills
    useEffect(() => {
        setPop(true);
        const t = setTimeout(() => setPop(false), 350);
        return () => clearTimeout(t);
    }, []);

    // Toggle selected interest with fade-out animation
    const toggleInterest = (interest) => {
        if (selectedInterests.includes(interest)) {
            // Mark pill for removal animation
            const pillElement = document.querySelector(`[data-interest="${CSS.escape(interest)}"]`);
            if (pillElement) {
                pillElement.classList.add('pill-removing');
                // Wait for animation to complete before removing from state
                setTimeout(() => {
                    setSelectedInterests(selectedInterests.filter((i) => i !== interest));
                }, 200); // Match pillFadeOut duration
            } else {
                setSelectedInterests(selectedInterests.filter((i) => i !== interest));
            }
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
        <div className="form-section">
            <h2 className="section-title">Select your interests</h2>
            <p className="section-subtitle">Tap any suggested interests or add your own below.</p>

            <div className="pill-grid">
                {suggestedInterests.map((interest) => (
                    <button
                        key={interest}
                        type="button"
                        className={`pill ${selectedInterests.includes(interest) ? 'pill-selected' : ''} ${pop ? 'pill-pop' : ''}`}
                        onClick={() => toggleInterest(interest)}
                    >
                        {interest}
                    </button>
                ))}
            </div>

            <div className="custom-input-row">
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
                        data-interest={interest}
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
                Submit Inputs
            </button>
        </div>
    );
}
