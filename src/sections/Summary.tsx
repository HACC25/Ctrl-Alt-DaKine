import './Summary.css';

export default function Summary({ answers, onEditInterests, onEditSkills }) {
    return (
        <div className="summary-sidebar">
            <h2>Your Inputs</h2>
            <div className="summary-content">
                <div className="summary-item">
                    <h3>Career Goal</h3>
                    <p>{answers.goal || 'Not provided'}</p>
                </div>
                <div className="summary-item">
                    <h3>Career Interests</h3>
                    <ul>
                        {answers.interests?.map(interest => <li key={interest}>{interest}</li>) || <li>No interests selected</li>}
                    </ul>
                    <button onClick={onEditInterests} className="edit-button">Edit Interests</button>
                </div>
                <div className="summary-item">
                    <h3>Skills</h3>
                    <ul>
                        {answers.skills?.map(skill => <li key={skill}>{skill}</li>) || <li>No skills selected</li>}
                    </ul>
                    <button onClick={onEditSkills} className="edit-button">Edit Skills</button>
                </div>
            </div>
            <p className="next-step"></p>
        </div>
    );
}
