// @ts-nocheck
import './Summary.css';

export default function Summary({ answers, insights, onEditInterests, onEditSkills, onGenerate, isVisible }) {
    const goal = answers.whyuh || 'Not provided';
    const interests = answers.experiencesandinterests || [];
    const skills = answers.skills || [];

    return (
        <div className={`summary-sidebar ${!isVisible ? 'hidden' : ''}`}>
            <h2>Your Submitted Inputs</h2>

            <hr />

            {/* UH Goal */}
            <div id="uh-goal" className="summary-item">
                <h3>Why UH?</h3>
                <p>{goal}</p>
            </div>
            <hr />

            {/* Career Interests */}
            <div id="career-interests" className="summary-item">
                <h3>Career Interests</h3>
                <ul>
                    {interests.length > 0
                        ? interests.map(interest => (
                            <li key={interest} className="summary-pill">
                                {interest}
                            </li>
                        ))
                        : <li>No interests selected</li>}
                </ul>
                <button onClick={onEditInterests} className="edit-button">Edit Interests</button>
            </div>
            <hr />
            {/* Skills */}
            <div id="career-skills" className="summary-item">
                <h3>Skills</h3>
                <ul>
                    {skills.length > 0
                        ? skills.map(skill => (
                            <li key={skill} className="summary-pill">
                                {skill}
                            </li>
                        ))
                        : <li>No skills selected</li>}
                </ul>
                <button onClick={onEditSkills} className="edit-button">Edit Skills</button>
            </div>

            <hr />

            {/* Selected College */}
            <div id="selected-college" className="summary-item">
                <h3>Selected College</h3>
                <p>
                    {(
                        // prefer insights.selectedCollege (MapSection sets this on submit)
                        insights?.selectedCollege || (answers?.map && answers.map.selectedCollege) || 'None selected'
                    )}
                </p>
            </div>
            <hr />
            {/* Selected Major (persisted from UH page) */}
            <div id="selected-major" className="summary-item">
                <h3>Selected Major</h3>
                <p>{answers?.uhMajorName ? answers.uhMajorName : 'None selected'}</p>
            </div>
            <hr />

            {/* Generate Path */}
            <div className="generate-actions">
                <button onClick={onGenerate} className="edit-button">Generate Path</button>
            </div>
        </div>
    );
}