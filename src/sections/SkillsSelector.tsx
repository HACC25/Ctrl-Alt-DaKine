// @ts-nocheck
import { useState, useEffect } from 'react';
import './SkillsSelector.css';

const DEFAULT_SKILLS = [
    'Place interests to generate skills'
];

export default function SkillsSelector({ previousAnswers, onSubmit }) {
    const previousList = previousAnswers.skills || [];
    const [selectedSkills, setSelectedSkills] = useState(previousList);
    const [customSkill, setCustomSkill] = useState('');
    const [suggestedSkills, setSuggestedSkills] = useState(DEFAULT_SKILLS);
    const [loading, setLoading] = useState(false);
    const [warning, setWarning] = useState('');

    const interests = previousAnswers.experiencesandinterests || previousAnswers.interests || [];
    const [pop, setPop] = useState(false);
    useEffect(() => {
        if (!interests.length) {
            setSuggestedSkills(DEFAULT_SKILLS);
            setLoading(false);
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        async function generateSkills() {
            setLoading(true);
            try {
                const response = await fetch('http://127.0.0.1:8000/api/generate-skills', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ interests }),
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const payload = await response.json();
                
                // Check for warning from backend
                if (payload.warning) {
                    if (!cancelled) {
                        setWarning(payload.warning);
                        // Use skills from backend (which will be defaults) or fallback to local defaults
                        const list = Array.isArray(payload.skills) && payload.skills.length > 0
                            ? payload.skills
                            : DEFAULT_SKILLS;
                        setSuggestedSkills(list);
                    }
                    return;
                }
                
                const list = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload.skills)
                        ? payload.skills
                        : [];

                if (!cancelled) {
                    setWarning('');
                    setSuggestedSkills(list.length ? list : DEFAULT_SKILLS);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('generate-skills error', error);
                    setSuggestedSkills(DEFAULT_SKILLS);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        // Small delay lets the scroll-to-section finish before overlaying loading state
        const timeoutId = setTimeout(generateSkills, 120);
        return () => {
            cancelled = true;
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [JSON.stringify(interests)]);

    // Simple pop animation: when suggestedSkills changes (i.e., generation finished), briefly set `pop` true
    useEffect(() => {
        // skip animation while loading
        if (loading) return;
        // trigger pop animation
        setPop(true);
        const t = setTimeout(() => setPop(false), 350);
        return () => clearTimeout(t);
    }, [JSON.stringify(suggestedSkills), loading]);

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
        <div className="form-section">
            <h2 className="section-title">Select your skills</h2>
            <p className="section-subtitle">Tap any suggested skills or add your own below.</p>

            {warning && (
                <div className="warning-message" role="alert">
                    {warning}
                </div>
            )}

            <div className="pill-grid" aria-live="polite">
                {loading ? (
                    <p className="loading-message">Generating skills...</p>
                ) : suggestedSkills.length === 0 ? (
                    <p className="loading-message">No suggestions yet. Add a custom skill below.</p>
                ) : (
                    suggestedSkills.map((skill) => (
                        <button
                            key={skill}
                            type="button"
                            className={`pill ${selectedSkills.includes(skill) ? 'pill-selected' : ''} ${pop ? 'pill-pop' : ''}`}
                            onClick={() => toggleSkill(skill)}
                        >
                            {skill}
                        </button>
                    ))
                )}
            </div>

            <div className="custom-input-row">
                <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Add a custom skill..."
                    onKeyDown={handleKeyDown}
                />
                <button type="button" onClick={addCustomSkill} disabled={!customSkill.trim()}>
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
                Submit Inputs
            </button>
        </div>
    );
}
