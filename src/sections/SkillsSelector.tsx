import { useState, useMemo } from 'react';
import './SkillsSelector.css';


export default function SkillsSelector({ previousAnswers, onSubmit }) {

    const [selectedSkills, setSelectedSkills] = useState(previousAnswers.skills || []);
    const [customSkill, setCustomSkill] = useState('');

    // AI generated Placeholder: generate skills based on goal and interests (replace later so it calls AI)
    // TODO: Integrate with AI backend to get skill suggestions
    const suggestedSkills = useMemo(() => {
        const goal = (previousAnswers.goal as string)?.toLowerCase() || '';
        const interests = (previousAnswers.interests as string[])?.join(' ').toLowerCase() || '';

        const skillsPool = [
            'JavaScript', 'Python', 'Java', 'C++', 'HTML', 'CSS', 'React', 'Node.js',
            'SQL', 'Git', 'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Project Management'
        ];

        // Simple matching
        const matched = skillsPool.filter(skill =>
            goal.includes(skill.toLowerCase()) ||
            interests.includes(skill.toLowerCase()) ||
            (goal.includes('web') && ['HTML', 'CSS', 'JavaScript', 'React'].includes(skill)) ||
            (goal.includes('data') && ['Python', 'SQL', 'Data Analysis'].includes(skill)) ||
            (goal.includes('ai') && ['Python', 'Machine Learning'].includes(skill))
        );

        // Always include "Placeholder"
        return ['Placeholder', ...matched].slice(0, 9); // limit to 9
    }, [previousAnswers]);


    // Skill toggle handler (for those skills given by the AI)
    const handleSkillToggle = (skill: string) => {
        setSelectedSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );
    };

    // Add custom skill handler
    const handleAddCustom = () => {
        if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
            setSelectedSkills(prev => [...prev, customSkill.trim()]);
            setCustomSkill('');
        }
    };

    // Submission handler
    const handleSubmit = () => {
        if (selectedSkills.length > 0) {
            onSubmit(selectedSkills);
        }
    };

    // Render the skills selector UI html
    return (
        <div className="skills-selector">
            <h2>Select your skills</h2>

            <div className="skills-grid">
                {suggestedSkills.map(skill => (
                    <label key={skill} className="skill-option">
                        <input
                            type="checkbox"
                            checked={selectedSkills.includes(skill)}
                            onChange={() => handleSkillToggle(skill)}
                        />
                        {skill}
                    </label>
                ))}
            </div>

            <div className="custom-skill">
                <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Add a custom skill..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                />
                <button onClick={handleAddCustom} disabled={!customSkill.trim()}>
                    Add
                </button>
            </div>

            <div className="selected-skills">
                <h3>Selected Skills:</h3>
                <ul>
                    {selectedSkills.map(skill => (
                        <li key={skill} onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skill))}>
                            {skill} <span className="remove">×</span>
                        </li>
                    ))}
                </ul>
            </div>

            <button onClick={handleSubmit} disabled={selectedSkills.length === 0} className="submit-button">
                Continue
            </button>
        </div>
    );
}