import { useState, useMemo } from 'react';
import './InterestsSelector.css';
import './InterestsSelector.css';


export default function InterestsSelector({ previousAnswers, onSubmit }) {
    const [selectedInterests, setSelectedInterests] = useState(previousAnswers.interests || []);
    const [customInterest, setCustomInterest] = useState('');


    // AI COMMENT: Placeholder interests based on goal REPLACE WITH OWN CODE LATER
    const suggestedInterests = useMemo(() => {
        const goal = (previousAnswers.goal as string)?.toLowerCase() || '';

        const interestsPool = [
            'Web Development', 'Data Science', 'Machine Learning', 'Mobile Apps', 'Game Development',
            'Cybersecurity', 'Cloud Computing', 'AI Research', 'Software Engineering', 'UI/UX Design'
        ];

        // Simple matching
        const matched = interestsPool.filter(interest =>
            goal.includes(interest.toLowerCase().split(' ')[0]) || // rough match
            (goal.includes('web') && interest === 'Web Development') ||
            (goal.includes('data') && interest === 'Data Science') ||
            (goal.includes('ai') && interest === 'Machine Learning')
        );

        return ['Placeholder Interest', ...matched].slice(0, 8);
    }, [previousAnswers]);

    const handleInterestToggle = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        );
    };

    const handleAddCustom = () => {
        if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
            setSelectedInterests(prev => [...prev, customInterest.trim()]);
            setCustomInterest('');
        }
    };

    const handleSubmit = () => {
        if (selectedInterests.length > 0) {
            onSubmit(selectedInterests);
        }
    };

    return (
        <div className="interests-selector">
            <h2>Select your interests</h2>
            <p>Based on your goal, here are some suggested interests. Select any that apply, and add custom ones if needed.</p>

            <div className="interests-grid">
                {suggestedInterests.map(interest => (
                    <label key={interest} className="interest-option">
                        <input
                            type="checkbox"
                            checked={selectedInterests.includes(interest)}
                            onChange={() => handleInterestToggle(interest)}
                        />
                        {interest}
                    </label>
                ))}
            </div>

            <div className="custom-interest">
                <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Add a custom interest..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                />
                <button onClick={handleAddCustom} disabled={!customInterest.trim()}>
                    Add
                </button>
            </div>

            <div className="selected-interests">
                <h3>Selected Interests:</h3>
                <ul>
                    {selectedInterests.map(interest => (
                        <li key={interest} onClick={() => setSelectedInterests(prev => prev.filter(i => i !== interest))}>
                            {interest} <span className="remove">×</span>
                        </li>
                    ))}
                </ul>
            </div>

            <button onClick={handleSubmit} disabled={selectedInterests.length === 0} className="submit-button">
                Continue
            </button>
        </div>
    );
}