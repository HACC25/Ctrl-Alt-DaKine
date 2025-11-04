// @ts-nocheck
import './Summary.css';

export default function Summary({ answers, onEditInterests, onEditSkills, onGenerate }) {
    // Simple copies of the data
    const goal = answers.whyuh || 'Not provided';
    const interests = answers.experiencesandinterests || [];
    const skills = answers.skills || [];

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

            {/* Generate Path */}
            <div className="generate-actions">
                <button onClick={onGenerate} className="edit-button">Generate Path</button>
            </div>
        </div>
    );
}
