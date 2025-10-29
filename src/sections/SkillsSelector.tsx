// @ts-nocheck
// AI COMMENT: Keeping this simple and JavaScript styled for now.
import { useState, useMemo } from 'react';
import './SkillsSelector.css';

export default function SkillsSelector({ previousAnswers, onSubmit }) {
    const previousList = Array.isArray(previousAnswers.skills) ? previousAnswers.skills : [];
    const [selectedSkills, setSelectedSkills] = useState(previousList);
    const [customSkill, setCustomSkill] = useState('');

    // AI COMMENT: Placeholder skill suggestions derived from goals and interests. Replace with AI call later.
    const suggestedSkills = useMemo(() => {
        const goal = typeof previousAnswers.goal === 'string' ? previousAnswers.goal.toLowerCase() : '';
        const rawInterests = Array.isArray(previousAnswers.experiencesandinterests)
            ? previousAnswers.experiencesandinterests
            : Array.isArray(previousAnswers.interests)
                ? previousAnswers.interests
                : [];
        const interestsText = rawInterests.join(' ').toLowerCase();

        const skillsPool = [
            'JavaScript', 'Python', 'Java', 'C++', 'HTML', 'CSS', 'React', 'Node.js',
            'SQL', 'Git', 'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Project Management'
        ];

        return ['Placeholder', ...skillsPool.filter((skill) => {
            const match = skill.toLowerCase();
            if (goal.includes(match)) return true;
            if (interestsText.includes(match)) return true;
            if (goal.includes('web') && ['html', 'css', 'javascript', 'react'].includes(match)) return true;
            if (goal.includes('data') && ['python', 'sql', 'data analysis'].includes(match)) return true;
            if (goal.includes('ai') && ['python', 'machine learning'].includes(match)) return true;
            return false;
        })].slice(0, 9);
    }, [previousAnswers]);

    const toggleSkill = (skill) => {
        const alreadyPicked = selectedSkills.includes(skill);
        if (alreadyPicked) {
            setSelectedSkills(selectedSkills.filter((item) => item !== skill));
        } else {
            setSelectedSkills([...selectedSkills, skill]);
        }
    };

    const addCustomSkill = () => {
        const trimmed = customSkill.trim();
        if (!trimmed || selectedSkills.includes(trimmed)) {
            return;
        }

        setSelectedSkills([...selectedSkills, trimmed]);
        setCustomSkill('');
    };

    const handleKeyDown = (event) => {
        // AI COMMENT: Let Enter add the custom skill quickly.
        if (event.key === 'Enter') {
            event.preventDefault();
            addCustomSkill();
        }
    };

    const handleSubmit = () => {
        if (selectedSkills.length === 0) {
            return;
        }

        onSubmit(selectedSkills);
    };

    return (
        <div className="skills-selector">
            <h2>Select your skills</h2>
            <p>Pick every skill that fits you. We will include all of them in your Rainbow Road plan.</p>

            <div className="pill-grid">
                {suggestedSkills.map((skill) => (
                    <button
                        key={skill}
                        type="button"
                        className={`pill ${selectedSkills.includes(skill) ? 'pill-selected' : ''}`}
                        onClick={() => toggleSkill(skill)}
                    >
                        {skill}
                    </button>
                ))}
            </div>

            <div className="custom-skill">
                <input
                    type="text"
                    value={customSkill}
                    onChange={(event) => setCustomSkill(event.target.value)}
                    placeholder="Add a custom skill..."
                    onKeyDown={handleKeyDown}
                />
                <button onClick={addCustomSkill} disabled={!customSkill.trim()}>
                    Add
                </button>
            </div>

            <div className="selected-pills" aria-live="polite">
                {selectedSkills.length === 0 && <p className="selected-placeholder">No skills picked yet.</p>}
                {selectedSkills.map((skill) => (
                    <button
                        key={skill}
                        type="button"
                        className="pill pill-selected"
                        onClick={() => toggleSkill(skill)}
                    >
                        {skill}
                        <span className="pill-remove">×</span>
                    </button>
                ))}
            </div>

            <button onClick={handleSubmit} disabled={selectedSkills.length === 0} className="submit-button">
                Continue
            </button>
        </div>
    );
}