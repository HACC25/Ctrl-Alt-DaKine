// @ts-nocheck
// AI COMMENT: Disabling TypeScript checks so we can stay in JS mode for now.
import { useState } from 'react';
import './Summary.css';

export default function Summary({ answers, onEditInterests, onEditSkills }) {
    const [showPathPreview, setShowPathPreview] = useState(false);

    const goalCopy = typeof answers.whyuh === 'string' && answers.whyuh.trim()
        ? answers.whyuh
        : 'Not provided';
    const interestsList = Array.isArray(answers.experiencesandinterests) ? answers.experiencesandinterests : [];
    const skillsList = Array.isArray(answers.skills) ? answers.skills : [];

    const handleTogglePath = () => {
        // AI COMMENT: Toggle the placeholder path view inside the sidebar.
        setShowPathPreview((prev) => !prev);
    };

    return (
        <div className="summary-sidebar">
            <h2>Your Inputs</h2>
            <div className="summary-content">
                <div className="summary-item">
                    <h3>Career Goal</h3>
                    <p>{goalCopy}</p>
                </div>
                <div className="summary-item">
                    <h3>Career Interests</h3>
                    <ul>
                        {interestsList.length > 0 ? interestsList.map((interest) => (
                            <li key={interest}>{interest}</li>
                        )) : <li>No interests selected</li>}
                    </ul>
                    <button onClick={onEditInterests} className="edit-button">Edit Interests</button>
                </div>
                <div className="summary-item">
                    <h3>Skills</h3>
                    <ul>
                        {skillsList.length > 0 ? skillsList.map((skill) => (
                            <li key={skill}>{skill}</li>
                        )) : <li>No skills selected</li>}
                    </ul>
                    <button onClick={onEditSkills} className="edit-button">Edit Skills</button>
                </div>
            </div>

            <div className="path-actions">
                <button onClick={handleTogglePath} className="edit-button">
                    {showPathPreview ? 'Hide Path Preview' : 'View Path Preview'}
                </button>
                {showPathPreview && (
                    <div className="path-preview">
                        <h3>Your Rainbow Road Path</h3>
                        <p>All done! Your path is being generated...</p>
                        <p className="path-note">Full journey details coming soon.</p>
                    </div>
                )}
            </div>

            <p className="next-step"></p>
        </div>
    );
}
