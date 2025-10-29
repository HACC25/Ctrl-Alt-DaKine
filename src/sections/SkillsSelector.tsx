// AI COMMENT: Beginner-friendly JS version
import { useState, useMemo } from 'react';
import './SkillsSelector.css';

export default function SkillsSelector({ previousAnswers, onSubmit }) {
    const previousList = previousAnswers.skills || [];
    const [selectedSkills, setSelectedSkills] = useState(previousList);
    const [customSkill, setCustomSkill] = useState('');

    // Suggested skills based on goal and interests (REPLACE WITH OWN CALL TO AI LATER)
    const suggestedSkills = useMemo(() => {
        const goal = previousAnswers.goal ? previousAnswers.goal.toLowerCase() : '';
        const rawInterests = previousAnswers.experiencesandinterests || previousAnswers.interests || [];
        const interestsText = rawInterests.join(' ').toLowerCase();

        const skillsPool = [
            'JavaScript', 'Python', 'Java', 'C++', 'HTML', 'CSS', 'React', 'Node.js',
            'SQL', 'Git', 'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Project Management'
        ];

        const matchedSkills = skillsPool.filter((skill) => {
            const skillLower = skill.toLowerCase();
            if (goal.includes(skillLower)) return true;
            if (interestsText.includes(skillLower)) return true;

            if (goal.includes('web') && ['html', 'css', 'javascript', 'react'].includes(skillLower)) return true;
            if (goal.includes('data') && ['python', 'sql', 'data analysis'].includes(skillLower)) return true;
            if (goal.includes('ai') && ['python', 'machine learning'].includes(skillLower)) return true;

            return false;
        });

        return ['Placeholder', ...matchedSkills].slice(0, 9);
    }, [previousAnswers]);

    // Add or remove skill from selectedSkills
    const toggleSkill = (skill) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter((s) => s !== skill));
        } else {
            setSelectedSkills([...selectedSkills, skill]);
        }
    };

    // Add custom skill from input
    const addCustomSkill = () => {
        const trimmed = customSkill.trim();
        if (!trimmed || selectedSkills.includes(trimmed)) return;

        setSelectedSkills([...selectedSkills, trimmed]);
        setCustomSkill('');
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addCustomSkill();
        }
    };

    const handleSubmit = () => {
        if (selectedSkills.length > 0) {
            onSubmit(selectedSkills);
        }
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
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Add a custom skill..."
                    onKeyDown={handleKeyDown}
                />
                <button onClick={addCustomSkill} disabled={!customSkill.trim()}>
                    Add
                </button>
            </div>

            <div className="selected-pills">
                {selectedSkills.length === 0 && <p>No skills picked yet.</p>}
                {selectedSkills.map((skill) => (
                    <button
                        key={skill}
                        type="button"
                        className="pill pill-selected"
                        onClick={() => toggleSkill(skill)}
                    >
                        {skill} <span className="pill-remove">×</span>
                    </button>
                ))}
            </div>

            <button onClick={handleSubmit} disabled={selectedSkills.length === 0} className="submit-button">
                Continue
            </button>
        </div>
    );
}
