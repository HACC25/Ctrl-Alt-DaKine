// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import './Summary.css';

export default function Summary({ answers, insights, onEditInterests, onEditSkills, onGenerate, isVisible }) {
    const goal = answers.whyuh || 'Not provided';
    const interests = answers.experiencesandinterests || [];
    const skills = answers.skills || [];

    // chatbot state
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatMessagesRef = useRef(null);

    // scroll to bottom when messages change
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // send message to AI
    const sendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const userMessage = userInput.trim();
        setUserInput('');
        const updatedMessages = [...messages, { role: 'user', text: userMessage }];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            // Build context with insights data if available
            const context = { goal, interests, skills };

            // Add recommended majors and campuses from map insights
            if (insights) {
                context.recommended_majors = insights.majors?.map(m => ({
                    name: m.name,
                    campus: m.campus,
                    reason: m.reason
                })) || [];

                context.recommended_campuses = insights.campuses?.map(c => ({
                    name: c.name,
                    score: c.score,
                    reason: c.reason
                })) || [];
            }

            const response = await fetch('http://localhost:8000/api/ask-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMessage,
                    context: context,
                    // send previous messages so bot remembers conversation
                    conversation_history: updatedMessages.slice(-6)  // last 6 messages (3 exchanges)
                })
            });

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`summary-sidebar ${!isVisible ? 'hidden' : ''}`}>
            <h2>Your Submitted Inputs</h2>

            <hr />

            {/* Chatbot section */}
            <div className="summary-item">
                <h3>Ask Questions</h3>
                <div className="chat-messages" ref={chatMessagesRef}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`chat-message ${msg.role}`}>
                            <p>{msg.text}</p>
                        </div>
                    ))}
                    {isLoading && <div className="chat-message assistant"><p>Thinking...</p></div>}
                </div>
                <div className="chat-input-row">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask about your career path..."
                        disabled={isLoading}
                    />
                    <button onClick={sendMessage} disabled={isLoading || !userInput.trim()}>Send</button>
                </div>
            </div>

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