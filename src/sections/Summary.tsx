import { useState } from 'react';
import './Summary.css';

export default function Summary({ answers, onEditInterests, onEditSkills }) {
    const [showPath, setShowPath] = useState(false);

    // Simple copies of the data
    const goal = answers.whyuh || 'Not provided';
    const interests = answers.experiencesandinterests || [];
    const skills = answers.skills || [];

    // Toggle the "Path Preview" section
    const togglePath = () => {
        setShowPath(!showPath);
    };

    return (
        <div className="summary-sidebar">
            <h2>Your Inputs</h2>

            {/* Career Goal */}
            <div className="summary-item">
                <h3>Career Goal</h3>
                <p>{goal}</p>
            </div>

            {/* Career Interests */}
            <div className="summary-item">
                <h3>Career Interests</h3>
                <ul>
                    {interests.length > 0
                        ? interests.map(interest => <li key={interest}>{interest}</li>)
                        : <li>No interests selected</li>}
                </ul>
                <button onClick={onEditInterests} className="edit-button">Edit Interests</button>
            </div>

            {/* Skills */}
            <div className="summary-item">
                <h3>Skills</h3>
                <ul>
                    {skills.length > 0
                        ? skills.map(skill => <li key={skill}>{skill}</li>)
                        : <li>No skills selected</li>}
                </ul>
                <button onClick={onEditSkills} className="edit-button">Edit Skills</button>
            </div>

            {/* Path Preview */}
            <div className="path-actions">
                <button onClick={togglePath} className="edit-button">
                    {showPath ? 'Hide Path Preview' : 'View Path Preview'}
                </button>

                {showPath && (
                    <div className="path-preview">
                        <h3>Your Rainbow Road Path</h3>
                        <p>All done! Your path is being generated...</p>
                        <p className="path-note">Full journey details coming soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
